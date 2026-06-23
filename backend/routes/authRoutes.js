// routes/auth.js
const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');
const {
  register,
  login,
  getMe,
  createStudentAccount,
  getAllStudents,
  deleteStudent
} = require('../controllers/authController');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);

// Admin only routes
router.post('/create-student', protect, isAdmin, createStudentAccount);
router.get('/students', protect, isAdmin, getAllStudents);
router.delete('/students/:id', protect, isAdmin, deleteStudent);

module.exports = router;