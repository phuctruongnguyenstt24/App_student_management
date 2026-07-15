const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');
const { protect } = require('../middleware/authMiddleware'); 


// [ADMIN] API DÀNH CHO QUẢN TRỊ VIÊN

// Khớp với fetch(`${API_URL}/grades/admin?semester=${semesterCode}`)
router.get('/admin', protect, gradeController.getGradesBySemester);

// Khớp với fetch(`${API_URL}/grades/admin`, { method: 'POST' })
router.post('/admin', protect, gradeController.updateGrade);


// [STUDENT] API DÀNH CHO SINH VIÊN

// Khớp với API lấy điểm cá nhân trên app sinh viên
router.get('/student/me', protect, gradeController.getMyGrades);

module.exports = router;