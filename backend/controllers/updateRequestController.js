// controllers/updateRequestController.js
const UpdateRequest = require('../models/UpdateRequest');
const User = require('../models/User');

// Tạo yêu cầu cập nhật
const createUpdateRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fields, data, notes } = req.body;

    if (!fields || fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ít nhất một trường cần cập nhật'
      });
    }

    // Kiểm tra sinh viên tồn tại
    const student = await User.findById(userId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên'
      });
    }

    // Tạo yêu cầu mới
    const request = await UpdateRequest.create({
      studentId: userId,
      studentName: student.fullName,
      fields: fields,
      data: data,
      notes: notes || '',
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Gửi yêu cầu cập nhật thành công',
      request
    });

  } catch (error) {
    console.error('Create update request error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

// Lấy tất cả yêu cầu (admin)
const getAllUpdateRequests = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập'
      });
    }

    const requests = await UpdateRequest.find()
      .populate('studentId', 'fullName studentId email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      requests
    });

  } catch (error) {
    console.error('Get all requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

// Lấy yêu cầu của sinh viên
const getMyUpdateRequests = async (req, res) => {
  try {
    const requests = await UpdateRequest.find({ studentId: req.user.id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      requests
    });

  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

// Duyệt yêu cầu
const approveUpdateRequest = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này'
      });
    }

    const request = await UpdateRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Yêu cầu đã được ${request.status === 'approved' ? 'duyệt' : 'từ chối'} trước đó`
      });
    }

    // Cập nhật thông tin cho sinh viên
    const student = await User.findById(request.studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên'
      });
    }

    // Cập nhật dữ liệu
    const updateData = request.data;
    const updatedStudent = await User.findByIdAndUpdate(
      request.studentId,
      { $set: updateData },
      { new: true }
    );

    // Cập nhật trạng thái request
    request.status = 'approved';
    request.processedBy = req.user.id;
    request.processedAt = new Date();
    await request.save();

    res.json({
      success: true,
      message: 'Duyệt yêu cầu cập nhật thành công',
      request,
      student: updatedStudent
    });

  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

// Từ chối yêu cầu
const rejectUpdateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này'
      });
    }

    const request = await UpdateRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Yêu cầu đã được ${request.status === 'approved' ? 'duyệt' : 'từ chối'} trước đó`
      });
    }

    request.status = 'rejected';
    request.notes = reason || 'Không có lý do cụ thể';
    request.processedBy = req.user.id;
    request.processedAt = new Date();
    await request.save();

    res.json({
      success: true,
      message: 'Từ chối yêu cầu cập nhật thành công',
      request
    });

  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

// Xóa yêu cầu (sinh viên có thể xóa yêu cầu pending của mình)
const deleteUpdateRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await UpdateRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu'
      });
    }

    // Kiểm tra quyền: admin hoặc chính sinh viên đó
    if (req.user.role !== 'admin' && request.studentId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa yêu cầu này'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa yêu cầu đã được xử lý'
      });
    }

    await request.deleteOne();

    res.json({
      success: true,
      message: 'Xóa yêu cầu thành công'
    });

  } catch (error) {
    console.error('Delete request error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

module.exports = {
  createUpdateRequest,
  getAllUpdateRequests,
  getMyUpdateRequests,
  approveUpdateRequest,
  rejectUpdateRequest,
  deleteUpdateRequest
};