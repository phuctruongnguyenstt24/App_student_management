const User = require('../models/User');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Tạo tài khoản Admin mới (Chỉ Super Admin)
exports.createAdmin = async (req, res) => {
  try {
    const {
      username,
      fullName,
      email,
      password,
      phone,
      address
    } = req.body;

    // Kiểm tra quyền (chỉ admin mới được tạo admin)
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền tạo tài khoản admin'
      });
    }

    // Validate input
    if (!username || !fullName || !email || !password) {
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

    // Kiểm tra username và email đã tồn tại
    const existingUser = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: email.toLowerCase() }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Tên đăng nhập hoặc email đã tồn tại'
      });
    }

    // Tạo admin mới
    const admin = new User({
      username: username.toLowerCase(),
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      role: 'admin',
      phone: phone || '',
      address: address || '',
      createdBy: req.user.id,
      isFirstLogin: true,
      status: 'active'
    });

    await admin.save();

    console.log('✅ Admin created successfully:', admin.username);

    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản Admin thành công',
      admin: {
        id: admin._id,
        username: admin.username,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
        phone: admin.phone,
        address: admin.address,
        createdAt: admin.createdAt
      }
    });

  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

// Lấy danh sách Admin (Chỉ Admin)
exports.getAdmins = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem danh sách admin'
      });
    }

    const admins = await User.find({ role: 'admin' })
      .select('-password')
      .populate('createdBy', 'username fullName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: admins.length,
      admins
    });

  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

// Lấy chi tiết Admin
exports.getAdminById = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem thông tin này'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID không hợp lệ'
      });
    }

    const admin = await User.findById(id)
      .select('-password')
      .populate('createdBy', 'username fullName email');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy admin'
      });
    }

    if (admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản này không phải là admin'
      });
    }

    res.json({
      success: true,
      admin
    });

  } catch (error) {
    console.error('Get admin by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

// Cập nhật thông tin Admin
exports.updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật thông tin admin'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID không hợp lệ'
      });
    }

    const admin = await User.findById(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy admin'
      });
    }

    if (admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản này không phải là admin'
      });
    }

    // Không cho phép cập nhật password và role ở đây
    delete updateData.password;
    delete updateData.role;
    delete updateData._id;
    delete updateData.createdAt;

    // Các trường được phép cập nhật
    const allowedFields = [
      'fullName',
      'phone',
      'address',
      'dateOfBirth',
      'gender',
      'status'
    ];

    const filteredData = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có dữ liệu để cập nhật'
      });
    }

    const updatedAdmin = await User.findByIdAndUpdate(
      id,
      { $set: filteredData },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Cập nhật thông tin admin thành công',
      admin: updatedAdmin
    });

  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

// Xóa Admin (Không cho phép xóa chính mình)
exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa tài khoản admin'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID không hợp lệ'
      });
    }

    // Không cho phép tự xóa mình
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Không thể tự xóa tài khoản của chính mình'
      });
    }

    const admin = await User.findById(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy admin'
      });
    }

    if (admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản này không phải là admin'
      });
    }

    await admin.deleteOne();

    console.log('🗑️ Admin deleted:', admin.username);

    res.json({
      success: true,
      message: `Đã xóa tài khoản admin ${admin.username}`
    });

  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

/// Vô hiệu hóa / Kích hoạt Admin
exports.toggleAdminStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID không hợp lệ'
      });
    }

    // Không cho phép thay đổi status của chính mình
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Không thể thay đổi trạng thái của chính mình'
      });
    }

    const admin = await User.findById(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
    }

    // Chỉ cho phép thay đổi tài khoản admin
    if (admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản này không phải là admin'
      });
    }

    // ✅ Logic mới: Thu hồi quyền admin khi vô hiệu hóa
    let message = '';
    
    if (admin.status === 'active') {
      // Vô hiệu hóa -> Thu hồi quyền admin, chuyển thành student
      admin.status = 'inactive';
      admin.role = 'student';
      message = `Đã vô hiệu hóa và thu hồi quyền admin của ${admin.username}`;
    } else {
      // Kích hoạt lại -> Cấp lại quyền admin
      admin.status = 'active';
      admin.role = 'admin';
      message = `Đã kích hoạt và cấp lại quyền admin cho ${admin.username}`;
    }

    await admin.save();

    console.log('🔄 Toggle admin status:', message);

    res.json({
      success: true,
      message: message,
      data: {
        id: admin._id,
        username: admin.username,
        fullName: admin.fullName,
        role: admin.role,
        status: admin.status
      }
    });

  } catch (error) {
    console.error('Toggle admin status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};