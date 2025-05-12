const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  addresses: [
    {
      name: {
        type: String,
        required: [true, 'Name is required']
      },
      addressLine1: {
        type: String,
        required: [true, 'Address line 1 is required']
      },
      addressLine2: {
        type: String
      },
      city: {
        type: String,
        required: [true, 'City is required']
      },
      state: {
        type: String,
        required: [true, 'State is required']
      },
      pincode: {
        type: String,
        required: [true, 'pincode is required']
      },
      country: {
        type: String,
        required: [true, 'Country is required'],
        default: 'India'
      },
      phone: {
        type: String,
        required: [true, 'Phone number is required']
      },
      isDefault: {
        type: Boolean,
        default: false
      }
    }
  ],
  defaultAddress: {
    type: Number,
    default: 0 // Index of the default address in the addresses array
  }
}, { timestamps: true });

// Pre-save middleware to ensure only 3 addresses can be added
addressSchema.pre('save', function(next) {
  if (this.addresses.length > 3) {
    const error = new Error('Maximum of 3 addresses allowed');
    return next(error);
  }
  
  // Ensure only one address is set as default
  if (this.isModified('addresses') || this.isModified('defaultAddress')) {
    // Set all addresses to non-default
    this.addresses.forEach((address, index) => {
      address.isDefault = (index === this.defaultAddress);
    });
  }
  
  next();
});

module.exports = mongoose.model('Address', addressSchema);









