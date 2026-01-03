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
      
      let basic = 500000; // Default basic salary
      let hra = 100000;
      let allowances = 25000;
      let deductions = 15000;

      if (profile && profile.salary_structure) {
        basic = profile.salary_structure.basic || 500000;
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

// Download payslip as PDF
router.get('/payslip/:payroll_id', authenticate, async (req, res) => {
  try {
    const { payroll_id } = req.params;
    const { format = 'html' } = req.query; // Support both HTML and PDF formats
    
    // Find the payroll record
    const payroll = await Payroll.findOne({ payroll_id });
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    // Check if user can access this payroll (own payroll or admin/HR)
    if (req.user.role !== 'admin' && req.user.role !== 'hr' && payroll.employee_id !== req.user.employee_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get employee profile for additional details
    const profile = await Profile.findOne({ employee_id: payroll.employee_id });
    const employeeName = profile ? `${profile.first_name} ${profile.last_name}` : payroll.employee_id;

    // Generate HTML content for the payslip
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const grossPay = payroll.basic + payroll.hra + payroll.allowances;
    const payPeriod = `${monthNames[payroll.month - 1]} ${payroll.year}`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Payslip - ${employeeName}</title>
        <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                margin: 0; 
                padding: 20px; 
                color: #333; 
                background-color: #f8f9fa;
            }
            .payslip-container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .header { 
                background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
                color: white;
                text-align: center; 
                padding: 30px 20px;
            }
            .company-name { 
                font-size: 28px; 
                font-weight: bold; 
                margin-bottom: 5px; 
                text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            .payslip-title { 
                font-size: 16px; 
                opacity: 0.9;
            }
            .content {
                padding: 30px;
            }
            .employee-info { 
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
                margin-bottom: 30px;
                padding: 20px;
                background-color: #f8f9fa;
                border-radius: 8px;
            }
            .info-section h3 { 
                color: #4F46E5; 
                margin-bottom: 15px; 
                font-size: 16px;
                border-bottom: 2px solid #4F46E5;
                padding-bottom: 5px;
            }
            .info-item { 
                margin-bottom: 8px; 
                display: flex;
                justify-content: space-between;
            }
            .info-label {
                font-weight: 600;
                color: #666;
            }
            .info-value {
                color: #333;
            }
            .earnings-deductions { 
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 30px;
            }
            .section { 
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .section-title { 
                padding: 15px; 
                text-align: center; 
                font-weight: bold; 
                font-size: 16px;
                color: white;
            }
            .earnings-title { 
                background: linear-gradient(135deg, #10B981 0%, #059669 100%);
            }
            .deductions-title { 
                background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
            }
            .item-row { 
                display: flex; 
                justify-content: space-between; 
                padding: 12px 20px; 
                border-bottom: 1px solid #E5E7EB;
                background: white;
            }
            .item-row:last-child {
                border-bottom: none;
            }
            .item-row:nth-child(even) { 
                background-color: #F9FAFB; 
            }
            .total-row { 
                font-weight: bold; 
                background-color: #E5E7EB !important;
                border-top: 2px solid #D1D5DB;
            }
            .net-pay { 
                text-align: center; 
                background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
                color: white; 
                padding: 25px; 
                font-size: 24px; 
                font-weight: bold; 
                margin: 20px 0;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(79, 70, 229, 0.3);
            }
            .footer { 
                text-align: center; 
                margin-top: 30px; 
                padding-top: 20px;
                border-top: 1px solid #E5E7EB;
                font-size: 12px; 
                color: #666; 
            }
            .footer p {
                margin: 5px 0;
            }
            @media print {
                body { background-color: white; }
                .payslip-container { box-shadow: none; }
            }
        </style>
    </head>
    <body>
        <div class="payslip-container">
            <div class="header">
                <div class="company-name">Dayflow HRMS</div>
                <div class="payslip-title">Payslip for ${payPeriod}</div>
            </div>

            <div class="content">
                <div class="employee-info">
                    <div class="info-section">
                        <h3>Employee Information</h3>
                        <div class="info-item">
                            <span class="info-label">Name:</span>
                            <span class="info-value">${employeeName}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Employee ID:</span>
                            <span class="info-value">${payroll.employee_id}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Department:</span>
                            <span class="info-value">${profile?.job_details?.department || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Designation:</span>
                            <span class="info-value">${profile?.job_details?.title || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="info-section">
                        <h3>Pay Period Information</h3>
                        <div class="info-item">
                            <span class="info-label">Pay Period:</span>
                            <span class="info-value">${payPeriod}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Pay Date:</span>
                            <span class="info-value">${new Date(payroll.created_at).toLocaleDateString()}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Status:</span>
                            <span class="info-value">Processed</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Currency:</span>
                            <span class="info-value">INR</span>
                        </div>
                    </div>
                </div>

                <div class="earnings-deductions">
                    <div class="section">
                        <div class="section-title earnings-title">Earnings</div>
                        <div class="item-row">
                            <span>Basic Salary</span>
                            <span>₹${payroll.basic.toLocaleString()}</span>
                        </div>
                        <div class="item-row">
                            <span>House Rent Allowance (HRA)</span>
                            <span>₹${payroll.hra.toLocaleString()}</span>
                        </div>
                        <div class="item-row">
                            <span>Other Allowances</span>
                            <span>₹${payroll.allowances.toLocaleString()}</span>
                        </div>
                        <div class="item-row total-row">
                            <span>Gross Earnings</span>
                            <span>₹${grossPay.toLocaleString()}</span>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title deductions-title">Deductions</div>
                        <div class="item-row">
                            <span>Income Tax</span>
                            <span>₹${Math.round(payroll.deductions * 0.7).toLocaleString()}</span>
                        </div>
                        <div class="item-row">
                            <span>Social Security</span>
                            <span>₹${Math.round(payroll.deductions * 0.2).toLocaleString()}</span>
                        </div>
                        <div class="item-row">
                            <span>Other Deductions</span>
                            <span>₹${Math.round(payroll.deductions * 0.1).toLocaleString()}</span>
                        </div>
                        <div class="item-row total-row">
                            <span>Total Deductions</span>
                            <span>₹${payroll.deductions.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div class="net-pay">
                    NET PAY: ₹${payroll.net_pay.toLocaleString()}
                </div>

                <div class="footer">
                    <p><strong>This is a computer-generated payslip and does not require a signature.</strong></p>
                    <p>Generated on ${new Date().toLocaleDateString()} | Dayflow HRMS</p>
                    <p>For any queries regarding this payslip, please contact HR department.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    // Set headers for HTML download
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="payslip_${payroll.employee_id}_${monthNames[payroll.month - 1]}_${payroll.year}.html"`);
    res.send(htmlContent);

  } catch (error) {
    console.error('Download payslip error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;