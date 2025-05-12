const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const authController = require('../controllers/auth.controller');
const auth = require('../middleware/auth.middleware');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 8 }),
    check('phone', 'Phone number is required').not().isEmpty()
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    await authController.register(req, res, next);
  }
);




/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */


router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    await authController.login(req, res, next);
  }
);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP for first-time login
 * @access  Public
 */
router.post(
  '/verify-otp',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('otp', 'OTP is required').not().isEmpty()
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    await authController.verifyOTP(req, res, next);
  }
);

// /**
//  * @route   POST /api/auth/resend-otp
//  * @desc    Resend OTP for verification
//  * @access  Public
//  */
router.post(
  '/resend-otp',
  [
    check('email', 'Please include a valid email').isEmail()
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    await authController.resendOTP(req, res, next);
  }
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  '/forgot-password',
  [
    check('email', 'Please include a valid email').isEmail()
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    await authController.forgotPassword(req, res, next);
  }
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with OTP
 * @access  Public
 */
router.post(
  '/reset-password',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('otp', 'OTP is required').not().isEmpty(),
    check('newPassword', 'Password must be at least 6 characters').isLength({ min: 6 })
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    await authController.resetPassword(req, res, next);
  }
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', auth, async (req, res, next) => {
  await authController.getMe(req, res, next);
});

/**
 * @route   GET /api/auth/validate-token
 * @desc    Validate JWT token
 * @access  Private
 */
router.get('/validate-token', auth, async (req, res, next) => {
  await authController.validateToken(req, res, next);
});

// /**
//  * @route   POST /api/auth/logout
//  * @desc    Logout user (client-side only)
//  * @access  Private
//  */
router.post('/logout', auth, async (req, res, next) => {
  await authController.logout(req, res, next);
});

module.exports = router;