const Grade = require('../models/Grade');
const Course = require('../models/Course');
const User = require('../models/User'); 

// 1. [ADMIN] Lấy danh sách những điểm ĐÃ CÓ theo học kỳ
exports.getGradesBySemester = async (req, res) => {
  try {
    const { semester } = req.query;

    // Vì Frontend giờ đã tự động trộn dữ liệu để hiện tất cả sinh viên,
    // Backend chỉ việc trả về những đứa ĐÃ ĐƯỢC NHẬP ĐIỂM là đủ. Cực kỳ nhẹ!
    const grades = await Grade.find({ semester })
      .populate('student', 'studentId fullName')
      .populate('course', 'courseCode courseName credits');

    res.status(200).json({ success: true, data: grades });
  } catch (error) {
    console.error("Lỗi getGradesBySemester:", error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// 2. [ADMIN] Thêm mới hoặc Cập nhật điểm 
exports.updateGrade = async (req, res) => {
  try {
    const { studentCode, courseCode, semester, midtermScore, finalScore } = req.body;

    // 1. TÌM SINH VIÊN (Tìm trong bảng User)
    const student = await User.findOne({ studentId: studentCode, role: 'student' });
    if (!student) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy Sinh viên với mã: ' + studentCode });
    }

    // 2. TÌM MÔN HỌC GỐC (Chắc chắn có vì Frontend lấy từ bảng này)
    const course = await Course.findOne({ courseCode: courseCode });
    if (!course) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy Môn học với mã: ' + courseCode });
    }

    // 3. LƯU ĐIỂM VÀO BẢNG GRADE
    const grade = await Grade.findOneAndUpdate(
        { student: student._id, course: course._id, semester: semester },
        { midtermScore, finalScore },
        { new: true, upsert: true } // Bí quyết ở đây: Đã có thì update, chưa có thì tạo mới
    );

    res.status(200).json({ success: true, message: 'Cập nhật điểm thành công!', data: grade });
  } catch (error) {
    console.error("Lỗi updateGrade:", error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lưu điểm', error: error.message });
  }
};

// 3. [SINH VIÊN] Xem thành tích cá nhân
exports.getMyGrades = async (req, res) => {
  try {
    const studentUserId = req.user.id; 
    const { semester } = req.query;

    // Kiểm tra quyền
    const student = await User.findById(studentUserId); 
    if (!student || student.role !== 'student') {
        return res.status(404).json({ success: false, message: 'Không có quyền truy cập' });
    }

    // Lọc theo sinh viên và học kỳ (nếu có)
    const filter = { student: student._id };
    if (semester) filter.semester = semester;

    const myGrades = await Grade.find(filter)
      .populate('course', 'courseCode courseName credits');

    res.status(200).json({ success: true, data: myGrades });
  } catch (error) {
    console.error("Lỗi getMyGrades:", error);
    res.status(500).json({ success: false, message: 'Lỗi lấy điểm cá nhân', error: error.message });
  }
};