// models/Grade.js
const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  semester: {
    type: String,
    required: true,
    trim: true,
    // Ví dụ: 'HK1-2026'
  },
  midtermScore: {
    type: Number,
    min: 0,
    max: 10,
    default: null,
  },
  finalScore: {
    type: Number,
    min: 0,
    max: 10,
    default: null,
  }
}, {
  timestamps: true,
});

// Đảm bảo một sinh viên chỉ có 1 bản ghi điểm cho 1 môn trong 1 học kỳ
gradeSchema.index({ student: 1, course: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('Grade', gradeSchema);