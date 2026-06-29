// routes/scheduleRoutes.js
const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const Student = require('../models/Student');
const Course = require('../models/Course');
const { protect } = require('../middleware/authMiddleware');

// GET: Lấy tất cả lịch học
router.get('/', protect, async (req, res) => {
    try {
        const schedules = await Schedule.find()
            .populate('courseId', 'courseCode courseName credits')
            .populate('studentId', 'fullName studentId email')
            .populate('studentIds', 'fullName studentId email')
            .populate('createdBy', 'fullName email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: schedules.length,
            data: schedules,
        });
    } catch (error) {
        console.error('Get schedules error:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải danh sách lịch học',
        });
    }
});

// GET: Lấy lịch học theo ID sinh viên
router.get('/student/:studentId', protect, async (req, res) => {
    try {
        const schedules = await Schedule.find({
            $or: [
                { studentId: req.params.studentId },
                { studentIds: req.params.studentId },
            ],
        })
            .populate('courseId', 'courseCode courseName credits')
            .populate('studentId', 'fullName studentId email')
            .populate('studentIds', 'fullName studentId email')
            .sort({ dayOfWeek: 1, startTime: 1 });

        res.json({
            success: true,
            count: schedules.length,
            data: schedules,
        });
    } catch (error) {
        console.error('Get student schedules error:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải lịch học của sinh viên',
        });
    }
});

