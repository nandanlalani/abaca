const express = require('express');
const { body, validationResult } = require('express-validator');
const { Payroll, User } = require('../models');
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

module.exports = router;