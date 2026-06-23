// controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Admin tạo tài khoản sinh viên
const createStudentAccount = async (req, res) => {
  try {
    const { 
      fullName, 
      studentId, 
      email, 
      password,
      facultyId,
      departmentId,
      class: className,
      phone,
      address
    } = req.body;

    console.log('📝 Creating student with data:', { 
      fullName, 
      studentId, 
      email, 
      facultyId, 
      departmentId 
    });

    // Kiểm tra quyền admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này. Chỉ admin mới được tạo tài khoản.'
      });
    }

    // Validate input
    if (!fullName || !studentId || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin'
      });
    }

    if (password.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 5 ký tự'
      });
    }

    if (!email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Email không hợp lệ'
      });
    }

    // Kiểm tra email đã tồn tại
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email đã tồn tại trong hệ thống'
      });
    }

    // Kiểm tra studentId đã tồn tại
    const existingStudentId = await User.findOne({ studentId: studentId.toUpperCase() });
    if (existingStudentId) {
      return res.status(400).json({
        success: false,
        message: 'Mã số sinh viên đã tồn tại trong hệ thống'
      });
    }

    // Tạo username từ studentId
    const username = studentId.toUpperCase();
    
    // Kiểm tra username đã tồn tại
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username đã tồn tại'
      });
    }

    // Tạo user mới với đầy đủ thông tin
    const userData = {
      username: username, // Bắt buộc phải có
      fullName: fullName.trim(),
      studentId: studentId.toUpperCase().trim(),
      email: email.toLowerCase().trim(),
      password: password,
      role: 'student',
      facultyId: facultyId || null,
      departmentId: departmentId || null,
      class: className || '',
      phone: phone || '',
      address: address || '',
      isFirstLogin: true,
      isActive: true,
    };

    console.log('📦 User data to save:', { ...userData, password: '***' });

    const user = await User.create(userData);

    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản sinh viên thành công',
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        studentId: user.studentId,
        email: user.email,
        role: user.role,
        class: user.class,
        phone: user.phone,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Create student error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} đã tồn tại trong hệ thống`
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

// Các hàm khác giữ nguyên...
const register = async (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Đăng ký công khai đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên để được cấp tài khoản.'
  });
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mật khẩu'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        studentId: user.studentId,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isFirstLogin: user.isFirstLogin
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau'
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        studentId: user.studentId,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

const getAllStudents = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập'
      });
    }

    const students = await User.find({ role: 'student' })
      .select('-password')
      .populate('facultyId', 'name code')
      .populate('departmentId', 'name code')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: students.length,
      students
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

const deleteStudent = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa tài khoản'
      });
    }

    const student = await User.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên'
      });
    }

    if (student.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không thể xóa tài khoản admin'
      });
    }

    await student.deleteOne();
    
    res.json({
      success: true,
      message: 'Xóa tài khoản sinh viên thành công'
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  createStudentAccount,
  getAllStudents,
  deleteStudent
};