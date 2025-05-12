// server/controllers/cart.controller.js
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id })
      .populate({
        path: 'items.product',
        select: 'name price discountPrice imageUrl stock size unit'
      });

      if (!cart || cart.items.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'Cart is empty',
          data: {
            items: [],
            savedForLater: [],
            total: 0
          }
        });
      }

    // Separate regular cart items and saved for later items
    const cartItems = cart.items.filter(item => !item.isSavedForLater);
    const savedForLater = cart.items.filter(item => item.isSavedForLater);

    res.status(200).json({
      success: true,
      data: {
        _id: cart._id,
        items: cartItems,
        savedForLater,
        total: cart.total
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;


    // Validate product ID
      if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }


   // Find or create cart
    let cart = await Cart.findOne({ user: req.user.id });
    
    if (!cart) {
      cart = new Cart({
        user: req.user.id,
        items: [],
        total: 0
      });
    }

    
    // Check if product already in cart
    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );
    //console.log("itemIndex",itemIndex);
    if (itemIndex > -1) {
      // Product exists in cart, update quantity
      cart.items[itemIndex].quantity += quantity;
    } else {
      // Product not in cart, add new item
      cart.items.push({
        product: productId,
        quantity,
        isSavedForLater: false
      });
    }
    //console.log("cart",cart);
    await cart.save();

    // Fetch the updated cart with populated product details
    const updatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name price discountPrice imageUrl stock size unit'
    });

    // Separate regular cart items and saved for later items
    const cartItems = updatedCart.items.filter(item => !item.isSavedForLater);
    const savedForLater = updatedCart.items.filter(item => item.isSavedForLater);
    

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      data: {
        _id: updatedCart._id,
        items: cartItems,
        savedForLater,
        total: updatedCart.total
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:itemId
// @access  Private
exports.updateCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.body;
    const { quantity } = req.body;

    // Validate quantity
    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    // Find cart
    const cart = await Cart.findOne({ user: req.user.id });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    // Find item in cart
    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    // Check product stock
    const product = await Product.findById(cart.items[itemIndex].product);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // if (product.stock < quantity) {
    //   return res.status(400).json({
    //     success: false,
    //     message: `Only ${product.stock} items available in stock`
    //   });
    // }

    // Update quantity
    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    // Fetch the updated cart with populated product details
    const updatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name price discountPrice imageUrl stock size unit'
    });

    // Separate regular cart items and saved for later items
    const cartItems = updatedCart.items.filter(item => !item.isSavedForLater);
    const savedForLater = updatedCart.items.filter(item => item.isSavedForLater);

    res.status(200).json({
      success: true,
      message: 'Cart updated',
      data: {
        _id: updatedCart._id,
        items: cartItems,
        savedForLater,
        total: updatedCart.total
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
exports.removeCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    // Find cart
    const cart = await Cart.findOne({ user: req.user.id });
    //console.log(cart);
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Find item index
    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    // Remove item
    cart.items.splice(itemIndex, 1);
    await cart.save();

    // Fetch the updated cart with populated product details
    const updatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name price discountPrice imageUrl stock size unit'
    });

    // Separate regular cart items and saved for later items
    const cartItems = updatedCart.items.filter(item => !item.isSavedForLater);
    const savedForLater = updatedCart.items.filter(item => item.isSavedForLater);

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: {
        _id: updatedCart._id,
        items: cartItems,
        savedForLater,
        total: updatedCart.total
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save item for later
// @route   PUT /api/cart/:itemId/save-for-later
// @access  Private
exports.saveForLater = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    

    // Find cart
    const cart = await Cart.findOne({ user: req.user.id });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Find item index
    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }
    if (cart.items[itemIndex].isSavedForLater) {
      return res.status(400).json({
        success: false,
        message: 'Item is already in cart'
      });
    }

    // Toggle saved for later status
    cart.items[itemIndex].isSavedForLater = !cart.items[itemIndex].isSavedForLater;
    //console.log("Save for later",cart);
    await cart.save();

    // Fetch the updated cart with populated product details
    const updatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name price discountPrice imageUrl stock size unit'
    });

    // Separate regular cart items and saved for later items
    const cartItems = updatedCart.items.filter(item => !item.isSavedForLater);
    const savedForLater = updatedCart.items.filter(item => item.isSavedForLater);

    res.status(200).json({
      success: true,
      message: cart.items[itemIndex].isSavedForLater 
        ? 'Item saved for later' 
        : 'Item moved to cart',
      data: {
        _id: updatedCart._id,
        items: cartItems,
        savedForLater,
        total: updatedCart.total
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    move to cart
// @route   PUT /api/cart/:itemId/move-to-cart
// @access  Private

exports.moveToCart = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    //console.log(itemId)
    
    // Find cart
    const cart = await Cart.findOne({ user: req.user.id });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    // Find item index
    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in saved for later'
      });
    }
    
    // Check if item is actually in saved for later
    if (!cart.items[itemIndex].isSavedForLater) {
      return res.status(400).json({
        success: false,
        message: 'Item is already in cart'
      });
    }
    
    // Move item from saved for later to cart
    cart.items[itemIndex].isSavedForLater = false;
    //console.log("Move to cart",cart);
    await cart.save();
    
    // Fetch the updated cart with populated product details
    const updatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name price discountPrice imageUrl stock size unit'
    });
    // Separate regular cart items and saved for later items
    const cartItems = updatedCart.items.filter(item => !item.isSavedForLater);
    const savedForLater = updatedCart.items.filter(item => item.isSavedForLater);
    
    res.status(200).json({
      success: true,
      message: 'Item moved to cart',
      data: {
        _id: updatedCart._id,
        items: cartItems,
        savedForLater,
        total: updatedCart.total
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = async (req, res, next) => {
  try {
    // Find cart
    const cart = await Cart.findOne({ user: req.user.id });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Clear cart items (but keep saved for later items)
    cart.items = cart.items.filter(item => item.isSavedForLater);
    await cart.save();

    // Fetch the updated cart with populated product details
    const updatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name price discountPrice imageUrl stock size unit'
    });

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      data: {
        _id: updatedCart._id,
        items: [],
        savedForLater: updatedCart.items,
        total: updatedCart.total
      }
    });
  } catch (error) {
    next(error);
  }
};