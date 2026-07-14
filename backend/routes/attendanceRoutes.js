const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Get attendance sessions (query ?status=active to filter active)
router.get('/', protect, async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;
    const sessions = await Attendance.find(query).sort({ requestedAt: -1 });
    res.json({ success: true, data: sessions });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy buổi điểm danh' });
  }
});

// Create attendance session (admin)
router.post('/', protect, isAdmin, async (req, res) => {
  try {
    const { courseId, courseCode, courseName, department } = req.body;

    if (!courseId || !courseCode || !courseName) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin môn học' });
    }

    // Optionally check course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy môn học' });
    }

    const session = new Attendance({
      courseId,
      courseCode,
      courseName,
      department: department || '',
      requestedBy: req.user?._id,
      status: 'active',
    });

    await session.save();

    console.log('Created attendance session:', { id: session._id, courseCode: session.courseCode, by: req.user?.email || req.user?.username });

    res.status(201).json({ success: true, data: session });
  } catch (error) {
    console.error('Create attendance error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tạo buổi điểm danh' });
  }
});

// Mark attendance for a student
router.post('/:id/mark', protect, async (req, res) => {
  try {
    const session = await Attendance.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Không tìm thấy buổi điểm danh' });
    if (session.status !== 'active') return res.status(400).json({ success: false, message: 'Buổi điểm danh đã đóng' });

    const { studentId, fullName } = req.body;
    if (!studentId && !fullName) return res.status(400).json({ success: false, message: 'Thiếu thông tin sinh viên' });

    const already = session.presentStudents.some((s) => {
      if (studentId && s.studentId === studentId) return true;
      if (fullName && s.fullName === fullName) return true;
      return false;
    });

    if (already) return res.json({ success: true, data: session });

    const studentEntry = { studentId: studentId || '', fullName: fullName || 'Sinh viên', checkedAt: new Date() };
    session.presentStudents.push(studentEntry);
    await session.save();
    console.log('Marked attendance:', { sessionId: session._id, student: studentEntry, by: req.user?.email || req.user?.username });
    res.json({ success: true, data: session });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lưu điểm danh' });
  }
});

// Close session (admin)
router.put('/:id/close', protect, isAdmin, async (req, res) => {
  try {
    const session = await Attendance.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Không tìm thấy buổi điểm danh' });
    session.status = 'closed';
    await session.save();
    res.json({ success: true, data: session });
  } catch (error) {
    console.error('Close attendance error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi đóng buổi điểm danh' });
  }
});

module.exports = router;
