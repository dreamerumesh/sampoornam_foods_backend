// server/models/History.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const embeddedAddressSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  addressLine1: {
    type: String,
    required: [true, 'Address line 1 is required']
  },
  addressLine2: {
    type: String,
    default: ''
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
    required: [true, 'Pincode is required']
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    default: 'India'
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  }
}, { _id: false });


const historyItemSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  }
});

const historySchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [historyItemSchema],
  total: {
    type: Number,
    required: true
  },
  address: {
    type: embeddedAddressSchema,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['ordered', 'cancelled', 'delivered'],
    default: 'ordered'
  },
  orderDate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('History', historySchema);