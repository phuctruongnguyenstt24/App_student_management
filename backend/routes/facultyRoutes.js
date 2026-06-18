const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');
const {
  getFaculties,
  createFaculty,
  updateFaculty,
  deleteFaculty,
} = require('../controllers/facultyController');

router.route('/')
  .get(protect, getFaculties)
  .post(protect, isAdmin, createFaculty);

router.route('/:id')
  .put(protect, isAdmin, updateFaculty)
  .delete(protect, isAdmin, deleteFaculty);

module.exports = router;