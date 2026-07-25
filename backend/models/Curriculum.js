// models/CurriculumFramework.js
const mongoose = require('mongoose');

const curriculumFrameworkSchema = new mongoose.Schema({
  // Thông tin học phần
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  courseCode: {
    type: String,
    required: true
  },
  courseName: {
    type: String,
    required: true
  },
  credits: {
    type: Number,
    required: true,
    min: 1
  },

  // Thông tin chương trình khung
  programName: {
    type: String,
    required: true
  },
  programCode: {
    type: String,
    required: true,
    unique: true
  },
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },

  // Học kỳ và năm học
  semester: {
    type: String,
    required: true,
    enum: ['HK1', 'HK2', 'HK3']
  },
  academicYear: {
    type: String,
    required: true
  },

  // Trạng thái hoàn thành
  status: {
    type: String,
    enum: ['completed', 'incomplete', 'in_progress'],
    default: 'incomplete'
  },

  // Ngày hoàn thành (nếu đã hoàn thành)
  completedDate: {
    type: Date,
    default: null
  },

  // Ghi chú
  notes: {
    type: String,
    default: ''
  },

  // Thông tin người tạo
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Thông tin cập nhật
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index để tối ưu truy vấn

curriculumFrameworkSchema.index({ courseId: 1, programCode: 1 });
curriculumFrameworkSchema.index({ facultyId: 1, departmentId: 1 });
curriculumFrameworkSchema.index({ status: 1 });
curriculumFrameworkSchema.index({ semester: 1, academicYear: 1 });

// Virtual field để tính tổng số tín chỉ
curriculumFrameworkSchema.virtual('totalCredits').get(function () {
  return this.credits || 0;
});

// Middleware: Cập nhật completedDate khi status thay đổi
curriculumFrameworkSchema.pre('save', function () {
  if (this.isModified('status')) {
    if (this.status === 'completed') {
      this.completedDate = new Date();
    } else {
      this.completedDate = null;
    }
  }

});

module.exports = mongoose.model('Curriculum', curriculumFrameworkSchema);