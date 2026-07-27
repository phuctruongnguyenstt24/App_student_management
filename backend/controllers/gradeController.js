// gradeController.js
const Grade = require('../models/Grade');
const Course = require('../models/Course');
const User = require('../models/User');

// Helper: Tính điểm tổng theo công thức GK*40% + CK*60%
const calculateTotalScore = (midtermScore, finalScore) => {
  const midterm = midtermScore || 0;
  const final = finalScore || 0;
  return Number(((midterm * 0.4) + (final * 0.6)).toFixed(2));
};

// Helper: Tính điểm chữ
const calculateGrade = (score) => {
  if (score === 0) return '';
  if (score >= 8.5) return 'A';
  if (score >= 7.0) return 'B';
  if (score >= 5.5) return 'C';
  if (score >= 4.0) return 'D';
  return 'F';
};

// 1. [ADMIN] Lấy danh sách điểm theo học kỳ
exports.getGradesBySemester = async (req, res) => {
  try {
    const { semester } = req.query;

    if (!semester) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng cung cấp học kỳ' 
      });
    }

    const grades = await Grade.find({ semester })
      .populate('student', 'studentId fullName')
      .populate('course', 'courseCode courseName credits');

    // Thêm điểm tổng và điểm chữ vào response
    const formattedGrades = grades.map(grade => {
      const totalScore = calculateTotalScore(grade.midtermScore, grade.finalScore);
      return {
        ...grade.toObject(),
        totalScore: totalScore,
        grade: calculateGrade(totalScore)
      };
    });

    res.status(200).json({ success: true, data: formattedGrades });
  } catch (error) {
    console.error("Lỗi getGradesBySemester:", error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// 2. [ADMIN] Thêm mới hoặc Cập nhật điểm 
exports.updateGrade = async (req, res) => {
  try {
    const { studentCode, courseCode, semester, midtermScore, finalScore } = req.body;

    // Validation
    if (!studentCode || !courseCode || !semester) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng cung cấp đầy đủ thông tin: studentCode, courseCode, semester' 
      });
    }

    // Kiểm tra điểm hợp lệ (0-10)
    if (midtermScore !== undefined && midtermScore !== null && 
        (midtermScore < 0 || midtermScore > 10)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Điểm giữa kỳ phải từ 0 đến 10' 
      });
    }

    if (finalScore !== undefined && finalScore !== null && 
        (finalScore < 0 || finalScore > 10)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Điểm cuối kỳ phải từ 0 đến 10' 
      });
    }

    // Tìm sinh viên
    const student = await User.findOne({ studentId: studentCode, role: 'student' });
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy Sinh viên với mã: ' + studentCode 
      });
    }

    // Tìm môn học
    const course = await Course.findOne({ courseCode: courseCode });
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy Môn học với mã: ' + courseCode 
      });
    }

    // Lưu điểm
    const grade = await Grade.findOneAndUpdate(
      { student: student._id, course: course._id, semester: semester },
      { midtermScore, finalScore },
      { new: true, upsert: true }
    );

    // Tính điểm tổng và điểm chữ
    const totalScore = calculateTotalScore(midtermScore, finalScore);
    const gradeLetter = calculateGrade(totalScore);

    res.status(200).json({ 
      success: true, 
      message: 'Cập nhật điểm thành công!', 
      data: {
        ...grade.toObject(),
        totalScore: totalScore,
        grade: gradeLetter
      }
    });
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

    const student = await User.findById(studentUserId); 
    if (!student || student.role !== 'student') {
      return res.status(404).json({ 
        success: false, 
        message: 'Không có quyền truy cập' 
      });
    }

    const filter = { student: student._id };
    if (semester) filter.semester = semester;

    const myGrades = await Grade.find(filter)
      .populate('course', 'courseCode courseName credits');

    // Thêm điểm tổng và điểm chữ vào response
    const formattedGrades = myGrades.map(grade => {
      const totalScore = calculateTotalScore(grade.midtermScore, grade.finalScore);
      return {
        ...grade.toObject(),
        totalScore: totalScore,
        grade: calculateGrade(totalScore),
        status: totalScore > 0 ? 'completed' : 'in-progress'
      };
    });

    res.status(200).json({ success: true, data: formattedGrades });
  } catch (error) {
    console.error("Lỗi getMyGrades:", error);
    res.status(500).json({ success: false, message: 'Lỗi lấy điểm cá nhân', error: error.message });
  }
};

// 4. [SINH VIÊN] Lấy điểm trung bình lớp theo từng môn học
exports.getClassAverage = async (req, res) => {
  try {
    const { semester } = req.query;
    
    // Validation
    if (!semester) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng cung cấp học kỳ' 
      });
    }
    
    // Lấy tất cả điểm của học kỳ
    const filter = { semester: semester };
    
    const grades = await Grade.find(filter)
      .populate('course', 'courseCode courseName credits');
    
    if (grades.length === 0) {
      return res.status(200).json({ 
        success: true, 
        data: [],
        message: 'Chưa có dữ liệu điểm cho học kỳ này' 
      });
    }
    
    // Nhóm theo môn học và tính trung bình
    const courseMap = new Map();
    
    grades.forEach(grade => {
      const courseCode = grade.course?.courseCode;
      if (!courseCode) return;
      
      // Tính điểm tổng theo công thức: GK*40% + CK*60%
      const totalScore = calculateTotalScore(grade.midtermScore, grade.finalScore);
      
      if (!courseMap.has(courseCode)) {
        courseMap.set(courseCode, {
          courseCode: courseCode,
          courseName: grade.course?.courseName || '',
          credits: grade.course?.credits || 0,
          totalScore: 0,
          count: 0,
          scores: []
        });
      }
      
      const courseData = courseMap.get(courseCode);
      courseData.totalScore += totalScore;
      courseData.count += 1;
      courseData.scores.push(totalScore);
    });
    
    // Tính trung bình
    const result = [];
    courseMap.forEach((value) => {
      const averageScore = value.count > 0 ? Number((value.totalScore / value.count).toFixed(2)) : 0;
      result.push({
        courseCode: value.courseCode,
        courseName: value.courseName,
        credits: value.credits,
        averageScore: averageScore,
        studentCount: value.count,
        minScore: value.scores.length > 0 ? Number(Math.min(...value.scores).toFixed(2)) : 0,
        maxScore: value.scores.length > 0 ? Number(Math.max(...value.scores).toFixed(2)) : 0,
      });
    });
    
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Lỗi getClassAverage:", error);
    res.status(500).json({ success: false, message: 'Lỗi lấy điểm trung bình lớp', error: error.message });
  }
};

