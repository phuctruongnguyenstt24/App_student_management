// routes/feedbackRoutes.js
const express = require('express');
const router = express.Router();
const {
    createFeedback,
    getFeedbacks,
    getFeedbackDetail,
    updateFeedbackStatus,
    replyFeedback,
    deleteFeedback,
    getFeedbackStats
} = require('../controllers/feedbackController');

// Import middleware
const { protect, isAdmin } = require('../middleware/authMiddleware');
 

// ===== ROUTES DÀNH CHO SINH VIÊN =====
// Route POST: Sinh viên gửi góp ý
router.post('/', protect, createFeedback);

// ===== ROUTES DÀNH CHO ADMIN =====
// Route GET: Lấy danh sách góp ý (Admin)
router.get('/', protect, isAdmin, getFeedbacks);

// Route GET: Lấy thống kê (Admin)
router.get('/stats', protect, isAdmin, getFeedbackStats);

// Route GET: Lấy chi tiết feedback (Admin)
router.get('/:id', protect, isAdmin, getFeedbackDetail);

// Route PUT: Cập nhật trạng thái (Admin)
router.put('/:id', protect, isAdmin, updateFeedbackStatus);

// Route POST: Phản hồi feedback (Admin)
router.post('/:id/reply', protect, isAdmin, replyFeedback);

// Route DELETE: Xóa feedback (Admin)
router.delete('/:id', protect,isAdmin, deleteFeedback);

module.exports = router;