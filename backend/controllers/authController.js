// controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Không có file ảnh được tải lên'
      });
    }

    const userId = req.user.id;
    
    // ✅ Xóa avatar cũ trước khi update
    await deleteOldAvatar(userId);

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const avatarUrl = `${baseUrl}/uploads/avatars/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { new: true, runValidators: true }
    );

    if (!user) {
      // Nếu không tìm thấy user, xóa file vừa upload
      const filePath = path.join(__dirname, '../uploads/avatars/', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    console.log('✅ Avatar uploaded successfully for user:', userId);
    console.log('📸 Avatar URL:', avatarUrl);

    res.status(200).json({
      success: true,
      message: 'Cập nhật ảnh đại diện thành công',
      avatar: avatarUrl,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar
      }
    });

  } catch (error) {
    console.error('Upload avatar error:', error);
    
    if (req.file) {
      const filePath = path.join(__dirname, '../uploads/avatars/', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi upload ảnh: ' + error.message
    });
  }
};

const deleteOldAvatar = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (user && user.avatar) {
      // Lấy tên file từ URL
      const fileName = user.avatar.split('/').pop();
      if (fileName) {
        const filePath = path.join(__dirname, '../uploads/avatars/', fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('🗑️ Deleted old avatar:', fileName);
        }
      }
    }
  } catch (error) {
    console.error('Error deleting old avatar:', error);
  }
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

// Tìm kiếm sinh viên
const searchStudents = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập'
      });
    }

    const { keyword } = req.query;
    
    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập từ khóa tìm kiếm'
      });
    }

    const searchRegex = new RegExp(keyword, 'i');
    
    const students = await User.find({
      role: 'student',
      $or: [
        { fullName: searchRegex },
        { studentId: searchRegex },
        { email: searchRegex },
        { phone: searchRegex }
      ]
    })
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
    console.error('Search students error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};
// Lấy chi tiết sinh viên theo ID
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra id hợp lệ
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({
        success: false,
        message: 'ID sinh viên không hợp lệ'
      });
    }

    // Chỉ admin mới có quyền xem chi tiết
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem thông tin này'
      });
    }

    const student = await User.findById(id)
      .select('-password')
      .populate('facultyId', 'name code')
      .populate('departmentId', 'name code');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên'
      });
    }

    // Kiểm tra role student
    if (student.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản này không phải là sinh viên'
      });
    }

    res.json({
      success: true,
      student
    });

  } catch (error) {
    console.error('Get student by id error:', error);
    
    // Xử lý lỗi CastError (ID không hợp lệ)
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID sinh viên không hợp lệ'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

// Cập nhật thông tin sinh viên (Admin)
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log('📝 Updating student:', id);
    console.log('📝 Update data:', updateData);

    // Kiểm tra id hợp lệ
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({
        success: false,
        message: 'ID sinh viên không hợp lệ'
      });
    }

    // Kiểm tra quyền admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này'
      });
    }

    // Tìm sinh viên
    const student = await User.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên'
      });
    }

    if (student.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không thể cập nhật tài khoản admin'
      });
    }

    // Các trường được phép cập nhật
    const allowedFields = [
      'fullName',
      'phone',
      'address',
      'dateOfBirth',
      'placeOfBirth',
      'class',
      'status',
      'facultyId',
      'departmentId',
      'academicInfo',
      'personalInfo',
      'familyInfo'
    ];

    // Lọc chỉ lấy các trường được phép
    const filteredData = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    // Nếu không có dữ liệu để cập nhật
    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có dữ liệu để cập nhật'
      });
    }

    // Cập nhật
    const updatedStudent = await User.findByIdAndUpdate(
      id,
      { $set: filteredData },
      { 
        new: true, 
        runValidators: true 
      }
    ).select('-password')
     .populate('facultyId', 'name code')
     .populate('departmentId', 'name code');

    console.log('✅ Student updated successfully:', updatedStudent._id);

    res.json({
      success: true,
      message: 'Cập nhật thông tin sinh viên thành công',
      student: updatedStudent
    });

  } catch (error) {
    console.error('Update student error:', error);
    
    // Xử lý lỗi CastError (ID không hợp lệ)
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID sinh viên không hợp lệ'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  createStudentAccount,
  getAllStudents,
  deleteStudent,
  searchStudents,
  getStudentById,
   updateStudent,
   uploadAvatar,
   deleteOldAvatar
};