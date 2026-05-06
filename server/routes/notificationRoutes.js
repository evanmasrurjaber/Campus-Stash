const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} = require('../controllers/notificationController');

const router = express.Router();

router.get('/', protect, getNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.put('/:notificationId/read', protect, markAsRead);
router.put('/mark-all-as-read', protect, markAllAsRead);

module.exports = router;
