const express = require('express');
const {
  forgotPassword,
  login,
  resendVerification,
  resetPassword,
  signup,
  verifyEmail,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

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
    user: {
      id: req.user._id,
      fullName: req.user.fullName,
      email: req.user.email,
      studentId: req.user.studentId,
      phoneNumber: req.user.phoneNumber,
      isVerified: req.user.isVerified,
    },
  });
});

module.exports = router;