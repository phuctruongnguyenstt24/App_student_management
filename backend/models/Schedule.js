// models/Schedule.js
const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: false,
  },
  studentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
  }],
  lecturer: {
    type: String,
    required: true,
    trim: true,
  },
  type: {  
    type: String,
    enum: ['theory', 'practice', 'exam'],
    required: true,
    default: 'theory'
  },
  room: {
    type: String,
    required: true,
    trim: true,
  },
  // BỔ SUNG: Các trường nhận từ Frontend
  targetClass: {
    type: String,
    required: true,
  },
  specificDate: {
    type: String, // Lưu dưới dạng YYYY-MM-DD
    required: true,
  },
  session: {
    type: String, // morning, afternoon, evening
    required: true,
  },
  targetGroup: {
    type: String,
    default: 'all',
  },
  // dayOfWeek giữ lại nhưng không bắt buộc (vì dùng specificDate)
  dayOfWeek: [{
    type: Number,
    enum: [0, 1, 2, 3, 4, 5, 6]
  }],
  startTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: props => `${props.value} is not a valid time format (HH:MM)`,
    },
  },
  endTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: props => `${props.value} is not a valid time format (HH:MM)`,
    },
  },
  semester: {
    type: String,
    required: true,
    trim: true,
  },
  maxStudents: {
    type: Number,
    required: true,
    min: 1,
    default: 50,
  },
  currentStudents: {
    type: Number,
    default: 0,
    min: 0,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'full'],
    default: 'active',
  },
  isGroupSchedule: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Cập nhật composite index 
scheduleSchema.index({ specificDate: 1, startTime: 1, endTime: 1 });

// Middleware: tự động cập nhật status dựa trên currentStudents
scheduleSchema.pre('save', function() {
  if (this.currentStudents >= this.maxStudents) {
    this.status = 'full';
  } else if (this.status === 'full' && this.currentStudents < this.maxStudents) {
    this.status = 'active';
  }
});

module.exports = mongoose.model('Schedule', scheduleSchema);