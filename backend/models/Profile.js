const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const salaryStructureSchema = new mongoose.Schema({
  basic: { type: Number, required: true },
  hra: { type: Number, default: 0 },
  allowances: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 }
});

const jobDetailsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  department: { type: String, required: true },
  joining_date: { type: Date, required: true },
  employment_type: { type: String, default: 'full-time' }
});

const emergencyContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  relationship: { type: String, required: true },
  phone: { type: String, required: true }
});

const profileSchema = new mongoose.Schema({
  profile_id: {
    type: String,
    default: uuidv4,
    unique: true,
    required: true
  },
  user_id: {
    type: String,
    required: true,
    unique: true
  },
  employee_id: {
    type: String,
    required: true,
    unique: true
  },
  first_name: {
    type: String,
    required: true
  },
  last_name: {
    type: String,
    required: true
  },
  phone: String,
  address: String,
  job_details: jobDetailsSchema,
  salary_structure: salaryStructureSchema,
  emergency_contact: emergencyContactSchema,
  documents: [{
    type: { type: String },
    url: String,
    uploaded_at: { type: Date, default: Date.now }
  }],
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

module.exports = mongoose.model('Profile', profileSchema);