// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User'); // ⚠️ Import model
const Student = require('../models/Student'); // ⚠️ Import model nếu cần

// GET /api/users/profile - Lấy profile của user hiện tại
router.get('/profile', protect, async (req, res) => {
  try {
    console.log('📡 Fetching profile for user:', req.user.id);
    
    // Lấy user từ database
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      console.log('❌ User not found:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ User found:', user._id, user.role);
    
    // Nếu là student, lấy thêm thông tin từ Student model
    let userData = user.toObject();
    
    if (user.role === 'student') {
      try {
        const student = await Student.findOne({ user: user._id })
          .populate('facultyId', 'name')
          .populate('departmentId', 'name');
        
        if (student) {
          console.log('✅ Student found:', student._id);
          userData = {
            ...userData,
            ...student.toObject(),
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            avatar: user.avatar
          };
        } else {
          console.log('⚠️ No student profile found for user:', user._id);
        }
      } catch (studentError) {
        console.warn('⚠️ Error fetching student data:', studentError.message);
        // Vẫn trả về user data dù không có student profile
      }
    }

    res.json({
      success: true,
      user: userData
    });
  } catch (error) {
    console.error('❌ Profile fetch error:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile: ' + error.message
    });
  }
});

// GET /api/users/:id - Lấy user theo ID
router.get('/:id', protect, async (req, res) => {
  try {
    console.log('📡 Fetching user by ID:', req.params.id);
    
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      console.log('❌ User not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ User found:', user._id, user.role);

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('❌ User fetch error:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error fetching user: ' + error.message
    });
  }
});

module.exports = router;