// server/models/History.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
    type: [String],
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