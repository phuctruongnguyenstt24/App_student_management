// routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');
const {
  updateStudent,
  updateStudentProfile,
  getStudentById,
  getAllStudents,       
  updateTrainingPoint,  
  getUniqueClasses      // <-- 1. Import thêm hàm lấy danh sách lớp ở đây
} = require('../controllers/studentController');

// ================= ADMIN ROUTES =================

// API: Lấy danh sách các lớp duy nhất (BẮT BUỘC ĐỂ TRÊN CÙNG)
router.get('/students/classes', protect, isAdmin, getUniqueClasses); // <-- 2. Thêm route này vào đây

// API: Lấy danh sách tất cả sinh viên (BẮT BUỘC ĐỂ TRÊN CÙNG)
router.get('/students/all', protect, isAdmin, getAllStudents);

// API: Admin chấm điểm rèn luyện cho sinh viên
router.put('/students/:id/training-point', protect, isAdmin, updateTrainingPoint);

// API: Lấy và cập nhật 1 sinh viên (CÓ :id THÌ PHẢI ĐỂ DƯỚI CÙNG)
router.get('/students/:id', protect, getStudentById);
router.put('/students/:id', protect, isAdmin, updateStudent);

// ================= STUDENT ROUTES =================
router.put('/profile', protect, updateStudentProfile);

module.exports = router;