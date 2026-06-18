const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getMe, 
  createStudentAccount,
  getAllStudents,
  deleteStudent
} = require('../controllers/authController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Public routes (chỉ login)
router.post('/login', login);

// ĐÃ VÔ HIỆU HÓA - không cho đăng ký công khai
router.post('/register', register);

// Private routes (cần đăng nhập)
router.get('/me', protect, getMe);

// Admin only routes
router.post('/create-student', protect, isAdmin, createStudentAccount);
router.get('/students', protect, isAdmin, getAllStudents);
router.delete('/students/:id', protect, isAdmin, deleteStudent);

module.exports = router;