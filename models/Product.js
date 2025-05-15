const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  images: [{
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    isMain: {
      type: Boolean,
      default: false
    }
  }],
  orderByDate: {  
    type: Date  // ✅ Removed "required" constraint  
  },
  deliveryDate: {
    type: Date
  },
  category: {
    type: String,
    required: [true, 'Product category is required']
  },
  unit: {
    type: String,
    enum: ['kg', 'g', 'pieces', 'packs','inch','L','ml'], 
    default: 'kg'  // ✅ Default value added for smooth transition
  },
  size: {
    type: Number,
    default: 1  // ✅ Default value added for existing products
  },
  isActive: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  stock: {
    type: Number,
    default: 100
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
