const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');
const {
  getDepartments,
  getDepartmentsByFaculty,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/departmentController');

router.route('/')
  .get(protect, getDepartments)
  .post(protect, isAdmin, createDepartment);

router.get('/faculty/:facultyId', protect, getDepartmentsByFaculty);

router.route('/:id')
  .put(protect, isAdmin, updateDepartment)
  .delete(protect, isAdmin, deleteDepartment);

module.exports = router;