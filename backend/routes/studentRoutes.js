// routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');
const {
  updateStudent,
  updateStudentProfile,
  getStudentById
} = require('../controllers/studentController');

// Admin routes
router.put('/students/:id', protect, isAdmin, updateStudent);
router.get('/students/:id', protect, getStudentById);

// Student routes
router.put('/profile', protect, updateStudentProfile);

module.exports = router;