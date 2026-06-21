// models/Course.js
const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    required: [true, 'Mã môn học là bắt buộc'],
    // unique: true, // ← BỎ comment nếu dùng schema.index()
    trim: true,
    uppercase: true,
  },
  courseName: {
    type: String,
    required: [true, 'Tên môn học là bắt buộc'],
    trim: true,
  },
  credits: {
    type: Number,
    required: [true, 'Số tín chỉ là bắt buộc'],
    min: [1, 'Số tín chỉ phải lớn hơn 0'],
    max: [10, 'Số tín chỉ không được vượt quá 10'],
  },
  department: {
    type: String,
    trim: true,
    default: '',
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  semester: {
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: true,
});

// Chỉ định nghĩa index ở đây
CourseSchema.index({ courseCode: 1 }, { unique: true });
// CourseSchema.index({ courseName: 'text' });

module.exports = mongoose.model('Course', CourseSchema);