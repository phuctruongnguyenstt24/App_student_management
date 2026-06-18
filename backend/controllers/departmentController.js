const Department = require('../models/Department');

// Lấy tất cả Ngành
exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ createdAt: -1 });
    res.json({ success: true, departments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy Ngành theo Khoa
exports.getDepartmentsByFaculty = async (req, res) => {
  try {
    const departments = await Department.find({ facultyId: req.params.facultyId });
    res.json({ success: true, departments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Tạo Ngành mới
exports.createDepartment = async (req, res) => {
  try {
    const { name, code, facultyId } = req.body;
    const department = await Department.create({ name, code, facultyId });
    res.status(201).json({ success: true, department });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật Ngành
exports.updateDepartment = async (req, res) => {
  try {
    const { name, code, facultyId } = req.body;
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { name, code, facultyId },
      { new: true }
    );
    if (!department) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy ngành' });
    }
    res.json({ success: true, department });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xóa Ngành
exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy ngành' });
    }
    res.json({ success: true, message: 'Xóa ngành thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};