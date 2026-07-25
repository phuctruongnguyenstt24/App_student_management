const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');
const {
  createAdminAccount,
  getAllAdmins,
  getAdminDetails,
  updateAdminProfile,
  deleteAdminAccount,
  toggleAdminAccountStatus
} = require('../controllers/admincontroller');

// Tất cảon routes đều yêu cầu xác thực và quyền admin

// Tạo admin mới
router.post('/create', protect, isAdmin, createAdminAccount);

// Lấy danh sách admin
router.get('/', protect, isAdmin, getAllAdmins);

// Lấy chi tiết admin
router.get('/:id', protect, isAdmin, getAdminDetails);

// Cập nhật admin
router.put('/:id', protect, isAdmin, updateAdminProfile);

// Xóa admin
router.delete('/:id', protect, isAdmin, deleteAdminAccount);

// Toggle status
router.patch('/:id/toggle-status', protect, isAdmin, toggleAdminAccountStatus);

module.exports = router;