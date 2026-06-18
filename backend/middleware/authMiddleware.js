const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Lấy token từ header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Lấy user từ database (không lấy password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User không tồn tại'
        });
      }

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({
        success: false,
        message: 'Không được phép truy cập, token không hợp lệ'
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Không được phép truy cập, không có token'
    });
  }
};

// Middleware kiểm tra quyền admin
const isAdmin = async (req, res, next) => {
  // Đảm bảo đã có req.user từ protect middleware
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