// routes/facultyRoutes.js
const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');
const {
  getFaculties,
  getFacultyById,
  createFaculty,
  updateFaculty,
  deleteFaculty
} = require('../controllers/facultyController');

// Public routes (có thể cho phép xem)
router.get('/', getFaculties);
router.get('/:id', getFacultyById);

// Admin only routes
router.post('/', protect, isAdmin, createFaculty);
router.put('/:id', protect, isAdmin, updateFaculty);
router.delete('/:id', protect, isAdmin, deleteFaculty);

module.exports = router;