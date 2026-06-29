// routes/updateRequestRoutes.js
const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');
const {
  createUpdateRequest,
  getAllUpdateRequests,
  getMyUpdateRequests,
  approveUpdateRequest,
  rejectUpdateRequest,
  deleteUpdateRequest
} = require('../controllers/updateRequestController');

// Student routes
router.post('/update-requests', protect, createUpdateRequest);
router.get('/update-requests/my', protect, getMyUpdateRequests);
router.delete('/update-requests/:id', protect, deleteUpdateRequest);

// Admin routes
router.get('/update-requests', protect, isAdmin, getAllUpdateRequests);
router.put('/update-requests/:id/approve', protect, isAdmin, approveUpdateRequest);
router.put('/update-requests/:id/reject', protect, isAdmin, rejectUpdateRequest);

module.exports = router;