// gradeRoutes.js
const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');
const { protect } = require('../middleware/authMiddleware');

// [ADMIN] API DÀNH CHO QUẢN TRỊ VIÊN
router.get('/admin', protect, gradeController.getGradesBySemester);
router.post('/admin', protect, gradeController.updateGrade);

// [STUDENT] API DÀNH CHO SINH VIÊN
router.get('/student/me', protect, gradeController.getMyGrades);
router.get('/student/gpa', protect, gradeController.getMyGPA);
router.get('/class/average', protect, gradeController.getClassAverage);
router.get('/class/gpa-summary', protect, gradeController.getClassGPASummary);

module.exports = router;