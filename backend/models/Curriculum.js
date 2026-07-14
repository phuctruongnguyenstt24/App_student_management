const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  credits: { type: Number, required: true, min: 1, max: 10 },
  theoryHours: { type: Number, default: 0, min: 0 },
  practiceHours: { type: Number, default: 0, min: 0 },
  isRequired: { type: Boolean, default: true },
  isCompleted: { type: Boolean, default: false },
  semester: { type: Number, required: true, min: 1 },
}, { _id: false }); // 👈 Thêm _id: false ở đây để tránh lỗi index tự sinh

const semesterSchema = new mongoose.Schema({
  semesterNumber: { type: Number, required: true }, // 👈 Bỏ unique: true ở đây
  subjects: [subjectSchema],
  totalCredits: { type: Number, default: 0 },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Curriculum', semesterSchema);