// POST: Tạo lịch học mới
router.post('/', protect, async (req, res) => {
    try {
        const {
            courseId,
            studentId,
            studentIds,
            lecturer,
            room,
            dayOfWeek,
            startTime,
            endTime,
            semester,
            maxStudents,
            isGroupSchedule,
        } = req.body;

        // Validate thời gian
        if (startTime >= endTime) {
            return res.status(400).json({
                success: false,
                message: 'Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc',
            });
        }

        // Validate khóa học
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khóa học',
            });
        }
        // Kiểm tra phòng học trùng
        const existingRoom = await Schedule.findOne({
            room: room,
            dayOfWeek: { $in: dayOfWeek },
            $or: [
                { startTime: { $lt: endTime, $gte: startTime } },
                { endTime: { $gt: startTime, $lte: endTime } },
                { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
            ]
        });

        if (existingRoom) {
            return res.status(400).json({
                success: false,
                message: `Phòng ${room} đã có lịch vào khung giờ này`,
                conflict: 'room'
            });
        }

        // Kiểm tra Giáo viên trùng
        const existingLecturer = await Schedule.findOne({
            lecturer: lecturer,
            dayOfWeek: { $in: dayOfWeek },
            $or: [
                { startTime: { $lt: endTime, $gte: startTime } },
                { endTime: { $gt: startTime, $lte: endTime } },
                { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
            ]
        });

        if (existingLecturer) {
            return res.status(400).json({
                success: false,
                message: `Giảng viên ${lecturer} đã có lịch vào khung giờ này`,
                conflict: 'lecturer'
            });
        }

        // Nếu là lịch nhóm
        if (isGroupSchedule && studentIds && studentIds.length > 0) {
            // Kiểm tra trùng lịch cho từng sinh viên
            const conflictStudents = [];
            const createdSchedules = [];

            for (const studentId of studentIds) {
                // Kiểm tra sinh viên tồn tại
                const student = await Student.findById(studentId);
                if (!student) {
                    conflictStudents.push(`Sinh viên ${studentId} không tồn tại`);
                    continue;
                }

                // Kiểm tra trùng lịch
                const existingSchedule = await Schedule.findOne({
                    $or: [
                        { studentId: studentId },
                        { studentIds: studentId },
                    ],
                    dayOfWeek,
                    $or: [
                        {
                            startTime: { $lt: endTime, $gte: startTime },
                        },
                        {
                            endTime: { $gt: startTime, $lte: endTime },
                        },
                    ],
                });

                if (existingSchedule) {
                    const studentName = student.fullName || studentId;
                    conflictStudents.push(`${studentName} (${student.studentId}) đã có lịch học vào khung giờ này`);
                    continue;
                }

                // Tạo lịch cho sinh viên
                const scheduleData = {
                    courseId,
                    studentId,
                    studentIds: studentIds,
                    lecturer,
                    room,
                    dayOfWeek,
                    startTime,
                    endTime,
                    semester,
                    maxStudents: maxStudents || 50,
                    isGroupSchedule: true,
                    createdBy: req.user._id,
                };

                const schedule = new Schedule(scheduleData);
                await schedule.save();
                createdSchedules.push(schedule);
            }

            if (createdSchedules.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Không thể tạo lịch cho bất kỳ sinh viên nào',
                    conflicts: conflictStudents,
                });
            }

            const populatedSchedules = await Schedule.find({
                _id: { $in: createdSchedules.map(s => s._id) },
            })
                .populate('courseId', 'courseCode courseName credits')
                .populate('studentId', 'fullName studentId email')
                .populate('studentIds', 'fullName studentId email');

            return res.json({
                success: true,
                message: `Đã tạo ${createdSchedules.length} lịch học`,
                data: populatedSchedules,
                conflicts: conflictStudents,
            });
        }

        // Nếu là lịch cá nhân
        if (studentId) {
            // Kiểm tra sinh viên tồn tại
            const student = await Student.findById(studentId);
            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy sinh viên',
                });
            }

            // Kiểm tra trùng lịch
            const existingSchedule = await Schedule.findOne({
                $or: [
                    { studentId: studentId },
                    { studentIds: studentId },
                ],
                dayOfWeek,
                $or: [
                    {
                        startTime: { $lt: endTime, $gte: startTime },
                    },
                    {
                        endTime: { $gt: startTime, $lte: endTime },
                    },
                ],
            });

            if (existingSchedule) {
                return res.status(400).json({
                    success: false,
                    message: `Sinh viên ${student.fullName} đã có lịch học vào khung giờ này`,
                });
            }

            const scheduleData = {
                courseId,
                studentId,
                lecturer,
                room,
                dayOfWeek,
                startTime,
                endTime,
                semester,
                maxStudents: maxStudents || 50,
                isGroupSchedule: false,
                createdBy: req.user._id,
            };

            const schedule = new Schedule(scheduleData);
            await schedule.save();

            const populatedSchedule = await Schedule.findById(schedule._id)
                .populate('courseId', 'courseCode courseName credits')
                .populate('studentId', 'fullName studentId email');

            return res.json({
                success: true,
                message: 'Tạo lịch học thành công',
                data: populatedSchedule,
            });
        }

        // Lịch không có sinh viên cụ thể (lịch chung)
        const scheduleData = {
            courseId,
            lecturer,
            room,
            dayOfWeek,
            startTime,
            endTime,
            semester,
            maxStudents: maxStudents || 50,
            isGroupSchedule: false,
            createdBy: req.user._id,
        };

        const schedule = new Schedule(scheduleData);
        await schedule.save();

        const populatedSchedule = await Schedule.findById(schedule._id)
            .populate('courseId', 'courseCode courseName credits');

        res.status(201).json({
            success: true,
            message: 'Tạo lịch học thành công',
            data: populatedSchedule,
        });

    } catch (error) {
        console.error('Create schedule error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Không thể tạo lịch học',
        });
    }
});

