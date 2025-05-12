// server/routes/cart.routes.js
const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const cartController = require('../controllers/cart.controller');
const auth = require('../middleware/auth.middleware');

// Middleware to validate user is authenticated and verified
const validateAuthAndVerification = (req, res, next) => {
  // Auth middleware already adds user to request
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }
  //console.log(req.user);
  // Check if user is verified
  if (!req.user.isVerified) {
    return res.status(403).json({ 
      success: false, 
      message: 'Account not verified. Please verify your account to use cart features.' 
    });
  }
  
  next();
};

/**
 * @route   GET /api/cart
 * @desc    Get user's cart
 * @access  Private
 */
router.get(
  '/',
  [auth, validateAuthAndVerification],
  cartController.getCart
);

/**
 * @route   POST /api/cart
 * @desc    Add item to cart
 * @access  Private
 */
router.post(
  '/',
  [
    auth,
    validateAuthAndVerification,
    check('productId', 'Product ID is required').not().isEmpty(),
    check('quantity', 'Quantity must be a positive number').optional().isInt({ min: 1 })
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    await cartController.addToCart(req, res, next);
  }
);

/**
 * @route   PUT /api/cart/:itemId
 * @desc    Update cart item quantity
 * @access  Private
 */
router.put(
  '/',
  [
    auth,
    validateAuthAndVerification,
    check('quantity', 'Quantity must be a positive number').isInt({ min: 1 })
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    await cartController.updateCartItem(req, res, next);
  }
);

/**
 * @route   DELETE /api/cart/:itemId
 * @desc    Remove item from cart
 * @access  Private
 */
router.delete(
  '/:itemId',
  [auth, validateAuthAndVerification],
  cartController.removeCartItem
);

/**
 * @route   PUT /api/cart/:itemId/save-for-later
 * @desc    Toggle save item for later
 * @access  Private
 */
router.put(
  '/:itemId/save-for-later',
  [auth, validateAuthAndVerification],
  cartController.saveForLater
);

router.put('/:itemId/move-to-cart',[auth, validateAuthAndVerification], cartController.moveToCart);

/**
 * @route   DELETE /api/cart
 * @desc    Clear cart
 * @access  Private
 */
router.delete(
  '/',
  [auth, validateAuthAndVerification],
  cartController.clearCart
);

module.exports = router;