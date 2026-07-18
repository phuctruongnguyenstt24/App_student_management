const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  try {
    // Lấy token từ header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      
      // Clean token
      token = token.trim();
      
      // Kiểm tra token có hợp lệ không (có đủ 3 phần không)
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('❌ Invalid token format: wrong number of parts');
        return res.status(401).json({
          success: false,
          message: 'Token không hợp lệ. Vui lòng đăng nhập lại.'
        });
      }

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

// Middleware kiểm tra quyền admin hoặc student (cho phép cả 2)
const isAdminOrStudent = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Chưa xác thực người dùng'
    });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền truy cập chức năng này'
    });
  }

  next();
};

// Middleware kiểm tra quyền truy cập tài nguyên
const checkOwnership = (model) => {
  return async (req, res, next) => {
    try {
      const resource = await model.findById(req.params.id);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tài nguyên'
        });
      }

      // Nếu là admin, cho phép truy cập
      if (req.user.role === 'admin') {
        req.resource = resource;
        return next();
      }

      // Kiểm tra sở hữu
      if (resource.userId && resource.userId.toString() === req.user.id) {
        req.resource = resource;
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập tài nguyên này'
      });
    } catch (error) {
      console.error('Check ownership error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    }
  };
};

module.exports = { 
  protect, 
  isAdmin, 
  isStudent, 
  isAdminOrStudent,
  checkOwnership 
};