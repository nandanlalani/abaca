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

    // Calculate leave duration
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const leaveDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    // Calculate salary deduction for sick leave
    let salaryDeduction = 0;
    let deductionReason = '';

    if (leave_type === 'sick') {
      try {
        // Get employee profile to fetch salary information
        const profile = await Profile.findOne({ employee_id: req.user.employee_id });
        if (profile && profile.salary_structure && profile.salary_structure.basic) {
          const dailySalary = profile.salary_structure.basic / 30; // Assuming 30 working days per month
          
          // Get employee's leave balance
          const currentYear = new Date().getFullYear();
          const leaveBalance = profile.leave_balance || {};
          const sickLeaveBalance = leaveBalance.sick || 12; // Default 12 sick days per year
          
          // Count already taken sick leaves this year
          const takenSickLeaves = await Leave.countDocuments({
            employee_id: req.user.employee_id,
            leave_type: 'sick',
            status: 'approved',
            start_date: {
              $gte: new Date(currentYear, 0, 1),
              $lte: new Date(currentYear, 11, 31)
            }
          });

          const remainingSickLeaves = Math.max(0, sickLeaveBalance - takenSickLeaves);
          
          if (leaveDays > remainingSickLeaves) {
            const unpaidDays = leaveDays - remainingSickLeaves;
            salaryDeduction = Math.round(dailySalary * unpaidDays);
            deductionReason = `${unpaidDays} unpaid sick leave days (exceeded annual limit of ${sickLeaveBalance} days)`;
          }
        }
      } catch (calculationError) {
        console.error('Error calculating salary deduction:', calculationError);
        // Continue without deduction if calculation fails
      }
    }

    const leave = new Leave({
      employee_id: req.user.employee_id,
      user_id: req.user.user_id,
      leave_type,
      start_date: startDate,
      end_date: endDate,
      remarks,
      salary_deduction: salaryDeduction,
      deduction_reason: deductionReason,
      created_by: req.user.user_id,
      history: [{
        action: 'applied',
        actor_id: req.user.user_id,
        timestamp: new Date()
      }]
    });

    await leave.save();

    // Notify admin and HR users - with error handling
    try {
      const adminUsers = await User.find({
        role: { $in: ['admin', 'hr'] }
      }).select('user_id');

      const io = req.app.get('io');
      
      for (const admin of adminUsers) {
        try {
          const notification = new Notification({
            user_id: admin.user_id,
            type: 'leave_request',
            title: 'New Leave Request',
            message: `Employee ${req.user.employee_id} applied for ${leave_type} leave`,
            metadata: { leave_id: leave.leave_id }
          });
          
          await notification.save();
          
          // Emit real-time notification - with error handling
          if (io) {
            io.to(admin.user_id).emit('notification', notification);
          }
        } catch (notificationError) {
          console.error('Failed to create notification for admin:', admin.user_id, notificationError);
        }
      }
    } catch (notificationError) {
      console.error('Failed to send notifications:', notificationError);
      // Don't fail the leave request if notifications fail
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
      comment: remarks,
      timestamp: new Date()
    };

    leave.status = status;
    leave.approver_id = req.user.user_id;
    leave.approver_comment = remarks;
    leave.admin_remarks = remarks; // Add this field for frontend compatibility
    if (!leave.history) leave.history = [];
    leave.history.push(historyEntry);
    
    await leave.save();

    // Send notifications - with error handling
    try {
      // Send email notification
      const user = await User.findOne({ employee_id: leave.employee_id }).select('email');
      if (user && user.email) {
        try {
          await sendLeaveNotification(user.email, status, remarks);
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
        }
      }

      // Create in-app notification
      try {
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
        if (io) {
          io.to(leave.user_id).emit('notification', notification);
        }
      } catch (notificationError) {
        console.error('Failed to create in-app notification:', notificationError);
      }
    } catch (notificationError) {
      console.error('Failed to send notifications:', notificationError);
      // Don't fail the leave update if notifications fail
    }

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