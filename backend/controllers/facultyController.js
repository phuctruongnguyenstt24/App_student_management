const Faculty = require('../models/Faculty');

// Lấy tất cả Khoa
exports.getFaculties = async (req, res) => {
  try {
    const faculties = await Faculty.find().sort({ createdAt: -1 });
    res.json({ success: true, faculties });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Tạo Khoa mới
exports.createFaculty = async (req, res) => {
  try {
    const { name, code } = req.body;
    const faculty = await Faculty.create({ name, code });
    res.status(201).json({ success: true, faculty });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật Khoa
exports.updateFaculty = async (req, res) => {
  try {
    const { name, code } = req.body;
    const faculty = await Faculty.findByIdAndUpdate(
      req.params.id,
      { name, code },
      { new: true }
    );
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khoa' });
    }
    res.json({ success: true, faculty });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xóa Khoa
exports.deleteFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndDelete(req.params.id);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khoa' });
    }
    res.json({ success: true, message: 'Xóa khoa thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};