// routes/curriculumFramework.js
const express = require('express');
const router = express.Router();
const CurriculumFramework = require('../models/Curriculum');
const Course = require('../models/Course');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// GET: Lấy danh sách chương trình khung
router.get('/', protect , async (req, res) => {
  try {
    const { 
      programCode, 
      facultyId, 
      departmentId, 
      semester, 
      academicYear,
      status 
    } = req.query;

    let filter = {};
    if (programCode) filter.programCode = { $regex: programCode, $options: 'i' };
    if (facultyId) filter.facultyId = facultyId;
    if (departmentId) filter.departmentId = departmentId;
    if (semester) filter.semester = semester;
    if (academicYear) filter.academicYear = academicYear;
    if (status) filter.status = status;

    const frameworks = await CurriculumFramework.find(filter)
      .populate('courseId', 'courseCode courseName credits')
      .populate('facultyId', 'name code')
      .populate('departmentId', 'name code')
      .populate('createdBy', 'username fullName')
      .populate('updatedBy', 'username fullName')
      .sort({ programCode: 1, semester: 1 });

    res.json({
      success: true,
      data: frameworks,
      total: frameworks.length
    });
  } catch (error) {
    console.error('Error fetching curriculum frameworks:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tải danh sách chương trình khung'
    });
  }
});

// GET: Lấy chi tiết chương trình khung theo ID
router.get('/:id',protect, async (req, res) => {
  try {
    const framework = await CurriculumFramework.findById(req.params.id)
      .populate('courseId', 'courseCode courseName credits')
      .populate('facultyId', 'name code')
      .populate('departmentId', 'name code')
      .populate('createdBy', 'username fullName')
      .populate('updatedBy', 'username fullName');

    if (!framework) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chương trình khung'
      });
    }

    res.json({
      success: true,
      data: framework
    });
  } catch (error) {
    console.error('Error fetching curriculum framework:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tải thông tin chương trình khung'
    });
  }
});

// POST: Tạo mới chương trình khung
router.post('/',protect, async (req, res) => {
  try {
    const {
      courseId,
      courseCode,
      courseName,
      credits,
      programName,
      programCode,
      facultyId,
      departmentId,
      semester,
      academicYear,
      status,
      notes
    } = req.body;

    // Kiểm tra required fields
    if (!courseId || !programName || !programCode || !facultyId || !departmentId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
      });
    }

    // Kiểm tra trùng mã chương trình
    const existingFramework = await CurriculumFramework.findOne({ programCode });
    if (existingFramework) {
      return res.status(400).json({
        success: false,
        message: 'Mã chương trình đã tồn tại'
      });
    }

    // Kiểm tra môn học tồn tại
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy môn học'
      });
    }

    // Kiểm tra khoa và ngành tồn tại
    const [faculty, department] = await Promise.all([
      Faculty.findById(facultyId),
      Department.findById(departmentId)
    ]);

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khoa'
      });
    }

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ngành'
      });
    }

    const framework = new CurriculumFramework({
      courseId,
      courseCode: course.courseCode,
      courseName: course.courseName,
      credits: course.credits,
      programName,
      programCode,
      facultyId,
      departmentId,
      semester,
      academicYear,
      status: status || 'incomplete',
      notes: notes || '',
      createdBy: req.user._id
    });

    await framework.save();

    const populatedFramework = await CurriculumFramework.findById(framework._id)
      .populate('courseId', 'courseCode courseName credits')
      .populate('facultyId', 'name code')
      .populate('departmentId', 'name code')
      .populate('createdBy', 'username fullName');

    res.status(201).json({
      success: true,
      message: 'Tạo chương trình khung thành công',
      data: populatedFramework
    });
  } catch (error) {
    console.error('Error creating curriculum framework:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tạo chương trình khung'
    });
  }
});

