const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const payrollSchema = new mongoose.Schema({
  payroll_id: {
    type: String,
    default: uuidv4,
    unique: true,
    required: true
  },
  employee_id: {
    type: String,
    required: true
  },
  user_id: {
    type: String,
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  basic: {
    type: Number,
    required: true
  },
  hra: {
    type: Number,
    default: 0
  },
  allowances: {
    type: Number,
    default: 0
  },
  deductions: {
    type: Number,
    default: 0
  },
  net_pay: {
    type: Number,
    required: true
  },
  updated_by: String,
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Compound index for employee, month, and year
payrollSchema.index({ employee_id: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);