const mongoose = require('mongoose');

const AttendanceStudentSchema = new mongoose.Schema({
  studentId: { type: String },
  fullName: { type: String },
  checkedAt: { type: Date, default: Date.now },
});

const AttendanceSessionSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  courseCode: { type: String },
  courseName: { type: String },
  department: { type: String },
  requestedAt: { type: Date, default: Date.now },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
  presentStudents: { type: [AttendanceStudentSchema], default: [] },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Attendance', AttendanceSessionSchema);
