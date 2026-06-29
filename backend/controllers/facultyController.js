const Faculty = require('../models/Faculty');

// Lấy tất cả Khoa
exports.getFaculties = async (req, res) => {
  try {
    const faculties = await Faculty.find()
      .sort({ createdAt: -1 })
      .select('-__v'); // Ẩn field không cần thiết
    
    res.status(200).json({
      success: true,
      count: faculties.length,
      faculties
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi lấy danh sách khoa',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Lấy Khoa theo ID
exports.getFacultyById = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id).select('-__v');
    
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khoa với ID này'
      });
    }
    
    res.status(200).json({
      success: true,
      faculty
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID khoa không hợp lệ'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin khoa',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Tạo Khoa mới
exports.createFaculty = async (req, res) => {
  try {
    const { name, code, description } = req.body;
    
    // Validate dữ liệu
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tên và mã khoa'
      });
    }
    
    // Kiểm tra trùng lặp
    const existingFaculty = await Faculty.findOne({ 
      $or: [{ code: code.toUpperCase() }, { name }] 
    });
    
    if (existingFaculty) {
      return res.status(400).json({
        success: false,
        message: existingFaculty.code === code.toUpperCase() 
          ? 'Mã khoa đã tồn tại' 
          : 'Tên khoa đã tồn tại'
      });
    }
    
    const faculty = await Faculty.create({
      name,
      code: code.toUpperCase(),
      description: description || ''
    });
    
    res.status(201).json({
      success: true,
      message: 'Tạo khoa thành công',
      faculty
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo khoa mới',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Cập nhật Khoa
exports.updateFaculty = async (req, res) => {
  try {
    const { name, code, description } = req.body;
    const facultyId = req.params.id;
    
    // Validate dữ liệu
    if (!name && !code) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ít nhất một trường để cập nhật'
      });
    }
    
    // Kiểm tra ID hợp lệ
    const existingFaculty = await Faculty.findById(facultyId);
    if (!existingFaculty) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khoa với ID này'
      });
    }
    
    // Kiểm tra trùng lặp (nếu cập nhật name hoặc code)
    if (name || code) {
      const duplicateCheck = await Faculty.findOne({
        $or: [
          name ? { name } : null,
          code ? { code: code.toUpperCase() } : null
        ].filter(Boolean),
        _id: { $ne: facultyId }
      });
      
      if (duplicateCheck) {
        return res.status(400).json({
          success: false,
          message: duplicateCheck.name === name 
            ? 'Tên khoa đã tồn tại' 
            : 'Mã khoa đã tồn tại'
        });
      }
    }
    
    const updateData = {};
    if (name) updateData.name = name;
    if (code) updateData.code = code.toUpperCase();
    if (description !== undefined) updateData.description = description;
    
    const faculty = await Faculty.findByIdAndUpdate(
      facultyId,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Cập nhật khoa thành công',
      faculty
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID khoa không hợp lệ'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật khoa',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Xóa Khoa
exports.deleteFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khoa với ID này'
      });
    }
    
    // Kiểm tra xem có sinh viên nào thuộc khoa này không
    // (Nếu có relation với Student model)
    // const studentCount = await Student.countDocuments({ facultyId: req.params.id });
    // if (studentCount > 0) {
    //   return res.status(400).json({
    //     success: false,
    //     message: `Không thể xóa khoa vì có ${studentCount} sinh viên đang thuộc khoa này`
    //   });
    // }
    
    await Faculty.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Xóa khoa thành công'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID khoa không hợp lệ'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa khoa',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};