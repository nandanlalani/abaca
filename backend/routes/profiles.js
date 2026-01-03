const express = require('express');
const { body, validationResult } = require('express-validator');
const { Profile, User, AuditLog } = require('../models');
const { authenticate, requireAdminOrHR } = require('../middleware/auth');

const router = express.Router();

// Create profile
router.post('/', authenticate, [
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('job_title').notEmpty().withMessage('Job title is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('joining_date').isISO8601().withMessage('Valid joining date is required'),
  body('basic_salary').isNumeric().withMessage('Basic salary must be a number')
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

    // Check if profile already exists
    const existingProfile = await Profile.findOne({ user_id: req.user.user_id });
    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: 'Profile already exists'
      });
    }

    const {
      first_name,
      last_name,
      phone,
      address,
      job_title,
      department,
      joining_date,
      basic_salary,
      emergency_contact_name,
      emergency_contact_relationship,
      emergency_contact_phone
    } = req.body;

    const profile = new Profile({
      user_id: req.user.user_id,
      employee_id: req.user.employee_id,
      first_name,
      last_name,
      phone,
      address,
      job_details: {
        title: job_title,
        department,
        joining_date: new Date(joining_date),
        employment_type: 'full-time'
      },
      salary_structure: {
        basic: basic_salary
      },
      emergency_contact: {
        name: emergency_contact_name,
        relationship: emergency_contact_relationship,
        phone: emergency_contact_phone
      }
    });

    await profile.save();

    res.status(201).json({
      success: true,
      message: 'Profile created successfully',
      profile
    });
  } catch (error) {
    console.error('Create profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get my profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user_id: req.user.user_id });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update my profile
router.put('/me', authenticate, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user_id: req.user.user_id });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    // Update basic fields
    const basicFields = ['first_name', 'last_name', 'phone', 'address'];
    basicFields.forEach(field => {
      if (req.body[field] !== undefined) {
        profile[field] = req.body[field];
      }
    });

    // Update job details
    if (req.body.job_details) {
      const jobFields = ['title', 'department', 'joining_date', 'employment_type'];
      jobFields.forEach(field => {
        if (req.body.job_details[field] !== undefined) {
          if (!profile.job_details) profile.job_details = {};
          profile.job_details[field] = req.body.job_details[field];
        }
      });
    }

    // Update emergency contact
    if (req.body.emergency_contact) {
      const emergencyFields = ['name', 'relationship', 'phone'];
      emergencyFields.forEach(field => {
        if (req.body.emergency_contact[field] !== undefined) {
          if (!profile.emergency_contact) profile.emergency_contact = {};
          profile.emergency_contact[field] = req.body.emergency_contact[field];
        }
      });
    }

    await profile.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all employees (Admin/HR only)
router.get('/employees', authenticate, requireAdminOrHR, async (req, res) => {
  try {
    const profiles = await Profile.find({}).lean();
    
    const employees = await Promise.all(
      profiles.map(async (profile) => {
        const user = await User.findOne({ user_id: profile.user_id })
          .select('email role is_verified')
          .lean();
        
        return {
          ...profile,
          email: user?.email,
          role: user?.role,
          is_verified: user?.is_verified
        };
      })
    );

    res.json({
      success: true,
      employees
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get employee by ID (Admin/HR only)
router.get('/employees/:employee_id', authenticate, requireAdminOrHR, async (req, res) => {
  try {
    const { employee_id } = req.params;
    
    const profile = await Profile.findOne({ employee_id }).lean();
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const user = await User.findOne({ user_id: profile.user_id })
      .select('email role is_verified')
      .lean();

    const employee = {
      ...profile,
      email: user?.email,
      role: user?.role,
      is_verified: user?.is_verified
    };

    res.json({
      success: true,
      employee
    });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update employee (Admin/HR only)
router.put('/employees/:employee_id', authenticate, requireAdminOrHR, async (req, res) => {
  try {
    const { employee_id } = req.params;
    
    const profile = await Profile.findOne({ employee_id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const beforeUpdate = profile.toObject();
    const updateFields = {};

    // Map request fields to update fields
    const fieldMapping = {
      first_name: 'first_name',
      last_name: 'last_name',
      phone: 'phone',
      address: 'address',
      job_title: 'job_details.title',
      department: 'job_details.department',
      basic_salary: 'salary_structure.basic',
      hra: 'salary_structure.hra',
      allowances: 'salary_structure.allowances',
      deductions: 'salary_structure.deductions'
    };

    Object.keys(fieldMapping).forEach(reqField => {
      if (req.body[reqField] !== undefined) {
        const dbField = fieldMapping[reqField];
        if (dbField.includes('.')) {
          const [parent, child] = dbField.split('.');
          if (!updateFields[parent]) updateFields[parent] = {};
          updateFields[parent][child] = req.body[reqField];
        } else {
          updateFields[dbField] = req.body[reqField];
        }
      }
    });

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    // Handle nested updates
    if (updateFields.job_details) {
      Object.keys(updateFields.job_details).forEach(key => {
        profile.job_details[key] = updateFields.job_details[key];
      });
      delete updateFields.job_details;
    }

    if (updateFields.salary_structure) {
      Object.keys(updateFields.salary_structure).forEach(key => {
        profile.salary_structure[key] = updateFields.salary_structure[key];
      });
      delete updateFields.salary_structure;
    }

    // Apply other updates
    Object.keys(updateFields).forEach(key => {
      profile[key] = updateFields[key];
    });

    await profile.save();

    // Create audit log
    const auditLog = new AuditLog({
      actor_id: req.user.user_id,
      action: 'update_employee',
      entity_type: 'employee_profile',
      entity_id: employee_id,
      before: beforeUpdate,
      after: profile.toObject()
    });
    await auditLog.save();

    res.json({
      success: true,
      message: 'Employee updated successfully',
      employee: profile
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get leave balance
router.get('/leave-balance', authenticate, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user_id: req.user.user_id });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    // Initialize leave balance if not exists
    if (!profile.leave_balance) {
      profile.leave_balance = {
        sick: 12,
        casual: 12,
        annual: 21,
        maternity: 180,
        paternity: 15,
        year: new Date().getFullYear()
      };
      await profile.save();
    }

    // Calculate used leaves for current year
    const currentYear = new Date().getFullYear();
    const { Leave } = require('../models');
    
    const usedLeaves = await Leave.aggregate([
      {
        $match: {
          employee_id: req.user.employee_id,
          status: 'approved',
          $expr: {
            $eq: [{ $year: '$start_date' }, currentYear]
          }
        }
      },
      {
        $group: {
          _id: '$leave_type',
          total_days: {
            $sum: {
              $add: [
                { $divide: [{ $subtract: ['$end_date', '$start_date'] }, 1000 * 60 * 60 * 24] },
                1
              ]
            }
          }
        }
      }
    ]);

    // Calculate remaining balance
    const balance = { ...profile.leave_balance.toObject() };
    usedLeaves.forEach(used => {
      if (balance[used._id] !== undefined) {
        balance[used._id] = Math.max(0, balance[used._id] - Math.ceil(used.total_days));
      }
    });

    res.json({
      success: true,
      balance,
      used_leaves: usedLeaves
    });
  } catch (error) {
    console.error('Get leave balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update leave balance (Admin/HR only)
router.put('/leave-balance/:employee_id', authenticate, requireAdminOrHR, [
  body('leave_type').isIn(['sick', 'casual', 'annual', 'maternity', 'paternity']).withMessage('Invalid leave type'),
  body('balance').isNumeric().withMessage('Balance must be a number')
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

    const { employee_id } = req.params;
    const { leave_type, balance } = req.body;

    const profile = await Profile.findOne({ employee_id });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    if (!profile.leave_balance) {
      profile.leave_balance = {
        sick: 12,
        casual: 12,
        annual: 21,
        maternity: 180,
        paternity: 15,
        year: new Date().getFullYear()
      };
    }

    profile.leave_balance[leave_type] = balance;
    await profile.save();

    res.json({
      success: true,
      message: 'Leave balance updated successfully',
      balance: profile.leave_balance
    });
  } catch (error) {
    console.error('Update leave balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;