const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  sendMessage,
  getInbox,
  getMessagesOnPost,
  getThreadWithUser,
  deleteThreadWithUser,
} = require('../controllers/messageController');

const router = express.Router();

router.post('/', protect, sendMessage);
router.get('/inbox', protect, getInbox);
router.get('/post/:postId/:postType', getMessagesOnPost);
router.get('/thread/:otherUserId/:postId/:postType', protect, getThreadWithUser);
router.delete('/thread/:otherUserId/:postId/:postType', protect, deleteThreadWithUser);

module.exports = router;
