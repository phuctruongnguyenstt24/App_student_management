const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Liên kết với bảng User để biết ai gửi
        required: true
    },
    content: {
        type: String,
        required: [true, 'Vui lòng nhập nội dung góp ý']
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved'], // Trạng thái: chờ duyệt, đã xem, đã giải quyết
        default: 'pending'
    }
}, { timestamps: true }); // Tự động thêm createdAt và updatedAt

module.exports = mongoose.model('Feedback', feedbackSchema);