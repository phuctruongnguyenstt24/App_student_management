// controllers/feedbackController.js
const Feedback = require('../models/Feedback');
const User = require('../models/User');

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

        // Populate thông tin user để trả về
        const populatedFeedback = await Feedback.findById(feedback._id)
            .populate('user', 'fullName studentId email');

        res.status(201).json({
            success: true,
            message: 'Gửi góp ý thành công',
            feedback: populatedFeedback
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
            .populate('user', 'fullName studentId email phone')
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

// @desc    Lấy chi tiết feedback (Dành cho Admin)
// @route   GET /api/feedback/:id
const getFeedbackDetail = async (req, res) => {
    try {
        const feedback = await Feedback.findById(req.params.id)
            .populate('user', 'fullName studentId email phone');

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy góp ý'
            });
        }

        res.status(200).json({
            success: true,
            feedback
        });
    } catch (error) {
        console.error('Lỗi lấy chi tiết góp ý:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

// @desc    Cập nhật trạng thái feedback (Dành cho Admin)
// @route   PUT /api/feedback/:id
const updateFeedbackStatus = async (req, res) => {
    try {
        const { status } = req.body;
        
        // Kiểm tra status hợp lệ
        if (!['pending', 'reviewed', 'resolved'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Trạng thái không hợp lệ'
            });
        }

        const feedback = await Feedback.findById(req.params.id);
        
        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy góp ý'
            });
        }

        feedback.status = status;
        await feedback.save();

        // Lấy lại thông tin đã populate
        const updatedFeedback = await Feedback.findById(req.params.id)
            .populate('user', 'fullName studentId email');

        res.status(200).json({
            success: true,
            message: 'Cập nhật trạng thái thành công',
            feedback: updatedFeedback
        });
    } catch (error) {
        console.error('Lỗi cập nhật trạng thái:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

// @desc    Phản hồi feedback (Dành cho Admin)
// @route   POST /api/feedback/:id/reply
const replyFeedback = async (req, res) => {
    try {
        const { reply, status } = req.body;
        
        if (!reply || !reply.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập nội dung phản hồi'
            });
        }

        const feedback = await Feedback.findById(req.params.id)
            .populate('user', 'fullName studentId email');
        
        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy góp ý'
            });
        }

        // Cập nhật trạng thái nếu có
        if (status && ['pending', 'reviewed', 'resolved'].includes(status)) {
            feedback.status = status;
        } else {
            // Mặc định chuyển sang resolved khi đã phản hồi
            feedback.status = 'resolved';
        }
        
        await feedback.save();

        // TODO: Gửi email phản hồi cho user
        // Ví dụ: 
        // await sendEmail({
        //     to: feedback.user.email,
        //     subject: 'Phản hồi góp ý của bạn',
        //     html: `<p>Xin chào ${feedback.user.fullName},</p><p>${reply}</p>`
        // });

        // Lấy lại thông tin đã populate
        const updatedFeedback = await Feedback.findById(req.params.id)
            .populate('user', 'fullName studentId email');

        res.status(200).json({
            success: true,
            message: 'Đã gửi phản hồi thành công',
            feedback: updatedFeedback,
            reply: reply
        });
    } catch (error) {
        console.error('Lỗi gửi phản hồi:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

// @desc    Xóa feedback (Dành cho Admin)
// @route   DELETE /api/feedback/:id
const deleteFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.findByIdAndDelete(req.params.id);
        
        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy góp ý'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Đã xóa góp ý thành công'
        });
    } catch (error) {
        console.error('Lỗi xóa góp ý:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

// @desc    Thống kê feedback (Dành cho Admin)
// @route   GET /api/feedback/stats
const getFeedbackStats = async (req, res) => {
    try {
        const total = await Feedback.countDocuments();
        const pending = await Feedback.countDocuments({ status: 'pending' });
        const reviewed = await Feedback.countDocuments({ status: 'reviewed' });
        const resolved = await Feedback.countDocuments({ status: 'resolved' });

        res.status(200).json({
            success: true,
            stats: {
                total,
                pending,
                reviewed,
                resolved
            }
        });
    } catch (error) {
        console.error('Lỗi lấy thống kê:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

module.exports = {
    createFeedback,
    getFeedbacks,
    getFeedbackDetail,
    updateFeedbackStatus,
    replyFeedback,
    deleteFeedback,
    getFeedbackStats
};