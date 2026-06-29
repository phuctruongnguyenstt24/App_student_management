// models/UpdateRequest.js
const mongoose = require('mongoose');

const updateRequestSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    ref: 'User'
  },
  studentName: {
    type: String,
    required: true
  },
  fields: [{
    type: String,
    required: true
  }],
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: {
    type: Date
  }
});

module.exports = mongoose.model('UpdateRequest', updateRequestSchema);