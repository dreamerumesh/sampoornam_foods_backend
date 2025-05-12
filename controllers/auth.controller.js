const User = require('../models/User');
const generateOTP = require('../utils/generateOTP');
const sendEmail = require('../utils/emailService');
const jwt = require('jsonwebtoken');
const config = require('../config/default');
const bcrypt = require('bcryptjs');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists Please login' });
    }

    // Generate OTP for verification
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + config.OTP_EXPIRE * 60 * 1000);

    // Create user - let the User model handle password hashing
    user = new User({
      name,
      email,
      password, // Will be hashed by the User model pre-save hook
      phone,
      otp: {
        code: otp,
        expiresAt: otpExpiry
      },
      isVerified: false
    });

    

    // Send OTP to user's email
    const emailContent = `
      <h1>Welcome to Sampoornam Foods</h1>
      <p>Your OTP for account verification is: <strong>${otp}</strong></p>
      <p>This OTP will expire in ${config.OTP_EXPIRE} minutes.</p>
    `;

    await sendEmail({
      to: email,
      subject: 'Account Verification OTP - Sampoornam Foods',
      html: emailContent
    });

    await user.save();
    
    res.status(201).json({
      success: true,
      message: 'User registered! Please verify your account using the OTP sent to your email.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify user with OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify OTP
    if (!user.otp || !user.otp.code || user.otp.code !== otp || new Date() > user.otp.expiresAt) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Update user verification status
    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    // Create and send token
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    //console.log(email,
      //password);
    
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'No user found' });
    }

    // Check if password matches using the method from User model
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if user is verified
    if (!user.isVerified) {
      // Generate new OTP for verification
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + config.OTP_EXPIRE * 60 * 1000);
      
      user.otp = {
        code: otp,
        expiresAt: otpExpiry
      };
      await user.save();
      
      // Send OTP to user's email
      const emailContent = `
        <h1>Account Verification Required</h1>
        <p>Your OTP for account verification is: <strong>${otp}</strong></p>
        <p>This OTP will expire in ${config.OTP_EXPIRE} minutes.</p>
      `;
      
      await sendEmail({
        to: email,
        subject: 'Account Verification OTP - Sampoornam Foods',
        html: emailContent
      });
      
      return res.status(401).json({
        success: false,
        message: 'Account not verified. A new OTP has been sent to your email.'
      });
    }
    //res.status(201).json({ success: true, message: 'Login successful' });
    
    // Create and send token
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + config.OTP_EXPIRE * 60 * 1000);

    user.otp = {
      code: otp,
      expiresAt: otpExpiry
    };
    await user.save();

    // Send OTP to user's email
    const emailContent = `
      <h1>Account Verification</h1>
      <p>Your new OTP for account verification is: <strong>${otp}</strong></p>
      <p>This OTP will expire in ${config.OTP_EXPIRE} minutes.</p>
    `;

    await sendEmail({
      to: email,
      subject: 'New Verification OTP - Sampoornam Foods',
      html: emailContent
    });

    res.status(200).json({
      success: true,
      message: 'New OTP sent to your email.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate OTP for password reset
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + config.OTP_EXPIRE * 60 * 1000);

    user.otp = {
      code: otp,
      expiresAt: otpExpiry,
      isPasswordReset: true // Flag to indicate this is for password reset
    };
    await user.save();

    // Send OTP to user's email
    const emailContent = `
      <h1>Password Reset Request</h1>
      <p>Your OTP for password reset is: <strong>${otp}</strong></p>
      <p>This OTP will expire in ${config.OTP_EXPIRE} minutes.</p>
    `;

    await sendEmail({
      to: email,
      subject: 'Password Reset OTP - Sampoornam Foods',
      html: emailContent
    });

    res.status(200).json({
      success: true,
      message: 'Password reset OTP sent to your email.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify OTP
    if (!user.otp || !user.otp.code || user.otp.code !== otp || new Date() > user.otp.expiresAt) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Update password (will be hashed by the User model pre-save hook)
    user.password = newPassword;
    user.otp = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Validate JWT token
// @route   GET /api/auth/validate-token
// @access  Private
exports.validateToken = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    // In a stateless JWT setup, logout happens client-side by removing the token
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to create and send token response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = jwt.sign(
    { id: user._id, role: user.isAdmin ? 'admin' : 'user' },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRE }
  );

  // Create user object without sensitive fields
  const userObj = {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    isAdmin: user.isAdmin,
    isVerified: user.isVerified
  };

  res.status(statusCode).json({
    success: true,
    token,
    user: userObj
  });
};