const Feedback = require('../models/Feedback');

// @desc    Gửi góp ý mới (Dành cho Sinh viên)
// @route   POST /api/feedback
const createFeedback = async (req, res) => {
    try {
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp nội dung góp ý'
            });
        }

        // Tạo góp ý mới, lấy ID người dùng từ token (req.user.id)
        const feedback = await Feedback.create({
            user: req.user.id, 
            content: content
        });

        res.status(201).json({
            success: true,
            message: 'Gửi góp ý thành công',
            feedback
        });
    } catch (error) {
        console.error('Lỗi khi tạo góp ý:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau'
        });
    }
};

// @desc    Lấy danh sách tất cả góp ý (Dành cho Admin)
// @route   GET /api/feedback
const getFeedbacks = async (req, res) => {
    try {
        // Lấy tất cả góp ý, đính kèm thêm thông tin tên và mssv của sinh viên gửi
        const feedbacks = await Feedback.find()
            .populate('user', 'fullName studentId email')
            .sort({ createdAt: -1 }); // Mới nhất lên đầu

        res.status(200).json({
            success: true,
            count: feedbacks.length,
            feedbacks
        });
    } catch (error) {
        console.error('Lỗi lấy danh sách góp ý:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

module.exports = {
    createFeedback,
    getFeedbacks
};