const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const auditLogSchema = new mongoose.Schema({
  audit_id: {
    type: String,
    default: uuidv4,
    unique: true,
    required: true
  },
  actor_id: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  entity_type: {
    type: String,
    required: true
  },
  entity_id: {
    type: String,
    required: true
  },
  before: {
    type: mongoose.Schema.Types.Mixed
  },
  after: {
    type: mongoose.Schema.Types.Mixed
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);