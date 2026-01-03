const express = require('express');
const { body, validationResult } = require('express-validator');
const { Leave, User, Profile, Notification } = require('../models');
const { authenticate, requireAdminOrHR } = require('../middleware/auth');
const { sendLeaveNotification } = require('../utils/email');

const router = express.Router();

// Apply for leave
router.post('/', authenticate, [
  body('leave_type').isIn(['sick', 'casual', 'annual', 'maternity', 'paternity']).withMessage('Invalid leave type'),
  body('start_date').isISO8601().withMessage('Valid start date is required'),
  body('end_date').isISO8601().withMessage('Valid end date is required'),
  body('remarks').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { leave_type, start_date, end_date, remarks } = req.body;

    const leave = new Leave({
      employee_id: req.user.employee_id,
      user_id: req.user.user_id,
      leave_type,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      remarks,
      history: [{
        action: 'applied',
        actor_id: req.user.user_id
      }]
    });

    await leave.save();

    // Notify admin and HR users
    const adminUsers = await User.find({
      role: { $in: ['admin', 'hr'] }
    }).select('user_id');

    const io = req.app.get('io');
    
    for (const admin of adminUsers) {
      const notification = new Notification({
        user_id: admin.user_id,
        type: 'leave_request',
        title: 'New Leave Request',
        message: `Employee ${req.user.employee_id} applied for ${leave_type} leave`,
        metadata: { leave_id: leave.leave_id }
      });
      
      await notification.save();
      
      // Emit real-time notification
      io.to(admin.user_id).emit('notification', notification);
    }

    res.status(201).json({
      success: true,
      message: 'Leave request submitted',
      leave
    });
  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get my leaves
router.get('/me', authenticate, async (req, res) => {
  try {
    const leaves = await Leave.find({ employee_id: req.user.employee_id })
      .sort({ created_at: -1 })
      .limit(100);

    res.json({
      success: true,
      leaves
    });
  } catch (error) {
    console.error('Get my leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all leaves (Admin/HR only)
router.get('/', authenticate, requireAdminOrHR, async (req, res) => {
  try {
    const { status } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }

    const leaves = await Leave.find(query)
      .sort({ created_at: -1 })
      .limit(1000)
      .lean();

    // Add employee names
    const leavesWithNames = await Promise.all(
      leaves.map(async (leave) => {
        const profile = await Profile.findOne({ employee_id: leave.employee_id })
          .select('first_name last_name')
          .lean();
        
        return {
          ...leave,
          employee_name: profile 
            ? `${profile.first_name} ${profile.last_name}` 
            : 'Unknown'
        };
      })
    );

    res.json({
      success: true,
      leaves: leavesWithNames
    });
  } catch (error) {
    console.error('Get all leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update leave status (Admin/HR only)
router.put('/:leave_id', authenticate, requireAdminOrHR, [
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  body('admin_remarks').optional().isString(),
  body('comment').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { leave_id } = req.params;
    const { status, admin_remarks, comment } = req.body;
    const remarks = admin_remarks || comment; // Support both field names

    const leave = await Leave.findOne({ leave_id });
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Add to history
    const historyEntry = {
      action: status,
      actor_id: req.user.user_id,
      comment: remarks
    };

    leave.status = status;
    leave.approver_id = req.user.user_id;
    leave.approver_comment = remarks;
    leave.admin_remarks = remarks; // Add this field for frontend compatibility
    leave.history.push(historyEntry);
    
    await leave.save();

    // Send email notification
    const user = await User.findOne({ employee_id: leave.employee_id }).select('email');
    if (user) {
      await sendLeaveNotification(user.email, status, remarks);
    }

    // Create in-app notification
    const notification = new Notification({
      user_id: leave.user_id,
      type: 'leave_update',
      title: `Leave Request ${status.toUpperCase()}`,
      message: `Your leave request has been ${status}`,
      metadata: { leave_id, status }
    });
    await notification.save();

    // Emit real-time notification
    const io = req.app.get('io');
    io.to(leave.user_id).emit('notification', notification);

    res.json({
      success: true,
      message: `Leave ${status}`,
      leave
    });
  } catch (error) {
    console.error('Update leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;