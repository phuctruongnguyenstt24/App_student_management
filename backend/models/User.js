const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Vui lòng nhập họ tên'],
    trim: true,
    minlength: [2, 'Họ tên phải có ít nhất 2 ký tự'],
    maxlength: [100, 'Họ tên không quá 100 ký tự']
  },
  studentId: {
    type: String,
    required: [true, 'Vui lòng nhập mã số sinh viên'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z0-9]{5,20}$/, 'Mã số sinh viên không hợp lệ']
  },
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    default: null,
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null,
  },
  email: {
    type: String,
    required: [true, 'Vui lòng nhập email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
  },
  password: {
    type: String,
    required: [true, 'Vui lòng nhập mật khẩu'],
    minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  avatar: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Thêm field để biết tài khoản được tạo bởi ai
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Thêm field để lưu thông tin lớp
  class: {
    type: String,
    trim: true,
    default: ''
  },
  // Thêm field để lưu khóa học
  course: {
    type: String,
    trim: true,
    default: ''
  },
  // Thêm field để lưu số điện thoại
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  // Thêm field để lưu địa chỉ
  address: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

// Mã hóa mật khẩu trước khi lưu
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// So sánh mật khẩu
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method kiểm tra xem có phải admin không
userSchema.methods.isAdmin = function () {
  return this.role === 'admin';
};

// Method kiểm tra xem có phải student không
userSchema.methods.isStudent = function () {
  return this.role === 'student';
};

// Method ẩn mật khẩu khi trả về JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);