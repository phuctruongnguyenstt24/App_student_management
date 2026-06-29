// controllers/studentController.js
const User = require('../models/User');

// Cập nhật thông tin sinh viên
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

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
      // Thông tin bổ sung
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

    // Cập nhật
    const updatedStudent = await User.findByIdAndUpdate(
      id,
      { $set: filteredData },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Cập nhật thông tin sinh viên thành công',
      student: updatedStudent
    });

  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

// Cập nhật thông tin chi tiết sinh viên (dành cho sinh viên tự cập nhật)
const updateStudentProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    // Sinh viên chỉ được cập nhật thông tin của mình
    const student = await User.findById(userId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên'
      });
    }

    if (student.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ sinh viên mới được cập nhật thông tin'
      });
    }

    // Các trường sinh viên được phép cập nhật
    const allowedFields = [
      'phone',
      'address',
      'dateOfBirth',
      'placeOfBirth',
      'personalInfo',
      'familyInfo'
    ];

    const filteredData = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    const updatedStudent = await User.findByIdAndUpdate(
      userId,
      { $set: filteredData },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      student: updatedStudent
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

// Lấy thông tin chi tiết sinh viên theo ID
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    // Admin có thể xem bất kỳ, student chỉ xem được mình
    if (req.user.role === 'student' && req.user.id !== id) {
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

    res.json({
      success: true,
      student
    });

  } catch (error) {
    console.error('Get student by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

module.exports = {
  updateStudent,
  updateStudentProfile,
  getStudentById
};