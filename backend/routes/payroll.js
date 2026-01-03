const express = require('express');
const { body, validationResult } = require('express-validator');
const { Payroll, User, Profile } = require('../models');
const { authenticate, requireAdminOrHR } = require('../middleware/auth');

const router = express.Router();

// Get my payroll
router.get('/me', authenticate, async (req, res) => {
  try {
    const { month, year } = req.query;
    
    const query = { employee_id: req.user.employee_id };
    
    if (month && year) {
      query.month = parseInt(month);
      query.year = parseInt(year);
    }

    const payrolls = await Payroll.find(query)
      .sort({ year: -1, month: -1 })
      .limit(100);

    res.json({
      success: true,
      payrolls
    });
  } catch (error) {
    console.error('Get my payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all payroll (Admin/HR only)
router.get('/', authenticate, requireAdminOrHR, async (req, res) => {
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
      .limit(1000);

    res.json({
      success: true,
      payrolls
    });
  } catch (error) {
    console.error('Get all payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create payroll (Admin/HR only)
router.post('/', authenticate, requireAdminOrHR, [
  body('employee_id').notEmpty().withMessage('Employee ID is required'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('year').isInt({ min: 2020 }).withMessage('Invalid year'),
  body('basic').isNumeric().withMessage('Basic salary must be a number'),
  body('hra').optional().isNumeric().withMessage('HRA must be a number'),
  body('allowances').optional().isNumeric().withMessage('Allowances must be a number'),
  body('deductions').optional().isNumeric().withMessage('Deductions must be a number')
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

    const { employee_id, month, year, basic, hra = 0, allowances = 0, deductions = 0 } = req.body;

    // Check if employee exists
    const user = await User.findOne({ employee_id }).select('user_id');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if payroll already exists for this month/year
    const existingPayroll = await Payroll.findOne({
      employee_id,
      month,
      year
    });

    if (existingPayroll) {
      return res.status(400).json({
        success: false,
        message: 'Payroll already exists for this month and year'
      });
    }

    const net_pay = basic + hra + allowances - deductions;

    const payroll = new Payroll({
      employee_id,
      user_id: user.user_id,
      month,
      year,
      basic,
      hra,
      allowances,
      deductions,
      net_pay,
      updated_by: req.user.user_id
    });

    await payroll.save();

    res.status(201).json({
      success: true,
      message: 'Payroll created',
      payroll
    });
  } catch (error) {
    console.error('Create payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update payroll (Admin/HR only)
router.put('/:payroll_id', authenticate, requireAdminOrHR, [
  body('basic').optional().isNumeric().withMessage('Basic salary must be a number'),
  body('hra').optional().isNumeric().withMessage('HRA must be a number'),
  body('allowances').optional().isNumeric().withMessage('Allowances must be a number'),
  body('deductions').optional().isNumeric().withMessage('Deductions must be a number')
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

    const { payroll_id } = req.params;
    const { basic, hra, allowances, deductions } = req.body;

    const payroll = await Payroll.findOne({ payroll_id });
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll not found'
      });
    }

    // Update fields if provided
    if (basic !== undefined) payroll.basic = basic;
    if (hra !== undefined) payroll.hra = hra;
    if (allowances !== undefined) payroll.allowances = allowances;
    if (deductions !== undefined) payroll.deductions = deductions;

    // Recalculate net pay
    payroll.net_pay = payroll.basic + payroll.hra + payroll.allowances - payroll.deductions;
    payroll.updated_by = req.user.user_id;

    await payroll.save();

    res.json({
      success: true,
      message: 'Payroll updated',
      payroll
    });
  } catch (error) {
    console.error('Update payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Generate payroll for all employees (Admin/HR only)
router.post('/generate', authenticate, requireAdminOrHR, [
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('year').isInt({ min: 2020 }).withMessage('Invalid year')
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

    const { month, year } = req.body;

    // Get all active employees
    const users = await User.find({ 
      role: { $in: ['employee', 'hr', 'admin'] },
      is_verified: true 
    }).select('user_id employee_id');

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active employees found'
      });
    }

    const payrollRecords = [];
    let existingCount = 0;

    for (const user of users) {
      // Check if payroll already exists
      const existingPayroll = await Payroll.findOne({
        employee_id: user.employee_id,
        month,
        year
      });

      if (existingPayroll) {
        existingCount++;
        continue;
      }

      // Get employee profile for salary structure
      const profile = await Profile.findOne({ employee_id: user.employee_id });
      
      let basic = 50000; // Default basic salary
      let hra = 10000;
      let allowances = 2500;
      let deductions = 1500;

      if (profile && profile.salary_structure) {
        basic = profile.salary_structure.basic || 50000;
        hra = Math.round(basic * 0.2); // 20% of basic
        allowances = Math.round(basic * 0.1); // 10% of basic
        const grossPay = basic + hra + allowances;
        deductions = Math.round(grossPay * 0.15); // 15% deductions
      }

      const netPay = basic + hra + allowances - deductions;

      const payroll = new Payroll({
        employee_id: user.employee_id,
        user_id: user.user_id,
        month,
        year,
        basic,
        hra,
        allowances,
        deductions,
        net_pay: netPay,
        status: 'processed',
        created_by: req.user.user_id
      });

      payrollRecords.push(payroll);
    }

    if (payrollRecords.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Payroll already exists for all employees for ${month}/${year}`
      });
    }

    await Payroll.insertMany(payrollRecords);

    res.status(201).json({
      success: true,
      message: `Generated payroll for ${payrollRecords.length} employees`,
      generated: payrollRecords.length,
      existing: existingCount,
      total: users.length
    });
  } catch (error) {
    console.error('Generate payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;