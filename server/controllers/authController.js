const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendPasswordResetEmail, sendVerificationEmail } = require('../services/emailService');
const { cloudinary, hasCloudinaryConfig } = require('../middleware/upload');

const buildUserResponse = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  studentId: user.studentId,
  phoneNumber: user.phoneNumber,
  avatar: {
    url: user.avatar?.url || null,
    public_id: user.avatar?.public_id || null,
  },
  isVerified: user.isVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const generateAccessToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign({ sub: userId.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const generateToken = () => crypto.randomInt(100000, 1000000).toString();

const hashToken = async (token) => bcrypt.hash(token, 10);

const compareToken = async (token, hashedToken) => bcrypt.compare(token, hashedToken);

const buildPasswordValidationMessage = (password) => {
  if (!password) {
    return 'Password is required';
  }

  const passwordRules = [
    [password.length >= 8, 'Password must be at least 8 characters long'],
    [password.length <= 64, 'Password cannot exceed 64 characters'],
    [/[a-z]/.test(password), 'Password must include at least one lowercase letter'],
    [/[A-Z]/.test(password), 'Password must include at least one uppercase letter'],
    [/\d/.test(password), 'Password must include at least one number'],
    [/[!@#$%^&*()_\-+=[\]{};:'"\\|,.<>/?]/.test(password), 'Password must include at least one special character'],
    [/^\S+$/.test(password), 'Password must not contain spaces'],
    [!/(.)\1\1/.test(password), 'Password must not contain a character repeated 3+ times in a row'],
  ];

  for (const [passed, message] of passwordRules) {
    if (!passed) return message;
  }

  return null;
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

  return buildPasswordValidationMessage(password);
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

    const user = await User.create({
      fullName,
      email,
      studentId,
      phoneNumber,
      password,
      isVerified: false,
    });

    const verificationRawToken = generateToken();
    user.verificationToken = await hashToken(verificationRawToken);
    user.verificationTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    try {
      await sendVerificationEmail({
        to: user.email,
        fullName: user.fullName,
        token: verificationRawToken,
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Signup successful. Verification code sent to email (if configured).',
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

const verifyEmail = async (req, res) => {
  try {
    const token = (req.body.token || '').trim();

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification code is required',
      });
    }

    const users = await User.find({
      isVerified: false,
      verificationTokenExpiry: { $gt: new Date() },
    }).select('+verificationToken +verificationTokenExpiry');

    let matchedUser = null;

    for (const user of users) {
      if (user.verificationToken && (await compareToken(token, user.verificationToken))) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code',
      });
    }

    matchedUser.isVerified = true;
    matchedUser.verificationToken = null;
    matchedUser.verificationTokenExpiry = null;
    await matchedUser.save();

    const accessToken = generateAccessToken(matchedUser._id);

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      accessToken,
      user: buildUserResponse(matchedUser),
    });
  } catch (error) {
    console.error('Verify email error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while verifying email',
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
    const user = await User.findOne({ email: normalizedEmail }).select(
      '+password +verificationToken +verificationTokenExpiry',
    );

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

    if (!user.isVerified) {
      const verificationRawToken = generateToken();
      user.verificationToken = await hashToken(verificationRawToken);
      user.verificationTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      try {
        await sendVerificationEmail({
          to: user.email,
          fullName: user.fullName,
          token: verificationRawToken,
        });
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError.message);
      }

      return res.status(403).json({
        success: false,
        message: 'Account is not verified yet. A new verification code has been sent to your email (if possible).',
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

const forgotPassword = async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const user = await User.findOne({ email }).select('+resetPasswordToken +resetPasswordTokenExpiry');

    if (user) {
      const resetRawToken = generateToken();
      user.resetPasswordToken = await hashToken(resetRawToken);
      user.resetPasswordTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      try {
        await sendPasswordResetEmail({
          to: user.email,
          fullName: user.fullName,
          token: resetRawToken,
        });
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'If the email exists, a password reset code has been sent',
    });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while processing forgot password request',
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const token = (req.body.token || '').trim();
    const newPassword = req.body.newPassword || '';

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Code and new password are required',
      });
    }

    const passwordValidationError = buildPasswordValidationMessage(newPassword);
    if (passwordValidationError) {
      return res.status(400).json({
        success: false,
        message: passwordValidationError,
      });
    }

    const users = await User.find({
      resetPasswordTokenExpiry: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordTokenExpiry +password');

    let matchedUser = null;

    for (const user of users) {
      if (user.resetPasswordToken && (await compareToken(token, user.resetPasswordToken))) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset code',
      });
    }

    matchedUser.password = newPassword;
    matchedUser.resetPasswordToken = null;
    matchedUser.resetPasswordTokenExpiry = null;
    await matchedUser.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    console.error('Reset password error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while resetting password',
    });
  }
};

