const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const addressController = require('../controllers/address.controller');
const auth = require('../middleware/auth.middleware');

/**
 * @route   GET /api/address
 * @desc    Get all addresses for a user
 * @access  Private
 */
router.get('/', auth, addressController.getAddresses);

/**
 * @route   POST /api/address
 * @desc    Add a new address
 * @access  Private
 */
router.post(
  '/',
  [
    auth,
    check('name', 'Name is required').not().isEmpty(),
    check('addressLine1', 'Address line 1 is required').not().isEmpty(),
    check('city', 'City is required').not().isEmpty(),
    check('state', 'State is required').not().isEmpty(),
    check('pincode', 'pincode is required').not().isEmpty(),
    check('phone', 'Phone number is required').not().isEmpty()
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    addressController.addAddress(req, res, next);
  }
);

/**
 * @route   PUT /api/address/:index
 * @desc    Update an address
 * @access  Private
 */
router.put(
  '/:index',
  [
    auth,
    check('name', 'Name is required').optional(),
    check('addressLine1', 'Address line 1 is required').optional(),
    check('city', 'City is required').optional(),
    check('state', 'State is required').optional(),
    check('pincode', 'pin code is required').optional(),
    check('phone', 'Phone number is required').optional()
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    addressController.updateAddress(req, res, next);
  }
);

/**
 * @route   DELETE /api/address/:index
 * @desc    Delete an address
 * @access  Private
 */
router.delete('/:index', auth, addressController.deleteAddress);

/**
 * @route   PUT /api/address/default/:index
 * @desc    Set default address
 * @access  Private
 */
router.put('/default/:index', auth, addressController.setDefaultAddress);

module.exports = router;