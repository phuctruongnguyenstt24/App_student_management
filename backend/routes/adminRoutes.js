const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');
const {
  createAdmin,
  getAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  toggleAdminStatus
} = require('../controllers/admincontroller');

// Tất cảon routes đều yêu cầu xác thực và quyền admin

// Tạo admin mới
router.post('/create', protect, isAdmin, createAdmin);

// Lấy danh sách admin
router.get('/', protect, isAdmin, getAdmins);

// Lấy chi tiết admin
router.get('/:id', protect, isAdmin, getAdminById);

// Cập nhật admin
router.put('/:id', protect, isAdmin, updateAdmin);

// Xóa admin
router.delete('/:id', protect, isAdmin, deleteAdmin);

// Toggle status
router.patch('/:id/toggle-status', protect, isAdmin, toggleAdminStatus);

module.exports = router;