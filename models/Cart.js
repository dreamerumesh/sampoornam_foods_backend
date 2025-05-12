// server/models/Cart.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  isSavedForLater: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const cartSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  total: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// // Pre-save hook to update cart total

cartSchema.pre('save', async function (next) {
    try {
      if (this.items.length > 0) {
        let total = 0;
  
        // ✅ Populate items.product directly from `this`
        await this.populate('items.product', 'price discountPrice');
  
        this.items.forEach(item => {
          if (item.product && !item.isSavedForLater) {
            const price = item.product.discountPrice || item.product.price;
            total += price * item.quantity;
            console.log("Check 2", price); // Debugging log
          }
        });
  
        this.total = total;
      } else {
        this.total = 0;
      }
  
      next();
    } catch (error) {
      console.error('Error calculating cart total:', error);
      next(error);
    }
  });

  

module.exports = mongoose.model('Cart', cartSchema);