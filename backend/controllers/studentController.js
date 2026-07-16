// controllers/studentController.js
const User = require('../models/User');

// Cập nhật thông tin sinh viên
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Kiểm tra quyền admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này'
      });
    }

    // Tìm sinh viên
    const student = await User.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên'
      });
    }

    if (student.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không thể cập nhật tài khoản admin'
      });
    }

    // Các trường được phép cập nhật
    const allowedFields = [
      'fullName',
      'phone',
      'address',
      'dateOfBirth',
      'placeOfBirth',
      'class',
      'status',
      'facultyId',
      'departmentId',
      // Thông tin bổ sung
      'academicInfo',
      'personalInfo',
      'familyInfo'
    ];

    // Lọc chỉ lấy các trường được phép
    const filteredData = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    // Cập nhật
    const updatedStudent = await User.findByIdAndUpdate(
      id,
      { $set: filteredData },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Cập nhật thông tin sinh viên thành công',
      student: updatedStudent
    });

  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

// Cập nhật thông tin chi tiết sinh viên (dành cho sinh viên tự cập nhật)
const updateStudentProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    // Sinh viên chỉ được cập nhật thông tin của mình
    const student = await User.findById(userId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên'
      });
    }

    if (student.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ sinh viên mới được cập nhật thông tin'
      });
    }

    // Các trường sinh viên được phép cập nhật
    const allowedFields = [
      'phone',
      'address',
      'dateOfBirth',
      'placeOfBirth',
      'personalInfo',
      'familyInfo'
    ];

    const filteredData = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    const updatedStudent = await User.findByIdAndUpdate(
      userId,
      { $set: filteredData },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      student: updatedStudent
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

// Lấy thông tin chi tiết sinh viên theo ID
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    // Admin có thể xem bất kỳ, student chỉ xem được mình
    if (req.user.role === 'student' && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem thông tin này'
      });
    }

    const student = await User.findById(id)
      .select('-password')
      .populate('facultyId', 'name code')
      .populate('departmentId', 'name code');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên'
      });
    }

    res.json({
      success: true,
      student
    });

  } catch (error) {
    console.error('Get student by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};
// 1. Lấy danh sách sinh viên (Có hỗ trợ lọc theo LỚP và bóc tách điểm theo học kỳ)
const getAllStudents = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xem danh sách này' });
    }

    const { semesterNumber, className } = req.query; // Nhận thêm className từ Frontend gửi lên

    // Tạo điều kiện tìm kiếm mặc định
    const query = { role: 'student' };

    // Nếu Frontend có gửi tên lớp lên -> Thêm vào điều kiện lọc
    if (className) {
      query.class = className; 
    }

    // Truy vấn dữ liệu theo bộ lọc
    const students = await User.find(query).select('-password').lean();

    // Map lại danh sách sinh viên để chắt lọc đúng điểm của học kỳ được chọn (giữ nguyên logic cũ của bro)
    const formattedStudents = students.map(student => {
      let currentSemesterPoint = 0;

      if (semesterNumber && student.trainingPoints && Array.isArray(student.trainingPoints)) {
        const found = student.trainingPoints.find(
          (tp) => tp.semesterNumber === Number(semesterNumber)
        );
        if (found) {
          currentSemesterPoint = found.point;
        }
      } else if (student.trainingPoint !== undefined) {
        currentSemesterPoint = student.trainingPoint;
      }

      return {
        ...student,
        trainingPoint: currentSemesterPoint 
      };
    });

    res.json({ success: true, students: formattedStudents });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
  }
};

// 2. API Chấm/Cập nhật điểm rèn luyện cho 1 sinh viên cụ thể (Theo từng học kỳ)
const updateTrainingPoint = async (req, res) => {
  try {
    const { id } = req.params;
    const { trainingPoint, semesterNumber } = req.body; // Lấy thêm semesterNumber từ Frontend

    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Chỉ Admin mới có quyền chấm điểm rèn luyện' });
    }

    if (trainingPoint === undefined || trainingPoint < 0 || trainingPoint > 100) {
      return res.status(400).json({ success: false, message: 'Điểm rèn luyện phải từ 0 đến 100' });
    }

    if (!semesterNumber) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin học kỳ (semesterNumber)' });
    }

    // Tìm sinh viên
    const student = await User.findOne({ _id: id, role: 'student' });
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sinh viên này' });
    }

    // Nếu sinh viên chưa có mảng trainingPoints thì tạo mới
    if (!student.trainingPoints) {
      student.trainingPoints = [];
    }

    // Kiểm tra xem học kỳ này đã có điểm chưa
    const semesterIndex = student.trainingPoints.findIndex(
      (item) => item.semesterNumber === Number(semesterNumber)
    );

    if (semesterIndex > -1) {
      // Nếu đã có điểm của kỳ này -> Cập nhật điểm mới
      student.trainingPoints[semesterIndex].point = Number(trainingPoint);
    } else {
      // Nếu chưa có -> Push kỳ mới vào mảng
      student.trainingPoints.push({
        semesterNumber: Number(semesterNumber),
        point: Number(trainingPoint)
      });
    }

    // Lưu xuống Database
    await student.save();

    // Lấy lại data mới nhất (không kèm password) để trả về
    const updatedStudent = await User.findById(id).select('-password');

    res.json({ 
      success: true, 
      message: `Đã lưu điểm rèn luyện Học kỳ ${semesterNumber}!`, 
      student: updatedStudent 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
  }
};
// Lấy danh sách toàn bộ các lớp duy nhất (không trùng lặp)
const getUniqueClasses = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện hành động này' });
    }

    // Dùng lệnh .distinct() để tự động gom nhóm tên lớp duy nhất của sinh viên
    const classes = await User.distinct('class', { role: 'student' });

    // Lọc bỏ các giá trị rỗng hoặc null nếu có data rác
    const validClasses = classes.filter(c => c && c.trim() !== '');

    res.json({
      success: true,
      classes: validClasses
    });
  } catch (error) {
    console.error('Get unique classes error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
  }
};

module.exports = {
  updateStudent,
  updateStudentProfile,
  getStudentById,
  getAllStudents,      // <-- Export hàm này
  updateTrainingPoint,  // <-- Export hàm này
  getUniqueClasses      // <-- Export hàm này 
};