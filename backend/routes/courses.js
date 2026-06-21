// routes/courses.js
const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Lấy tất cả môn học - Yêu cầu xác thực
router.get('/', protect, async (req, res) => {
  try {
    console.log('GET /api/courses - Fetching all courses');
    console.log('User:', req.user?.email || req.user?.username);
    
    const courses = await Course.find().sort({ courseCode: 1 });
    console.log(`Found ${courses.length} courses`);
    
    res.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách môn học: ' + error.message,
    });
  }
});

// Lấy chi tiết một môn học
router.get('/:id', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy môn học',
      });
    }
    res.json({
      success: true,
      data: course,
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin môn học',
    });
  }
});

// Tạo môn học mới - Yêu cầu admin
router.post('/', protect, isAdmin, async (req, res) => {
  try {
    const { courseCode, courseName, credits, department, description, semester } = req.body;

    console.log('Creating course:', { courseCode, courseName, credits });
    console.log('User:', req.user?.email);

    // Validation
    if (!courseCode || !courseName || !credits) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin bắt buộc',
      });
    }

    // Kiểm tra mã môn học đã tồn tại chưa
    const existingCourse = await Course.findOne({ 
      courseCode: courseCode.toUpperCase() 
    });
    
    if (existingCourse) {
      return res.status(400).json({
        success: false,
        message: `Mã môn học "${courseCode}" đã tồn tại`,
      });
    }

    const course = new Course({
      courseCode: courseCode.toUpperCase(),
      courseName: courseName.trim(),
      credits: Number(credits),
      department: department || '',
      description: description || '',
      semester: semester || '',
    });

    await course.save();

    res.status(201).json({
      success: true,
      message: 'Tạo môn học thành công',
      data: course,
    });
  } catch (error) {
    console.error('Create course error:', error);
    
    // Xử lý lỗi validation
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo môn học: ' + error.message,
    });
  }
});

// Cập nhật môn học - Yêu cầu admin
router.put('/:id', protect, isAdmin, async (req, res) => {
  try {
    const { courseCode, courseName, credits, department, description, semester } = req.body;

    console.log('Updating course:', req.params.id);
    console.log('User:', req.user?.email);

    // Kiểm tra môn học tồn tại
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy môn học',
      });
    }

    // Kiểm tra mã môn học đã tồn tại (trừ chính nó)
    if (courseCode && courseCode.toUpperCase() !== course.courseCode) {
      const existingCourse = await Course.findOne({ 
        courseCode: courseCode.toUpperCase() 
      });
      if (existingCourse) {
        return res.status(400).json({
          success: false,
          message: `Mã môn học "${courseCode}" đã tồn tại`,
        });
      }
    }

    // Cập nhật
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      {
        courseCode: courseCode ? courseCode.toUpperCase() : course.courseCode,
        courseName: courseName || course.courseName,
        credits: credits ? Number(credits) : course.credits,
        department: department !== undefined ? department : course.department,
        description: description !== undefined ? description : course.description,
        semester: semester !== undefined ? semester : course.semester,
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Cập nhật môn học thành công',
      data: updatedCourse,
    });
  } catch (error) {
    console.error('Update course error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật môn học: ' + error.message,
    });
  }
});

// Xóa môn học - Yêu cầu admin
router.delete('/:id', protect, isAdmin, async (req, res) => {
  try {
    console.log('Deleting course:', req.params.id);
    console.log('User:', req.user?.email);

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy môn học',
      });
    }

    // TODO: Kiểm tra xem môn học có đang được sử dụng trong schedule không
    // Nếu có thì không cho xóa

    await Course.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Xóa môn học thành công',
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa môn học: ' + error.message,
    });
  }
});

// Tìm kiếm môn học
router.get('/search/:keyword', protect, async (req, res) => {
  try {
    const keyword = req.params.keyword;
    console.log('Searching courses with keyword:', keyword);
    
    const courses = await Course.find({
      $or: [
        { courseCode: { $regex: keyword, $options: 'i' } },
        { courseName: { $regex: keyword, $options: 'i' } },
      ]
    }).sort({ courseCode: 1 });

    res.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    console.error('Search courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tìm kiếm môn học',
    });
  }
});

module.exports = router;