const { verifyToken } = require('../utils/auth');
const { User } = require('../models');

// Verify JWT token middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    // Get user from database
    const user = await User.findOne({ user_id: decoded.user_id }).select('-password_hash -refresh_token_hash');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    req.user = {
      user_id: user.user_id,
      employee_id: user.employee_id,
      email: user.email,
      role: user.role
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Check if user is admin or HR
const requireAdminOrHR = (req, res, next) => {
  if (!req.user || !['admin', 'hr'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Admin or HR access required'
    });
  }
  next();
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

module.exports = {
  authenticate,
  requireAdminOrHR,
  requireAdmin
};