// PUT: Cập nhật chương trình khung
router.put('/:id',protect, async (req, res) => {
  try {
    const {
      programName,
      programCode,
      facultyId,
      departmentId,
      semester,
      academicYear,
      status,
      notes
    } = req.body;

    const framework = await CurriculumFramework.findById(req.params.id);
    if (!framework) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chương trình khung'
      });
    }

    // Kiểm tra trùng mã chương trình (nếu thay đổi)
    if (programCode && programCode !== framework.programCode) {
      const existingFramework = await CurriculumFramework.findOne({ programCode });
      if (existingFramework) {
        return res.status(400).json({
          success: false,
          message: 'Mã chương trình đã tồn tại'
        });
      }
    }

    // Cập nhật các trường
    if (programName) framework.programName = programName;
    if (programCode) framework.programCode = programCode;
    if (facultyId) framework.facultyId = facultyId;
    if (departmentId) framework.departmentId = departmentId;
    if (semester) framework.semester = semester;
    if (academicYear) framework.academicYear = academicYear;
    if (status) framework.status = status;
    if (notes !== undefined) framework.notes = notes;
    framework.updatedBy = req.user._id;

    await framework.save();

    const populatedFramework = await CurriculumFramework.findById(framework._id)
      .populate('courseId', 'courseCode courseName credits')
      .populate('facultyId', 'name code')
      .populate('departmentId', 'name code')
      .populate('createdBy', 'username fullName')
      .populate('updatedBy', 'username fullName');

    res.json({
      success: true,
      message: 'Cập nhật chương trình khung thành công',
      data: populatedFramework
    });
  } catch (error) {
    console.error('Error updating curriculum framework:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể cập nhật chương trình khung'
    });
  }
});

// DELETE: Xóa chương trình khung
router.delete('/:id',protect, async (req, res) => {
  try {
    const framework = await CurriculumFramework.findById(req.params.id);
    if (!framework) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chương trình khung'
      });
    }

    await framework.deleteOne();

    res.json({
      success: true,
      message: 'Xóa chương trình khung thành công'
    });
  } catch (error) {
    console.error('Error deleting curriculum framework:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể xóa chương trình khung'
    });
  }
});

// PATCH: Cập nhật trạng thái hoàn thành
router.patch('/:id/status',protect, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['completed', 'incomplete', 'in_progress'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }

    const framework = await CurriculumFramework.findById(req.params.id);
    if (!framework) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chương trình khung'
      });
    }

    framework.status = status;
    framework.updatedBy = req.user._id;
    await framework.save();

    res.json({
      success: true,
      message: 'Cập nhật trạng thái thành công',
      data: {
        _id: framework._id,
        status: framework.status,
        completedDate: framework.completedDate
      }
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể cập nhật trạng thái'
    });
  }
});

// GET: Thống kê chương trình khung
router.get('/stats/summary',protect, async (req, res) => {
  try {
    const total = await CurriculumFramework.countDocuments();
    const completed = await CurriculumFramework.countDocuments({ status: 'completed' });
    const incomplete = await CurriculumFramework.countDocuments({ status: 'incomplete' });
    const inProgress = await CurriculumFramework.countDocuments({ status: 'in_progress' });

    // Tổng tín chỉ theo trạng thái
    const totalCreditsResult = await CurriculumFramework.aggregate([
      { $group: { _id: null, total: { $sum: '$credits' } } }
    ]);

    const totalCredits = totalCreditsResult.length > 0 ? totalCreditsResult[0].total : 0;

    res.json({
      success: true,
      data: {
        total,
        completed,
        incomplete,
        inProgress,
        totalCredits,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tải thống kê'
    });
  }
});

// GET: Lấy danh sách chương trình theo mã chương trình
router.get('/program/:programCode',protect, async (req, res) => {
  try {
    const { programCode } = req.params;
    const frameworks = await CurriculumFramework.find({ programCode })
      .populate('courseId', 'courseCode courseName credits')
      .populate('facultyId', 'name code')
      .populate('departmentId', 'name code')
      .sort({ semester: 1 });

    res.json({
      success: true,
      data: frameworks
    });
  } catch (error) {
    console.error('Error fetching program frameworks:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tải chương trình'
    });
  }
});

module.exports = router;