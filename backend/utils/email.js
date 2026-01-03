const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  console.log('Creating email transporter...');

  // Check if we have valid Gmail credentials
  const hasValidCredentials = process.env.SMTP_PASS && 
    process.env.SMTP_PASS !== 'PUT_YOUR_16_CHAR_APP_PASSWORD_HERE' && 
    process.env.SMTP_PASS.length >= 16;

  if (!hasValidCredentials) {
    console.log('⚠️  Gmail credentials not configured. Using console logger for emails.');
    // Return a test transporter that logs to console
    return nodemailer.createTransporter({
      streamTransport: true,
      newline: 'unix',
      buffer: true
    });
  }

  console.log('✅ Using Gmail SMTP service');
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Send verification email
const sendVerificationEmail = async (email, token) => {
  const transporter = createTransporter();
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.FROM_EMAIL || 'noreply@dayflow.com',
    to: email,
    subject: 'Verify Your Email - Dayflow HRMS',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Dayflow HRMS!</h2>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Verify Email
        </a>
        <p>If you didn't create an account, please ignore this email.</p>
        <p>This link will expire in 24 hours.</p>
      </div>
    `
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    
    // If using stream transport (console mode), log the email
    if (result.message) {
      console.log('\n📧 EMAIL SENT (Console Mode):');
      console.log('To:', email);
      console.log('Subject:', mailOptions.subject);
      console.log('Verification URL:', verificationUrl);
      console.log('─'.repeat(50));
    } else {
      console.log('✅ Verification email sent successfully to:', email);
    }
  } catch (error) {
    console.error('❌ Error sending verification email:', error.message);
    throw error;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, token) => {
  const transporter = createTransporter();
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: process.env.FROM_EMAIL || 'noreply@dayflow.com',
    to: email,
    subject: 'Password Reset - Dayflow HRMS',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Reset Password
        </a>
        <p>If you didn't request this, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
      </div>
    `
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    
    if (result.message) {
      console.log('\n📧 PASSWORD RESET EMAIL (Console Mode):');
      console.log('To:', email);
      console.log('Subject:', mailOptions.subject);
      console.log('Reset URL:', resetUrl);
      console.log('─'.repeat(50));
    } else {
      console.log('✅ Password reset email sent successfully to:', email);
    }
  } catch (error) {
    console.error('❌ Error sending password reset email:', error.message);
    throw error;
  }
};

// Send leave notification
const sendLeaveNotification = async (email, status, comment) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.FROM_EMAIL || 'noreply@dayflow.com',
    to: email,
    subject: `Leave Request ${status.toUpperCase()} - Dayflow HRMS`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Leave Request Update</h2>
        <p>Your leave request has been <strong>${status}</strong>.</p>
        ${comment ? `<p><strong>Comment:</strong> ${comment}</p>` : ''}
        <p>Please log in to your dashboard for more details.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Leave notification email sent successfully');
  } catch (error) {
    console.error('Error sending leave notification email:', error);
    throw error;
  }
};

// Send OTP email
const sendOTPEmail = async (email, otp) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.FROM_EMAIL || 'noreply@dayflow.com',
    to: email,
    subject: 'Password Reset OTP - Dayflow HRMS',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4F46E5; margin: 0;">Dayflow HRMS</h1>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
          <h2 style="color: #333; margin-bottom: 20px;">Password Reset OTP</h2>
          <p style="color: #666; margin-bottom: 30px;">Use this OTP to reset your password:</p>
          
          <div style="background-color: #4F46E5; color: white; padding: 20px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
            ${otp}
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            This OTP will expire in 10 minutes for security reasons.
          </p>
          <p style="color: #666; font-size: 14px;">
            If you didn't request this, please ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
          <p>This is an automated message from Dayflow HRMS</p>
        </div>
      </div>
    `
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    
    if (result.message) {
      console.log('\n📧 OTP EMAIL (Console Mode):');
      console.log('To:', email);
      console.log('Subject:', mailOptions.subject);
      console.log('🔐 OTP CODE:', otp);
      console.log('⏰ Expires in: 10 minutes');
      console.log('─'.repeat(50));
    } else {
      console.log('✅ OTP email sent successfully to:', email);
    }
  } catch (error) {
    console.error('❌ Error sending OTP email:', error.message);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendLeaveNotification,
  sendOTPEmail
};