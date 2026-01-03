const express = require('express');
const { Attendance, Leave, Profile } = require('../models');
const { authenticate, requireAdminOrHR } = require('../middleware/auth');

const router = express.Router();

// Attendance report
router.get('/attendance', authenticate, requireAdminOrHR, async (req, res) => {
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
      .limit(1000)
      .lean();

    // Calculate statistics
    const stats = {
      total_days: records.length,
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      half_day: records.filter(r => r.status === 'half_day').length,
      leave: records.filter(r => r.status === 'leave').length,
      total_hours: records.reduce((sum, r) => sum + (r.total_minutes || 0), 0) / 60
    };

    res.json({
      success: true,
      records,
      stats
    });
  } catch (error) {
    console.error('Attendance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Leave report
router.get('/leaves', authenticate, requireAdminOrHR, async (req, res) => {
  try {
    const { employee_id, start_date, end_date, leave_type } = req.query;
    
    const query = {};
    
    if (employee_id) {
      query.employee_id = employee_id;
    }
    
    if (leave_type) {
      query.leave_type = leave_type;
    }
    
    if (start_date && end_date) {
      query.start_date = { $gte: new Date(start_date) };
      query.end_date = { $lte: new Date(end_date) };
    }

    const leaves = await Leave.find(query)
      .sort({ created_at: -1 })
      .limit(1000)
      .lean();

    // Add employee names and calculate days
    const leavesWithDetails = await Promise.all(
      leaves.map(async (leave) => {
        const profile = await Profile.findOne({ employee_id: leave.employee_id })
          .select('first_name last_name')
          .lean();
        
        const days = Math.ceil((leave.end_date - leave.start_date) / (1000 * 60 * 60 * 24)) + 1;
        
        return {
          ...leave,
          employee_name: profile 
            ? `${profile.first_name} ${profile.last_name}` 
            : 'Unknown',
          days
        };
      })
    );

    // Calculate statistics
    const stats = {
      total_requests: leavesWithDetails.length,
      pending: leavesWithDetails.filter(l => l.status === 'pending').length,
      approved: leavesWithDetails.filter(l => l.status === 'approved').length,
      rejected: leavesWithDetails.filter(l => l.status === 'rejected').length,
      total_days: leavesWithDetails.reduce((sum, l) => sum + l.days, 0),
      by_type: {}
    };

    // Group by leave type
    leavesWithDetails.forEach(leave => {
      if (!stats.by_type[leave.leave_type]) {
        stats.by_type[leave.leave_type] = 0;
      }
      stats.by_type[leave.leave_type]++;
    });

    res.json({
      success: true,
      leaves: leavesWithDetails,
      stats
    });
  } catch (error) {
    console.error('Leave report error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Employee summary report
router.get('/employee-summary', authenticate, requireAdminOrHR, async (req, res) => {
  try {
    const { employee_id } = req.query;
    
    if (!employee_id) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }

    // Get employee profile
    const profile = await Profile.findOne({ employee_id }).lean();
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Get current month attendance
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const startDateStr = startOfMonth.toISOString().split('T')[0];
    const endDateStr = endOfMonth.toISOString().split('T')[0];

    const attendance = await Attendance.find({
      employee_id,
      date: { $gte: startDateStr, $lte: endDateStr }
    }).lean();

    // Get leave requests
    const leaves = await Leave.find({
      employee_id,
      start_date: { $gte: startOfMonth },
      end_date: { $lte: endOfMonth }
    }).lean();

    // Calculate statistics
    const attendanceStats = {
      total_days: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      half_day: attendance.filter(a => a.status === 'half_day').length,
      leave: attendance.filter(a => a.status === 'leave').length,
      total_hours: attendance.reduce((sum, a) => sum + (a.total_minutes || 0), 0) / 60
    };

    const leaveStats = {
      total_requests: leaves.length,
      pending: leaves.filter(l => l.status === 'pending').length,
      approved: leaves.filter(l => l.status === 'approved').length,
      rejected: leaves.filter(l => l.status === 'rejected').length
    };

    res.json({
      success: true,
      employee: profile,
      attendance_stats: attendanceStats,
      leave_stats: leaveStats,
      recent_attendance: attendance.slice(-10),
      recent_leaves: leaves.slice(-5)
    });
  } catch (error) {
    console.error('Employee summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;