// PUT: Cập nhật lịch học
router.put('/:id', protect, async (req, res) => {
    try {
        const {
            courseId,
            lecturer,
            room,
            dayOfWeek,
            startTime,
            endTime,
            semester,
            maxStudents,
            status,
            studentIds,
        } = req.body;

        const schedule = await Schedule.findById(req.params.id);
        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lịch học',
            });
        }

        // Validate thời gian
        if (startTime && endTime && startTime >= endTime) {
            return res.status(400).json({
                success: false,
                message: 'Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc',
            });
        }
        // =====  KIỂM TRA KHI CẬP NHẬT =====
        // Lấy giá trị mới hoặc giữ nguyên
        const newRoom = room || schedule.room;
        const newLecturer = lecturer || schedule.lecturer;
        const newDayOfWeek = dayOfWeek || schedule.dayOfWeek;
        const newStartTime = startTime || schedule.startTime;
        const newEndTime = endTime || schedule.endTime;

        // Kiểm tra phòng học trùng (bỏ qua chính nó)
        if (room || dayOfWeek || startTime || endTime) {
            const existingRoom = await Schedule.findOne({
                _id: { $ne: req.params.id }, // Không kiểm tra chính nó
                room: newRoom,
                dayOfWeek: { $in: newDayOfWeek },
                $or: [
                    { startTime: { $lt: newEndTime, $gte: newStartTime } },
                    { endTime: { $gt: newStartTime, $lte: newEndTime } },
                    { startTime: { $lte: newStartTime }, endTime: { $gte: newEndTime } }
                ]
            });

            if (existingRoom) {
                return res.status(400).json({
                    success: false,
                    message: `Phòng ${newRoom} đã có lịch vào khung giờ này`,
                    conflict: 'room'
                });
            }

            // Kiểm tra giảng viên trùng (bỏ qua chính nó)
            const existingLecturer = await Schedule.findOne({
                _id: { $ne: req.params.id },
                lecturer: newLecturer,
                dayOfWeek: { $in: newDayOfWeek },
                $or: [
                    { startTime: { $lt: newEndTime, $gte: newStartTime } },
                    { endTime: { $gt: newStartTime, $lte: newEndTime } },
                    { startTime: { $lte: newStartTime }, endTime: { $gte: newEndTime } }
                ]
            });

            if (existingLecturer) {
                return res.status(400).json({
                    success: false,
                    message: `Giảng viên ${newLecturer} đã có lịch vào khung giờ này`,
                    conflict: 'lecturer'
                });
            }
        }

        // Cập nhật
        if (courseId) schedule.courseId = courseId;
        if (lecturer) schedule.lecturer = lecturer;
        if (room) schedule.room = room;
        if (dayOfWeek) schedule.dayOfWeek = dayOfWeek;
        if (startTime) schedule.startTime = startTime;
        if (endTime) schedule.endTime = endTime;
        if (semester) schedule.semester = semester;
        if (maxStudents) schedule.maxStudents = maxStudents;
        if (status) schedule.status = status;
        if (studentIds) schedule.studentIds = studentIds;

        await schedule.save();

        const updatedSchedule = await Schedule.findById(schedule._id)
            .populate('courseId', 'courseCode courseName credits')
            .populate('studentId', 'fullName studentId email')
            .populate('studentIds', 'fullName studentId email');

        res.json({
            success: true,
            message: 'Cập nhật lịch học thành công',
            data: updatedSchedule,
        });

    } catch (error) {
        console.error('Update schedule error:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể cập nhật lịch học',
        });
    }
});

// DELETE: Xóa lịch học
router.delete('/:id', protect, async (req, res) => {
    try {
        const schedule = await Schedule.findByIdAndDelete(req.params.id);
        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lịch học',
            });
        }

        res.json({
            success: true,
            message: 'Xóa lịch học thành công',
            data: schedule,
        });

    } catch (error) {
        console.error('Delete schedule error:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể xóa lịch học',
        });
    }
});

// DELETE: Xóa nhiều lịch học
router.delete('/bulk', protect, async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp danh sách ID lịch học',
            });
        }

        const result = await Schedule.deleteMany({ _id: { $in: ids } });

        res.json({
            success: true,
            message: `Đã xóa ${result.deletedCount} lịch học`,
            deletedCount: result.deletedCount,
        });

    } catch (error) {
        console.error('Bulk delete schedules error:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể xóa lịch học',
        });
    }
});

module.exports = router;