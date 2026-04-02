const express = require('express');
const { login } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', login);

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