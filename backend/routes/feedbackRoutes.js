const express = require('express');
const router = express.Router();
const { createFeedback, getFeedbacks } = require('../controllers/feedbackController');

// Import middleware để chặn người lạ (bắt buộc đăng nhập mới được gửi)
// (Mình giả định tên hàm là protect từ file authMiddleware.js của bạn)
const { protect } = require('../middleware/authMiddleware');

// Route POST: Sinh viên gửi góp ý
router.post('/', protect, createFeedback);

// Route GET: Lấy danh sách góp ý (có thể thêm authorize('admin') nếu muốn chỉ admin xem)
router.get('/', protect, getFeedbacks);

module.exports = router;