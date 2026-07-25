const User = require('../models/User');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

/**
 * Create a new admin account.
 *
 * Only users with the admin role are allowed to create another admin account.
 *
 * @async
 * @function createAdminAccount
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>}
 */
exports.createAdminAccount = async (req, res) => {
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
    const existingAccount = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: email.toLowerCase() }
      ]
    });

    if (existingAccount) {
      return res.status(400).json({
        success: false,
        message: 'Tên đăng nhập hoặc email đã tồn tại'
      });
    }

    // Tạo admin mới
    const adminAccount = new User({
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

    await adminAccount.save();

    console.log('✅ Admin created successfully:', adminAccount.username);

    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản Admin thành công',
      admin: {
          id: adminAccount._id,
          username: adminAccount.username,
          fullName: adminAccount.fullName,
          email: adminAccount.email,
          role: adminAccount.role,
          phone: adminAccount.phone,
          address: adminAccount.address,
          createdAt: adminAccount.createdAt
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

/**
 * Retrieve all admin accounts.
 *
 * Only administrators can access this endpoint.
 *
 * @async
 * @function getAllAdmins
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
// Lấy danh sách Admin (Chỉ Admin)
exports.getAllAdmins = async (req, res) => {
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

/**
 * Retrieve an admin account by its ID.
 *
 * @async
 * @function getAdminDetails
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
// Lấy chi tiết Admin
exports.getAdminDetails = async (req, res) => {
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

    const adminAccount = await User.findById(id)
      .select('-password')
      .populate('createdBy', 'username fullName email');

    if (!adminAccount) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy admin'
      });
    }

    if (adminAccount.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản này không phải là admin'
      });
    }

    res.json({
      success: true,
      admin: adminAccount
    });

  } catch (error) {
    console.error('Get admin by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};
/**
 * Update an admin profile.
 *
 * Only editable fields are updated.
 *
 * @async
 * @function updateAdminProfile
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */

// Cập nhật thông tin Admin
exports.updateAdminProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const updatePayload = req.body;

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

    const adminAccount= await User.findById(id);
    if (!adminAccount) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy admin'
      });
    }

    if (adminAccount.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản này không phải là admin'
      });
    }

    // Không cho phép cập nhật password và role ở đây
    delete updatePayload.password;
    delete updatePayload.role;
    delete updatePayload._id;
    delete updatePayload.createdAt;

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
      if (updatePayload[field] !== undefined) {
        filteredData[field] = updatePayload[field];
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

/**
 * Delete an admin account.
 *
 * An administrator cannot delete their own account.
 *
 * @async
 * @function deleteAdminAccount
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
exports.deleteAdminAccount = async (req, res) => {
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

    const adminAccount = await User.findById(id);
    if (!adminAccount) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy admin'
      });
    }

    if (adminAccount.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản này không phải là admin'
      });
    }

    await adminAccount.deleteOne();

    console.log('🗑️ Admin deleted:', adminAccount.username);

    res.json({
      success: true,
      message: `Đã xóa tài khoản admin ${adminAccount.username}`
    });

  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

/**
 * Toggle the status of an admin account.
 *
 * When disabled, the account is downgraded to the student role.
 * When enabled, the admin role is restored.
 *
 * @async
 * @function toggleAdminAccountStatus
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
exports.toggleAdminAccountStatus = async (req, res) => {
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

    const adminAccount = await User.findById(id);
    if (!adminAccount) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
    }

    // Chỉ cho phép thay đổi tài khoản admin
    if (adminAccount.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản này không phải là admin'
      });
    }

    // ✅ Logic mới: Thu hồi quyền admin khi vô hiệu hóa
    let message = '';
    
    if (adminAccount.status === 'active') {
      // Vô hiệu hóa -> Thu hồi quyền admin, chuyển thành student
      adminAccount.status = 'inactive';
      adminAccount.role = 'student';
      message = `Đã vô hiệu hóa và thu hồi quyền admin của ${adminAccount.username}`;
    } else {
      // Kích hoạt lại -> Cấp lại quyền admin
      adminAccount.status = 'active';
      adminAccount.role = 'admin';
      message = `Đã kích hoạt và cấp lại quyền admin cho ${adminAccount.username}`;
    }

    await adminAccount.save();

    console.log('🔄 Toggle admin status:', message);

    res.json({
      success: true,
      message: message,
      data: {
        id: adminAccount._id,
        username: adminAccount.username,
        fullName: adminAccount.fullName,
        role: adminAccount.role,
        status: adminAccount.status
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