// 5. [SINH VIÊN] Lấy thống kê tổng quan GPA của lớp
exports.getClassGPASummary = async (req, res) => {
  try {
    const { semester } = req.query;
    
    // Validation
    if (!semester) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng cung cấp học kỳ' 
      });
    }
    
    const filter = { semester: semester };
    
    const grades = await Grade.find(filter)
      .populate('course', 'credits')
      .populate('student', 'studentId fullName');
    
    if (grades.length === 0) {
      return res.status(200).json({ 
        success: true, 
        data: {
          classAverageGPA: 0,
          totalStudents: 0,
          students: []
        },
        message: 'Chưa có dữ liệu điểm cho học kỳ này' 
      });
    }
    
    // Nhóm theo sinh viên để tính GPA
    const studentMap = new Map();
    
    grades.forEach(grade => {
      const studentId = grade.student?._id?.toString();
      if (!studentId) return;
      
      // Tính điểm tổng theo công thức: GK*40% + CK*60%
      const totalScore = calculateTotalScore(grade.midtermScore, grade.finalScore);
      const credits = grade.course?.credits || 0;
      
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          studentId: studentId,
          studentCode: grade.student?.studentId || '',
          fullName: grade.student?.fullName || '',
          totalWeightedScore: 0,
          totalCredits: 0,
          courses: 0
        });
      }
      
      const studentData = studentMap.get(studentId);
      //gan bien
      studentData.totalWeightedScore += totalScore * credits;
      studentData.totalCredits += credits;
      studentData.courses += 1;
    });
    
    // Tính GPA cho từng sinh viên
    const studentGPAs = [];
    studentMap.forEach((value) => {
      const gpa = value.totalCredits > 0 
        ? Number((value.totalWeightedScore / value.totalCredits).toFixed(2)) 
        : 0;
      studentGPAs.push({
        studentId: value.studentCode,
        fullName: value.fullName,
        gpa: gpa,
        totalCredits: value.totalCredits,
        courses: value.courses
      });
    });
    
    // Tính GPA trung bình của lớp
    const totalGPA = studentGPAs.reduce((sum, s) => sum + s.gpa, 0);
    const classAverageGPA = studentGPAs.length > 0 
      ? Number((totalGPA / studentGPAs.length).toFixed(2)) 
      : 0;
    
    // Sắp xếp theo GPA giảm dần
    studentGPAs.sort((a, b) => b.gpa - a.gpa);
    
    // Xếp hạng
    studentGPAs.forEach((student, index) => {
      student.rank = index + 1;
    });
    
    res.status(200).json({ 
      success: true, 
      data: {
        classAverageGPA: classAverageGPA,
        totalStudents: studentGPAs.length,
        students: studentGPAs
      }
    });
  } catch (error) {
    console.error("Lỗi getClassGPASummary:", error);
    res.status(500).json({ success: false, message: 'Lỗi lấy GPA lớp', error: error.message });
  }
};

// 6. [SINH VIÊN] Lấy GPA và xếp hạng của sinh viên hiện tại
exports.getMyGPA = async (req, res) => {
  try {
    const studentUserId = req.user.id;
    const { semester } = req.query;

    const student = await User.findById(studentUserId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ 
        success: false, 
        message: 'Không có quyền truy cập' 
      });
    }

    const filter = { student: student._id };
    if (semester) filter.semester = semester;

    const myGrades = await Grade.find(filter)
      .populate('course', 'credits');

    if (myGrades.length === 0) {
      return res.status(200).json({ 
        success: true, 
        data: {
          gpa: 0,
          totalCredits: 0,
          courses: 0
        }
      });
    }

    let totalWeightedScore = 0;
    let totalCredits = 0;

    myGrades.forEach(grade => {
      const totalScore = calculateTotalScore(grade.midtermScore, grade.finalScore);
      const credits = grade.course?.credits || 0;
      if (totalScore > 0) {
        totalWeightedScore += totalScore * credits;
        totalCredits += credits;
      }
    });

    const gpa = totalCredits > 0 ? Number((totalWeightedScore / totalCredits).toFixed(2)) : 0;

    res.status(200).json({ 
      success: true, 
      data: {
        gpa: gpa,
        totalCredits: totalCredits,
        courses: myGrades.length
      }
    });
  } catch (error) {
    console.error("Lỗi getMyGPA:", error);
    res.status(500).json({ success: false, message: 'Lỗi lấy GPA', error: error.message });
  }
};