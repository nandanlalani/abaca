const express = require('express');
const { Attendance, Leave, Profile, Payroll } = require('../models');
const { authenticate, requireAdminOrHR } = require('../middleware/auth');

const router = express.Router();

// Helper function to convert data to CSV
const convertToCSV = (data, headers) => {
  if (!data || data.length === 0) {
    return headers.join(',') + '\n';
  }

  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header] || '';
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });

  return csvHeaders + '\n' + csvRows.join('\n');
};

// Helper function to format date for CSV
const formatDateForCSV = (date) => {
  if (!date) return '';
  try {
    return new Date(date).toISOString().split('T')[0];
  } catch (error) {
    return '';
  }
};

// Helper function to format time for CSV
const formatTimeForCSV = (datetime) => {
  if (!datetime) return '';
  try {
    return new Date(datetime).toLocaleTimeString('en-US', { hour12: false });
  } catch (error) {
    return '';
  }
};

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

// Export attendance report as CSV
router.get('/attendance/export', authenticate, requireAdminOrHR, async (req, res) => {
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
      .limit(5000)
      .lean();

    // Get employee names
    const employeeIds = [...new Set(records.map(r => r.employee_id))];
    const profiles = await Profile.find({ employee_id: { $in: employeeIds } })
      .select('employee_id first_name last_name')
      .lean();
    
    const employeeMap = {};
    profiles.forEach(p => {
      employeeMap[p.employee_id] = `${p.first_name} ${p.last_name}`;
    });

    // Format data for CSV
    const csvData = records.map(record => ({
      employee_id: record.employee_id,
      employee_name: employeeMap[record.employee_id] || 'Unknown',
      date: formatDateForCSV(record.date),
      check_in: formatTimeForCSV(record.check_in),
      check_out: formatTimeForCSV(record.check_out),
      total_hours: record.total_minutes ? (record.total_minutes / 60).toFixed(2) : '0',
      status: record.status || 'unknown'
    }));

    const headers = ['employee_id', 'employee_name', 'date', 'check_in', 'check_out', 'total_hours', 'status'];
    const csv = convertToCSV(csvData, headers);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance_report_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Attendance export error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Export leave report as CSV
router.get('/leaves/export', authenticate, requireAdminOrHR, async (req, res) => {
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
      .limit(5000)
      .lean();

    // Get employee names
    const employeeIds = [...new Set(leaves.map(l => l.employee_id))];
    const profiles = await Profile.find({ employee_id: { $in: employeeIds } })
      .select('employee_id first_name last_name')
      .lean();
    
    const employeeMap = {};
    profiles.forEach(p => {
      employeeMap[p.employee_id] = `${p.first_name} ${p.last_name}`;
    });

    // Format data for CSV
    const csvData = leaves.map(leave => {
      const days = Math.ceil((new Date(leave.end_date) - new Date(leave.start_date)) / (1000 * 60 * 60 * 24)) + 1;
      return {
        employee_id: leave.employee_id,
        employee_name: employeeMap[leave.employee_id] || 'Unknown',
        leave_type: leave.leave_type,
        start_date: formatDateForCSV(leave.start_date),
        end_date: formatDateForCSV(leave.end_date),
        days: days,
        status: leave.status,
        remarks: leave.remarks || '',
        applied_date: formatDateForCSV(leave.created_at)
      };
    });

    const headers = ['employee_id', 'employee_name', 'leave_type', 'start_date', 'end_date', 'days', 'status', 'remarks', 'applied_date'];
    const csv = convertToCSV(csvData, headers);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="leave_report_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Leave export error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Export payroll report as CSV
router.get('/payroll/export', authenticate, requireAdminOrHR, async (req, res) => {
  try {
    const { employee_id, month, year } = req.query;
    
    const query = {};
    
    if (employee_id) {
      query.employee_id = employee_id;
    }
    
    if (month) {
      query.month = parseInt(month);
    }
    
    if (year) {
      query.year = parseInt(year);
    }

    const payrolls = await Payroll.find(query)
      .sort({ year: -1, month: -1 })
      .limit(5000)
      .lean();

    // Get employee names
    const employeeIds = [...new Set(payrolls.map(p => p.employee_id))];
    const profiles = await Profile.find({ employee_id: { $in: employeeIds } })
      .select('employee_id first_name last_name')
      .lean();
    
    const employeeMap = {};
    profiles.forEach(p => {
      employeeMap[p.employee_id] = `${p.first_name} ${p.last_name}`;
    });

    // Format data for CSV
    const csvData = payrolls.map(payroll => ({
      employee_id: payroll.employee_id,
      employee_name: employeeMap[payroll.employee_id] || 'Unknown',
      month: payroll.month,
      year: payroll.year,
      basic: payroll.basic || 0,
      hra: payroll.hra || 0,
      allowances: payroll.allowances || 0,
      deductions: payroll.deductions || 0,
      net_pay: payroll.net_pay || 0,
      created_date: formatDateForCSV(payroll.created_at)
    }));

    const headers = ['employee_id', 'employee_name', 'month', 'year', 'basic', 'hra', 'allowances', 'deductions', 'net_pay', 'created_date'];
    const csv = convertToCSV(csvData, headers);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="payroll_report_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Payroll export error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Export employee report as CSV
router.get('/employees/export', authenticate, requireAdminOrHR, async (req, res) => {
  try {
    const profiles = await Profile.find({})
      .sort({ created_at: -1 })
      .limit(5000)
      .lean();

    // Format data for CSV
    const csvData = profiles.map(profile => ({
      employee_id: profile.employee_id,
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      department: profile.job_details?.department || '',
      job_title: profile.job_details?.title || '',
      employment_type: profile.job_details?.employment_type || '',
      joining_date: formatDateForCSV(profile.job_details?.joining_date),
      basic_salary: profile.salary_structure?.basic || 0,
      address: profile.address || '',
      emergency_contact_name: profile.emergency_contact?.name || '',
      emergency_contact_phone: profile.emergency_contact?.phone || ''
    }));

    const headers = [
      'employee_id', 'first_name', 'last_name', 'email', 'phone', 
      'department', 'job_title', 'employment_type', 'joining_date', 
      'basic_salary', 'address', 'emergency_contact_name', 'emergency_contact_phone'
    ];
    const csv = convertToCSV(csvData, headers);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="employee_report_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Employee export error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;