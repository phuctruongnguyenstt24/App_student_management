const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const Student = require('../models/Student');
const Course = require('../models/Course');
const { protect } = require('../middleware/authMiddleware');

// ============================================
// 1. GET /api/schedules - LẤY TẤT CẢ LỊCH HỌC (Dành cho Admin)
// ============================================
// Route này xử lý khi trang Quản lý Lịch học của Admin tải toàn bộ dữ liệu
router.get('/', protect, async (req, res) => {
    try {
        // Tìm toàn bộ lịch học trong cơ sở dữ liệu
        const schedules = await Schedule.find({})
            .populate('courseId', 'courseCode courseName credits') // Lấy chi tiết thông tin môn học
            .populate('studentId', 'fullName studentId email')
            .populate('studentIds', 'fullName studentId email')
            .sort({ specificDate: 1, startTime: 1 }); // Sắp xếp theo ngày và giờ bắt đầu

        res.json({ success: true, count: schedules.length, data: schedules });
    } catch (error) {
        console.error("Lỗi khi tải danh sách tất cả lịch học:", error);
        res.status(500).json({ success: false, message: 'Không thể tải danh sách lịch học' });
    }
});

// ============================================
// 2. GET /api/schedules/student/:studentId - LẤY LỊCH THEO SINH VIÊN
// ============================================
router.get('/student/:studentId', protect, async (req, res) => {
    try {
        const studentId = req.params.studentId;

        // Bảo vệ máy chủ nếu ID không hợp lệ
        if (!studentId || studentId === 'undefined' || studentId === 'null') {
            return res.status(400).json({ 
                success: false, 
                message: 'Mã ID sinh viên không hợp lệ.' 
            });
        }

        // Tìm thông tin sinh viên
        let student = await Student.findById(studentId);
        
        if (!student) {
            try {
                const User = require('../models/User');
                student = await User.findById(studentId);
            } catch (err) {
                console.log("Không tìm thấy trong bảng User");
            }
        }

        // Xây dựng điều kiện tìm kiếm lịch học
        const queryConditions = [
            { studentId: studentId }, // Lịch gán riêng cho 1 cá nhân
            { studentIds: studentId } // Lịch gán cho nhóm (nếu sinh viên có trong nhóm)
        ];

        // Nếu sinh viên có thông tin lớp, lấy thêm lịch của cả lớp đó
        if (student && student.class) {
            queryConditions.push({ 
                targetClass: student.class,
                targetGroup: 'all' // SỬA TẠI ĐÂY: Chỉ tự động lấy lịch nếu đó là lịch chung của cả lớp
            });
        }

        // Tìm kiếm lịch khớp với điều kiện
        const schedules = await Schedule.find({ $or: queryConditions })
            .populate('courseId', 'courseCode courseName credits')
            .populate('studentId', 'fullName studentId email')
            .populate('studentIds', 'fullName studentId email')
            .sort({ specificDate: 1, startTime: 1 });

        res.json({ success: true, count: schedules.length, data: schedules });
    } catch (error) {
        console.error("Lỗi khi tải lịch học của sinh viên:", error);
        res.status(500).json({ success: false, message: 'Không thể tải lịch học của sinh viên' });
    }
});

