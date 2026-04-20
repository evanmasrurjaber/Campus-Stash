const jwt = require('jsonwebtoken');
const User = require('../models/User');

const buildUserResponse = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  studentId: user.studentId,
  phoneNumber: user.phoneNumber,
  isVerified: user.isVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const generateAccessToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(
    { sub: userId.toString() },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  );
};

const validateSignupPayload = ({ fullName, email, studentId, phoneNumber, password }) => {
  if (!fullName || !email || !studentId || !phoneNumber || !password) {
    return 'Full name, email, student ID, phone number, and password are required';
  }

  if (!Number.isFinite(studentId)) {
    return 'Student ID must be a valid number';
  }

  if (String(studentId).length !== 8) {
    return 'Enter a valid 8-digit student ID';
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }

  const passwordRules = [
    [password.length >= 8, 'Password must be at least 8 characters long'],
    [password.length <= 64, 'Password cannot exceed 64 characters'],
    [/[a-z]/.test(password), 'Password must include at least one lowercase letter'],
    [/[A-Z]/.test(password), 'Password must include at least one uppercase letter'],
    [/\d/.test(password), 'Password must include at least one number'],
    [/[!@#$%^&*()_\-+=[\]{};:'"\\|,.<>/?]/.test(password), 'Password must include at least one special character'],
    [!/\s/.test(password), 'Password must not contain spaces'],
    [!/(.)\1\1/.test(password), 'Password must not contain a character repeated 3+ times in a row'],
  ];

  for (const [passed, message] of passwordRules) {
    if (!passed) return message;
  }

  return null;
};

const signup = async (req, res) => {
  try {
    const fullName = (req.body.fullName || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const phoneNumber = (req.body.phoneNumber || '').trim();
    const password = req.body.password || '';
    const studentId = Number(req.body.studentId);

    const validationError = validateSignupPayload({
      fullName,
      email,
      studentId,
      phoneNumber,
      password,
    });

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const [emailExists, studentIdExists] = await Promise.all([
      User.exists({ email }),
      User.exists({ studentId }),
    ]);

    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    if (studentIdExists) {
      return res.status(409).json({
        success: false,
        message: 'Student ID already registered',
      });
    }

    const requireVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true';

    const user = await User.create({
      fullName,
      email,
      studentId,
      phoneNumber,
      password,
      isVerified: !requireVerification,
    });

    const accessToken = generateAccessToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Signup successful',
      accessToken,
      user: buildUserResponse(user),
    });
  } catch (error) {
    console.error('Signup error:', error.message);

    if (error.name === 'ValidationError') {
      const firstError = Object.values(error.errors)[0]?.message || 'Invalid signup data';
      return res.status(400).json({
        success: false,
        message: firstError,
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email or Student ID already exists',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error while signing up',
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const requireVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true';
    if (requireVerification && !user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Account is not verified yet',
      });
    }

    const accessToken = generateAccessToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      user: buildUserResponse(user),
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while logging in',
    });
  }
};

module.exports = {
  login,
  signup
};