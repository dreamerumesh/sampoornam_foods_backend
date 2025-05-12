const Address = require('../models/Address');

// @desc    Get all addresses for a user
// @route   GET /api/address
// @access  Private
exports.getAddresses = async (req, res, next) => {
  try {
    let userAddress = await Address.findOne({ user: req.user.id });
    
    if (!userAddress) {
      return res.status(200).json({
        success: true,
        message: 'Please add an address',
        data: [],
        defaultAddressIndex: 0
      });
    }
    
    // Sort addresses so default one comes first
    userAddress.addresses.sort((a, b) => (b.isDefault === true) - (a.isDefault === true));

    res.status(200).json({
      success: true,
      data: userAddress.addresses,
      defaultAddressIndex: userAddress.defaultAddress
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a new address
// @route   POST /api/address
// @access  Private
exports.addAddress = async (req, res, next) => {
  try {
    let userAddress = await Address.findOne({ user: req.user.id });
    
    if (!userAddress) {
      userAddress = new Address({
        user: req.user.id,
        addresses: [],
        defaultAddress: 0
      });
    }

    // Check if max addresses reached
    if (userAddress.addresses.length >= 3) {
      return res.status(400).json({
        success: false,
        message: 'Maximum of 3 addresses allowed. Please delete an address before adding a new one.'
      });
    }

    // Set all existing addresses' isDefault to false
    userAddress.addresses = userAddress.addresses.map(addr => ({
      ...addr.toObject(),
      isDefault: false
    }));

    // Create new address with isDefault = true
    const newAddress = {
      name: req.body.name,
      addressLine1: req.body.addressLine1,
      addressLine2: req.body.addressLine2 || '',
      city: req.body.city,
      state: req.body.state,
      pincode: req.body.pincode,
      country: req.body.country || 'India',
      phone: req.body.phone,
      isDefault: true
    };

    // Push new address and set it as default
    userAddress.addresses.push(newAddress);
    userAddress.defaultAddress = userAddress.addresses.length - 1;

    await userAddress.save();

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: userAddress.addresses,
      defaultAddressIndex: userAddress.defaultAddress
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an address
// @route   PUT /api/address/:index
// @access  Private
exports.updateAddress = async (req, res, next) => {
  try {
    const addressIndex = parseInt(req.params.index);
    
    let userAddress = await Address.findOne({ user: req.user.id });
    
    if (!userAddress || !userAddress.addresses.length) {
      return res.status(404).json({
        success: false,
        message: 'No addresses found for this user'
      });
    }
    
    // Check if address exists
    if (!userAddress.addresses[addressIndex]) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }
    
    // Update address fields that are provided
    const updatedAddress = {
      ...userAddress.addresses[addressIndex],
      name: req.body.name || userAddress.addresses[addressIndex].name,
      addressLine1: req.body.addressLine1 || userAddress.addresses[addressIndex].addressLine1,
      addressLine2: req.body.hasOwnProperty('addressLine2') ? req.body.addressLine2 : userAddress.addresses[addressIndex].addressLine2,
      city: req.body.city || userAddress.addresses[addressIndex].city,
      state: req.body.state || userAddress.addresses[addressIndex].state,
      pincode: req.body.pincode || userAddress.addresses[addressIndex].pincode,
      country: req.body.country || userAddress.addresses[addressIndex].country,
      phone: req.body.phone || userAddress.addresses[addressIndex].phone
    };
    
    userAddress.addresses[addressIndex] = updatedAddress;
    
    // Set as default unless specifically requested not to
    if (req.body.hasOwnProperty('setAsDefault') ? req.body.setAsDefault : true) {
      userAddress.defaultAddress = addressIndex;
    }
    
    await userAddress.save();
    
    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: userAddress.addresses,
      defaultAddressIndex: userAddress.defaultAddress
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an address
// @route   DELETE /api/address/:index
// @access  Private
exports.deleteAddress = async (req, res, next) => {
  try {
    const addressIndex = parseInt(req.params.index);
    
    let userAddress = await Address.findOne({ user: req.user.id });
    
    if (!userAddress || !userAddress.addresses.length) {
      return res.status(404).json({
        success: false,
        message: 'No addresses found for this user'
      });
    }
    
    // Check if address exists
    if (!userAddress.addresses[addressIndex]) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }
    
    // Check if this is the last address
    const isLastAddress = userAddress.addresses.length === 1;
    
    // Remove the address
    userAddress.addresses.splice(addressIndex, 1);
    
    if (isLastAddress) {
      // If it's the last address, just remove the entire document
      await Address.deleteOne({ user: req.user.id });
      
      return res.status(200).json({
        success: true,
        message: 'Address deleted successfully',
        data: [],
        defaultAddressIndex: 0
      });
    }
    
    // Adjust default address index if needed
    if (userAddress.defaultAddress === addressIndex) {
      // Set the last address as default if the deleted one was default
      userAddress.defaultAddress = userAddress.addresses.length - 1;
    } else if (userAddress.defaultAddress > addressIndex) {
      // Adjust index as the array has shifted
      userAddress.defaultAddress -= 1;
    }
    
    await userAddress.save();
    
    res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
      data: userAddress.addresses,
      defaultAddressIndex: userAddress.defaultAddress
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Set default address
// @route   PUT /api/address/default/:index
// @access  Private
exports.setDefaultAddress = async (req, res, next) => {
  try {
    const addressIndex = parseInt(req.params.index);
    
    let userAddress = await Address.findOne({ user: req.user.id });
    
    if (!userAddress || !userAddress.addresses.length) {
      return res.status(404).json({
        success: false,
        message: 'No addresses found for this user'
      });
    }
    
    // Check if address exists
    if (!userAddress.addresses[addressIndex]) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }
    
    // Set as default
    userAddress.defaultAddress = addressIndex;
    
    await userAddress.save();
    
    res.status(200).json({
      success: true,
      message: 'Default address updated successfully',
      data: userAddress.addresses,
      defaultAddressIndex: userAddress.defaultAddress
    });
  } catch (error) {
    next(error);
  }
};