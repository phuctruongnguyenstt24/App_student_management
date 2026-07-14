const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Vui lòng nhập tên đăng nhập'],
    unique: true,
    sparse:true,
    trim: true,
    minlength: [3, 'Tên đăng nhập phải có ít nhất 3 ký tự'],
    maxlength: [30, 'Tên đăng nhập không quá 30 ký tự']
  },
  fullName: {
    type: String,
    required: [true, 'Vui lòng nhập họ tên'],
    trim: true,
    minlength: [2, 'Họ tên phải có ít nhất 2 ký tự'],
    maxlength: [100, 'Họ tên không quá 100 ký tự']
  },
  studentId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z0-9]{5,20}$/, 'Mã số sinh viên không hợp lệ'],
    default: null
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
    minlength: [5, 'Mật khẩu phải có ít nhất 5 ký tự'],
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
  isFirstLogin: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  class: {
    type: String,
    trim: true,
    default: ''
  },
  course: {
    type: String,
    trim: true,
    default: ''
  },
  phone: {
    type: String,
    trim: true
    
  },
  address: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    default: ''
  },
dateOfBirth: {
    type: String
    
  },
  placeOfBirth: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
 
  trainingPoint: {
    type: Number,
    default: 0,
    min: [0, 'Điểm rèn luyện không được nhỏ hơn 0'],
    max: [100, 'Điểm rèn luyện không vượt quá 100']
  },

   // Thông tin học vấn
  academicInfo: {
    enrollmentDate: { type: String, default: '' },
    trainingLevel: { type: String, default: 'Đại học chính quy' },
    trainingType: { type: String, default: 'Chính quy' },
    courseYear: { type: String, default: '' },
    base: { type: String, default: 'Trường Đại học Kỹ thuật - Công nghệ Cần Thơ' },
    profileCode: { type: String, default: '' }
  },
   // Thông tin cá nhân
  personalInfo: {
    ethnicity: { type: String, default: 'Kinh' },
    religion: { type: String, default: 'Không' },
    nationality: { type: String, default: 'Việt Nam' },
    region: { type: String, default: '' },
    cccd: { type: String, default: '' },
    cccdIssueDate: { type: String, default: '' },
    cccdIssuePlace: { type: String, default: '' },
    object: { type: String, default: '' },
    policyType: { type: String, default: 'Không' },
    unionJoinDate: { type: String, default: '' },
    partyJoinDate: { type: String, default: '' },
    permanentResidence: { type: String, default: '' },
    bankName: { type: String, default: '' },
    bankBranch: { type: String, default: '' },
    accountHolder: { type: String, default: '' },
    accountNumber: { type: String, default: '' }
  },
    familyInfo: {
    father: {
      name: { type: String, default: '' },
      birthYear: { type: String, default: '' },
      occupation: { type: String, default: '' },
      nationality: { type: String, default: 'Việt Nam' },
      ethnicity: { type: String, default: 'Kinh' },
      religion: { type: String, default: 'Không' },
      workplace: { type: String, default: '' },
      position: { type: String, default: '' },
      phone: { type: String, default: '' },
      permanentResidence: { type: String, default: '' },
      currentResidence: { type: String, default: '' }
    },
       mother: {
      name: { type: String, default: '' },
      birthYear: { type: String, default: '' },
      occupation: { type: String, default: '' },
      nationality: { type: String, default: 'Việt Nam' },
      ethnicity: { type: String, default: 'Kinh' },
      religion: { type: String, default: 'Không' },
      workplace: { type: String, default: '' },
      position: { type: String, default: '' },
      phone: { type: String, default: '' },
      permanentResidence: { type: String, default: '' },
      currentResidence: { type: String, default: '' }
    }
  }
}, 
{
  timestamps: true
});

// Mã hóa mật khẩu trước khi lưu - KHÔNG DÙNG next
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  try {
    console.log('🔐 Hashing password...');
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('✅ Password hashed successfully');
  } catch (error) {
    console.error('❌ Hash error:', error);
    throw error;
  }
});

// So sánh mật khẩu
userSchema.methods.comparePassword = async function (enteredPassword) {
  try {
    console.log('🔍 Comparing password...');
    const result = await bcrypt.compare(enteredPassword, this.password);
    console.log('   Result:', result ? '✅ Match' : '❌ No match');
    return result;
  } catch (error) {
    console.error('❌ Compare error:', error);
    return false;
  }
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