const express = require('express');
const {
  buildUserResponse,
  forgotPassword,
  login,
  resendVerification,
  resetPassword,
  signup,
  updateMe,
  verifyEmail,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { uploadAvatarImage } = require('../middleware/upload');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/resend-verification', resendVerification);

router.get('/me', protect, (req, res) => {
  res.status(200).json({
    success: true,
    user: buildUserResponse(req.user),
  });
});

router.patch('/me', protect, uploadAvatarImage, updateMe);

module.exports = router;