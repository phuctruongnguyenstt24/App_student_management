/**
 * Seed script: Tạo attendance sessions với dữ liệu THẬT từ database
 * 
 * - Lấy courses thật từ collection courses
 * - Lấy students thật từ collection users (role: 'student')
 * - Tạo attendance sessions với presentStudents chứa studentId, fullName, checkedAt thật
 * 
 * Chạy: node scripts/seedAttendance.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const User = require('../models/User');

async function seedAttendance() {
  try {
    console.log('⏳ Đang kết nối MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Đã kết nối MongoDB Atlas');

    // Lấy courses thật từ DB
    const courses = await Course.find().lean();
    if (courses.length === 0) {
      console.log('❌ Không có course nào trong database. Hãy thêm courses trước.');
      process.exit(1);
    }
    console.log(`📚 Tìm thấy ${courses.length} courses trong database`);

    // Lấy students thật từ collection users (role = student)
    const students = await User.find({ role: 'student', isActive: true }).select('studentId fullName').lean();
    if (students.length === 0) {
      console.log('❌ Không có student nào trong collection users. Hãy tạo tài khoản student trước.');
      process.exit(1);
    }
    console.log(`👨‍🎓 Tìm thấy ${students.length} students trong database`);
    console.log('   Danh sách:');
    students.forEach(s => console.log(`     - ${s.studentId || '(no ID)'} : ${s.fullName}`));

    // Tạo attendance sessions từ dữ liệu thật
    const now = new Date();
    const sessionsData = [];

    for (let i = 0; i < courses.length; i++) {
      const course = courses[i];
      const sessionTime = new Date(now.getTime() - i * 30 * 60 * 1000); // cách nhau 30 phút

      // Chọn random một số students thật
      const numStudents = Math.min(students.length, Math.floor(Math.random() * Math.min(students.length, 4)) + 2);
      const shuffled = [...students].sort(() => 0.5 - Math.random());
      const selectedStudents = shuffled.slice(0, numStudents).map((s, idx) => ({
        studentId: s.studentId || s._id.toString(),
        fullName: s.fullName,
        checkedAt: new Date(sessionTime.getTime() + (idx + 1) * 2 * 60 * 1000),
      }));

      sessionsData.push({
        courseId: course._id,
        courseCode: course.courseCode,
        courseName: course.courseName,
        department: course.department || '',
        requestedAt: sessionTime,
        status: 'active',
        presentStudents: selectedStudents,
      });
    }

    // Xóa dữ liệu attendance cũ
    const existingCount = await Attendance.countDocuments();
    if (existingCount > 0) {
      console.log(`\n🗑️  Xóa ${existingCount} attendance cũ...`);
      await Attendance.deleteMany({});
    }

    // Insert dữ liệu thật
    const inserted = await Attendance.insertMany(sessionsData);

    console.log(`\n✅ Đã thêm ${inserted.length} attendance sessions với dữ liệu thật!\n`);

    for (const session of inserted) {
      console.log(`📋 ${session.courseCode} - ${session.courseName}`);
      console.log(`   Khoa: ${session.department || '---'}`);
      console.log(`   Status: ${session.status}`);
      console.log(`   Sinh viên đã điểm danh (${session.presentStudents.length}):`);
      for (const student of session.presentStudents) {
        console.log(`     ✓ ${student.studentId} - ${student.fullName} (${student.checkedAt.toLocaleString('vi-VN')})`);
      }
      console.log('');
    }

    console.log('🎉 Hoàn tất! Kiểm tra collection attendances trên MongoDB Atlas.');

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối MongoDB');
    process.exit(0);
  }
}

seedAttendance();
