// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const {
  login,
  getMe,
  createStudentAccount,
  getAdminProfile,  // ✅ Đã import
  getAllStudents,
  deleteStudent,
  searchStudents,
  getStudentById,
  uploadAvatar,
  updateStudent,
  changePassword
} = require('../controllers/authController');

const {
  getAllUpdateRequests
} = require('../controllers/updateRequestController');

// Public routes
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);

// Upload avatar
router.post('/upload-avatar', protect, upload.single('avatar'), uploadAvatar);

// Change password
router.put('/change-password', protect, changePassword);

// ✅ Admin profile route
router.get('/admin/profile', protect, isAdmin, getAdminProfile);

// Admin only routes
router.post('/create-student', protect, isAdmin, createStudentAccount);
router.get('/students', protect, isAdmin, getAllStudents);

// Route cụ thể - Đặt TRƯỚC route có tham số :id
router.get('/students/search', protect, isAdmin, searchStudents);
router.get('/students/update-requests', protect, isAdmin, getAllUpdateRequests);

// Route có tham số :id - đặt SAU các route cụ thể
router.get('/students/:id', protect, isAdmin, getStudentById);
router.put('/students/:id', protect, isAdmin, updateStudent);
router.delete('/students/:id', protect, isAdmin, deleteStudent);

module.exports = router;