const resendVerification = async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const user = await User.findOne({ email, isVerified: false }).select(
      '+verificationToken +verificationTokenExpiry',
    );

    if (user) {
      const verificationRawToken = generateToken();
      user.verificationToken = await hashToken(verificationRawToken);
      user.verificationTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      try {
        await sendVerificationEmail({
          to: user.email,
          fullName: user.fullName,
          token: verificationRawToken,
        });
      } catch (emailError) {
        console.error('Failed to resend verification email:', emailError.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'If the account exists and is unverified, a verification code has been sent',
    });
  } catch (error) {
    console.error('Resend verification error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while resending verification token',
    });
  }
};

const hasOwn = (objectValue, key) => Object.prototype.hasOwnProperty.call(objectValue, key);
const isRemoveAvatarRequested = (removeAvatarValue) => {
  if (typeof removeAvatarValue === 'boolean') return removeAvatarValue;
  if (typeof removeAvatarValue !== 'string') return false;
  return removeAvatarValue.trim().toLowerCase() === 'true';
};

const deleteCloudinaryImage = async (publicId) => {
  if (!publicId || !hasCloudinaryConfig) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error.message);
  }
};

const updateMe = async (req, res) => {
  try {
    if (hasOwn(req.body, 'password') || hasOwn(req.body, 'newPassword') || hasOwn(req.body, 'currentPassword')) {
      return res.status(400).json({
        success: false,
        message: 'Password updates are not supported here. Use /api/auth/reset-password.',
      });
    }

    const updates = {};
    const existingAvatarPublicId = req.user.avatar?.public_id;
    const shouldRemoveAvatar = isRemoveAvatarRequested(req.body.removeAvatar);

    if (shouldRemoveAvatar && req.file) {
      return res.status(400).json({
        success: false,
        message: 'Choose either avatar upload or avatar removal, not both',
      });
    }

    if (hasOwn(req.body, 'fullName')) {
      const fullName = String(req.body.fullName || '').trim();

      if (!fullName) {
        return res.status(400).json({
          success: false,
          message: 'Full name cannot be empty',
        });
      }

      if (fullName.length < 2 || fullName.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Full name must be between 2 and 100 characters',
        });
      }

      updates.fullName = fullName;
    }

    if (hasOwn(req.body, 'phoneNumber')) {
      const phoneNumber = String(req.body.phoneNumber || '').trim();

      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          message: 'Phone number cannot be empty',
        });
      }

      updates.phoneNumber = phoneNumber;
    }

    if (hasOwn(req.body, 'studentId')) {
      const studentIdRaw = String(req.body.studentId || '').trim();
      const studentId = Number(studentIdRaw);

      if (!Number.isFinite(studentId)) {
        return res.status(400).json({
          success: false,
          message: 'Student ID must be a valid number',
        });
      }

      if (String(studentId).length !== 8) {
        return res.status(400).json({
          success: false,
          message: 'Enter a valid 8-digit student ID',
        });
      }

      if (studentId !== req.user.studentId) {
        const studentIdExists = await User.exists({
          studentId,
          _id: { $ne: req.user._id },
        });

        if (studentIdExists) {
          return res.status(409).json({
            success: false,
            message: 'Student ID already registered',
          });
        }
      }

      updates.studentId = studentId;
    }

    if (req.file) {
      const avatarUrl = req.file.path || req.file.secure_url || req.file.url;
      const avatarPublicId = req.file.filename || req.file.public_id;

      if (!avatarUrl || !avatarPublicId) {
        return res.status(400).json({
          success: false,
          message: 'Avatar upload failed',
        });
      }

      updates.avatar = {
        url: avatarUrl,
        public_id: avatarPublicId,
      };

      if (existingAvatarPublicId && existingAvatarPublicId !== avatarPublicId) {
        await deleteCloudinaryImage(existingAvatarPublicId);
      }
    }

    if (shouldRemoveAvatar) {
      updates.avatar = {
        url: null,
        public_id: null,
      };

      if (existingAvatarPublicId) {
        await deleteCloudinaryImage(existingAvatarPublicId);
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Provide at least one updatable field or an avatar image',
      });
    }

    req.user.set(updates);
    await req.user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: buildUserResponse(req.user),
    });
  } catch (error) {
    console.error('Update profile error:', error.message);

    if (error.name === 'ValidationError') {
      const firstError = Object.values(error.errors)[0]?.message || 'Invalid profile update data';
      return res.status(400).json({
        success: false,
        message: firstError,
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Student ID already registered',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
    });
  }
};

module.exports = {
  buildUserResponse,
  login,
  signup,
  verifyEmail,
  forgotPassword,
  resetPassword,
  resendVerification,
  updateMe,
};