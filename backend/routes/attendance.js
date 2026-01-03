const express = require('express');
const { Attendance } = require('../models');
const { authenticate, requireAdminOrHR } = require('../middleware/auth');
const { format } = require('date-fns');

const router = express.Router();

// Check in
router.post('/check-in', authenticate, async (req, res) => {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Check if already checked in today
    const existingAttendance = await Attendance.findOne({
      employee_id: req.user.employee_id,
      date: today
    });

    if (existingAttendance && existingAttendance.check_in) {
      return res.status(400).json({
        success: false,
        message: 'Already checked in today'
      });
    }

    const checkInTime = new Date();

    if (existingAttendance) {
      // Update existing record
      existingAttendance.check_in = checkInTime;
      existingAttendance.status = 'present';
      await existingAttendance.save();
      
      return res.json({
        success: true,
        message: 'Checked in successfully',
        attendance: existingAttendance
      });
    } else {
      // Create new attendance record
      const attendance = new Attendance({
        employee_id: req.user.employee_id,
        user_id: req.user.user_id,
        date: today,
        check_in: checkInTime,
        status: 'present',
        created_by: req.user.user_id
      });

      await attendance.save();

      res.json({
        success: true,
        message: 'Checked in successfully',
        attendance
      });
    }
  } catch (error) {
    console.error('Check in error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Check out
router.post('/check-out', authenticate, async (req, res) => {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const attendance = await Attendance.findOne({
      employee_id: req.user.employee_id,
      date: today
    });

    if (!attendance || !attendance.check_in) {
      return res.status(400).json({
        success: false,
        message: 'No check-in found for today'
      });
    }

    if (attendance.check_out) {
      return res.status(400).json({
        success: false,
        message: 'Already checked out'
      });
    }

    const checkOutTime = new Date();
    const totalMinutes = Math.floor((checkOutTime - attendance.check_in) / (1000 * 60));

    attendance.check_out = checkOutTime;
    attendance.total_minutes = totalMinutes;
    await attendance.save();

    res.json({
      success: true,
      message: 'Checked out successfully',
      attendance
    });
  } catch (error) {
    console.error('Check out error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get my attendance
router.get('/me', authenticate, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const query = { employee_id: req.user.employee_id };
    
    if (start_date && end_date) {
      query.date = { $gte: start_date, $lte: end_date };
    }

    const records = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(100);

    res.json({
      success: true,
      attendance: records
    });
  } catch (error) {
    console.error('Get my attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all attendance (Admin/HR only)
router.get('/', authenticate, requireAdminOrHR, async (req, res) => {
  try {
    const { employee_id, start_date, end_date } = req.query;
    
    const query = {};
    
    if (employee_id) {
      query.employee_id = employee_id;
    }
    
    if (start_date && end_date) {
      query.date = { $gte: start_date, $lte: end_date };
    }

    const records = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(1000);

    res.json({
      success: true,
      attendance: records
    });
  } catch (error) {
    console.error('Get all attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update attendance (Admin/HR only)
router.put('/:attendance_id', authenticate, requireAdminOrHR, async (req, res) => {
  try {
    const { attendance_id } = req.params;
    const { status, notes } = req.body;

    const attendance = await Attendance.findOneAndUpdate(
      { attendance_id },
      {
        $set: {
          status,
          notes,
          updated_by: req.user.user_id
        }
      },
      { new: true }
    );

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    res.json({
      success: true,
      message: 'Attendance updated',
      attendance
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;