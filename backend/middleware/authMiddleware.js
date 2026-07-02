const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  try {
    // Lấy token từ header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      
      // 🔥 QUAN TRỌNG: Clean token
      token = token.trim();
      console.log('AUTH HEADER:', req.headers.authorization);
      // 🔥 Kiểm tra token có hợp lệ không (có đủ 3 phần không)
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('❌ Invalid token format: wrong number of parts');
        return res.status(401).json({
          success: false,
          message: 'Token không hợp lệ. Vui lòng đăng nhập lại.'
        });
      }

      // Log để debug
      console.log('🔑 Token received, length:', token.length);
      console.log('🔑 Token preview:', token.substring(0, 30) + '...');

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token verified for user ID:', decoded.id);

      // Lấy user từ database
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User không tồn tại'
        });
      }

      next();
    } else {
      return res.status(401).json({
        success: false,
        message: 'Không được phép truy cập, không có token'
      });
    }
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    console.error('❌ Token received:', token ? token.substring(0, 50) : 'No token');
    
    // Xử lý chi tiết các loại lỗi
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ. Vui lòng đăng nhập lại.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn. Vui lòng đăng nhập lại.'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Không được phép truy cập, token không hợp lệ'
    });
  }
};

// Middleware kiểm tra quyền admin
const isAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Chưa xác thực người dùng'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Yêu cầu quyền quản trị viên. Bạn không có quyền truy cập chức năng này.'
    });
  }

  next();
};

// Middleware kiểm tra quyền student
const isStudent = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Chưa xác thực người dùng'
    });
  }

  if (req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Chức năng này chỉ dành cho sinh viên'
    });
  }

  next();
};

module.exports = { protect, isAdmin, isStudent };