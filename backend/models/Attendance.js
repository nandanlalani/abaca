const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const attendanceSchema = new mongoose.Schema({
  attendance_id: {
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
  date: {
    type: String,
    required: true
  },
  check_in: Date,
  check_out: Date,
  total_minutes: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'half_day', 'leave'],
    default: 'absent'
  },
  notes: String,
  created_by: String,
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

// Compound index for employee and date
attendanceSchema.index({ employee_id: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);