// ============================================
// 3. POST /api/schedules - TẠO LỊCH HỌC MỚI
// ============================================
router.post('/', protect, async (req, res) => {
    try {
        const {
            courseId, studentId, studentIds, lecturer, room, dayOfWeek, 
            startTime, endTime, semester, maxStudents, isGroupSchedule,
            specificDate, session, type, targetClass, targetGroup
        } = req.body;

        // 1. Kiểm tra tính hợp lệ của thời gian
        if (!startTime || !endTime || startTime >= endTime) {
            return res.status(400).json({ success: false, message: 'Thời gian bắt đầu và kết thúc không hợp lệ' });
        }

        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ success: false, message: 'Không tìm thấy môn học' });

        // 2. Điều kiện tìm trùng lịch theo khung giờ
        const conflictQuery = {
            startTime: { $lt: endTime },
            endTime: { $gt: startTime }  
        };
        
        if (specificDate) {
            conflictQuery.specificDate = specificDate;
        } else if (dayOfWeek && dayOfWeek.length > 0) {
            conflictQuery.dayOfWeek = { $in: dayOfWeek };
        }

        // 3. Kiểm tra trùng phòng học
        const existingRoom = await Schedule.findOne({ room: room, ...conflictQuery });
        if (existingRoom) {
            return res.status(400).json({ success: false, message: `Phòng ${room} đã có lịch vào khung giờ này`, conflict: 'room' });
        }

        // 4. Kiểm tra trùng giảng viên
        const existingLecturer = await Schedule.findOne({ lecturer: lecturer, ...conflictQuery });
        if (existingLecturer) {
            return res.status(400).json({ success: false, message: `Giảng viên ${lecturer} đã có lịch vào khung giờ này`, conflict: 'lecturer' });
        }

        // Dữ liệu cơ bản
        const baseScheduleData = {
            courseId, lecturer, room, startTime, endTime, semester,
            maxStudents: maxStudents || 50,
            createdBy: req.user._id,
            specificDate, session, type, targetClass, targetGroup, dayOfWeek
        };

        // 5. Xử lý lịch thực hành / lịch nhóm
        if ((isGroupSchedule || type === 'practice') && studentIds && studentIds.length > 0) {
            const conflictStudents = [];
            
            for (const sId of studentIds) {
                let student = await Student.findById(sId);
                
                if (!student) {
                    try {
                        const User = require('../models/User');
                        student = await User.findById(sId);
                    } catch (err) {
                        console.log("Lỗi tìm user:", err.message);
                    }
                }

                if (!student) {
                    conflictStudents.push(`Sinh viên ID ${sId} không tồn tại`);
                    continue;
                }
                
                const studentName = student.fullName || student.name || 'Sinh viên';
                const studentCode = student.studentId || student.code || sId;
                
                const studentQuery = {
                    $and: [
                        { $or: [{ studentId: sId }, { studentIds: sId }] },
                        conflictQuery
                    ]
                };

                const existingSchedule = await Schedule.findOne(studentQuery);
                if (existingSchedule) {
                    conflictStudents.push(`${studentName} (${studentCode}) đã có lịch vào khung giờ này`);
                }
            }

            if (conflictStudents.length > 0 && conflictStudents.length === studentIds.length) {
                return res.status(400).json({ success: false, message: 'Tất cả sinh viên đều bị trùng lịch', conflicts: conflictStudents });
            }

            const schedule = new Schedule({
                ...baseScheduleData,
                studentIds: studentIds,
                isGroupSchedule: true
            });
            
            await schedule.save();
            const populatedSchedule = await Schedule.findById(schedule._id).populate('courseId', 'courseCode courseName credits');
            
            return res.status(201).json({ success: true, message: 'Tạo lịch nhóm thành công', data: populatedSchedule, conflicts: conflictStudents });
        }

        // 6. Xử lý lịch chung cho cả lớp
        const schedule = new Schedule({ ...baseScheduleData, isGroupSchedule: false });
        await schedule.save();
        const populatedSchedule = await Schedule.findById(schedule._id).populate('courseId', 'courseCode courseName credits');

        res.status(201).json({ success: true, message: 'Tạo lịch học thành công', data: populatedSchedule });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Không thể tạo lịch học' });
    }
});

// ============================================
// 4. PUT /api/schedules/:id - CẬP NHẬT LỊCH HỌC
// ============================================
router.put('/:id', protect, async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.id);
        if (!schedule) return res.status(404).json({ success: false, message: 'Không tìm thấy lịch học' });

        const updateData = req.body;
        Object.keys(updateData).forEach(key => {
            schedule[key] = updateData[key];
        });

        await schedule.save();
        const updatedSchedule = await Schedule.findById(schedule._id).populate('courseId', 'courseCode courseName credits');
        res.json({ success: true, message: 'Cập nhật thành công', data: updatedSchedule });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi cập nhật lịch học' });
    }
});

// ============================================
// 5. DELETE /api/schedules/:id - XÓA 1 LỊCH HỌC
// ============================================
router.delete('/:id', protect, async (req, res) => {
    try {
        await Schedule.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Xóa lịch học thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi xóa lịch học' });
    }
});

// ============================================
// 6. DELETE /api/schedules/bulk - XÓA NHIỀU LỊCH HỌC
// ============================================
router.delete('/bulk', protect, async (req, res) => {
    try {
        const result = await Schedule.deleteMany({ _id: { $in: req.body.ids } });
        res.json({ success: true, message: `Đã xóa thành công ${result.deletedCount} lịch học` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi xóa nhiều lịch học' });
    }
});

module.exports = router;