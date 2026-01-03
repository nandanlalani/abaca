const express = require('express');
const { body, validationResult } = require('express-validator');
const { User, Profile } = require('../models');
const { hashPassword, verifyPassword, createAccessToken, createRefreshToken, generateVerificationToken } = require('../utils/auth');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Signup
router.post('/signup', [
  body('employee_id').notEmpty().withMessage('Employee ID is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'hr', 'employee']).withMessage('Invalid role')
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

    const { employee_id, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { employee_id }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email ? 'Email already registered' : 'Employee ID already exists'
      });
    }

    // Hash password and generate verification token
    const password_hash = await hashPassword(password);
    const verification_token = generateVerificationToken();

    // Create user
    const user = new User({
      employee_id,
      email,
      password_hash,
      role: role || 'employee',
      verification_token
    });

    await user.save();

    // Send verification email
    await sendVerificationEmail(email, verification_token);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      user_id: user.user_id,
      email: user.email
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify email
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    const user = await User.findOne({ verification_token: token });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token'
      });
    }

    user.is_verified = true;
    user.verification_token = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Signin
router.post('/signin', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    console.log('Login attempt for:', req.body.email);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('Verifying password...');
    const isValidPassword = await verifyPassword(password, user.password_hash);
    console.log('Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.is_verified) {
      console.log('User not verified:', email);
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before signing in'
      });
    }

    // Create tokens
    const tokenPayload = {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      employee_id: user.employee_id
    };

    const access_token = createAccessToken(tokenPayload);
    const refresh_token = createRefreshToken({ user_id: user.user_id });

    // Update user login info
    user.last_login = new Date();
    user.refresh_token_hash = await hashPassword(refresh_token);
    await user.save();

    console.log('Login successful for:', email);
    res.json({
      success: true,
      access_token,
      refresh_token,
      user: {
        user_id: user.user_id,
        employee_id: user.employee_id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Forgot password
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    
    if (!user) {
      // Don't reveal if email exists
      return res.json({
        success: true,
        message: 'If email exists, reset link has been sent'
      });
    }

    const reset_token = generateVerificationToken();
    const reset_token_expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.reset_token = reset_token;
    user.reset_token_expires = reset_token_expires;
    await user.save();

    await sendPasswordResetEmail(email, reset_token);

    res.json({
      success: true,
      message: 'Password reset link sent to your email'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Reset password
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('new_password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
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

    const { token, new_password } = req.body;

    const user = await User.findOne({
      reset_token: token,
      reset_token_expires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    user.password_hash = await hashPassword(new_password);
    user.reset_token = undefined;
    user.reset_token_expires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findOne({ user_id: req.user.user_id }).select('-password_hash -refresh_token_hash');
    const profile = await Profile.findOne({ user_id: req.user.user_id });

    res.json({
      success: true,
      user,
      profile
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;