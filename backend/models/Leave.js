const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const leaveHistorySchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  actor_id: {
    type: String,
    required: true
  },
  comment: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const leaveSchema = new mongoose.Schema({
  leave_id: {
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
  leave_type: {
    type: String,
    enum: ['sick', 'casual', 'annual', 'maternity', 'paternity'],
    required: true
  },
  start_date: {
    type: Date,
    required: true
  },
  end_date: {
    type: Date,
    required: true
  },
  remarks: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approver_id: String,
  approver_comment: String,
  admin_remarks: String, // Add this field for frontend compatibility
  salary_deduction: {
    type: Number,
    default: 0
  },
  deduction_reason: String,
  created_by: String,
  history: [leaveHistorySchema],
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

module.exports = mongoose.model('Leave', leaveSchema);