// server/controllers/history.controller.js
const History = require('../models/History');
const Cart = require('../models/Cart');
const User = require('../models/User');
const Address = require('../models/Address');

const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

// @desc    Place order and create history entry
// @route   POST /api/history/place-order
// @access  Private
exports.placeOrder = async (req, res, next) => {
  try {
    const {
      name,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      country,
      phone
    } = req.body;
    const userId = req.user.id;

    console.log("name", name);
    // Get user cart
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Your cart is empty' 
      });
    }

        

    // Get user details for phone number
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    

    // Create history items from cart items
    const historyItems = cart.items
      .filter(item => !item.isSavedForLater)
      .map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.discountPrice || item.product.price
      }));

    if (historyItems.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No items to order' 
      });
    }

    // Calculate total (should match cart total)
    const total = historyItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create history record
    const history = new History({
      user: userId,
      items: historyItems,
      total,
      address: {
        name,
        addressLine1,
        addressLine2,
        city,
        state,
        pincode,
        country,
        phone
      },
      phone: user.phone,
      status: 'ordered'
    });

    await history.save();

    // Clear cart after successful order
    cart.items = cart.items.filter(item => item.isSavedForLater);
    cart.total = 0;
    await cart.save();

    // Send simple response
    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      data: history
    });
  } catch (error) {
    console.error('Error placing order:', error);
    next(error);
  }
};

// @desc    Cancel order
// @route   PUT /api/history/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res, next) => {
  try {
    const historyId = req.params.id;
    //const userId = req.user.id;

    // Find the order
    const order = await History.findOne({ 
      _id: historyId, 
      //user: userId 
    });

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Check if order is already cancelled
    if (order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This order is already cancelled'
      });
    }

    // Check if order is within 30 minutes
    const orderTime = new Date(order.orderDate).getTime();
    const currentTime = new Date().getTime();
    const timeDiff = (currentTime - orderTime) / (1000 * 60); // time difference in minutes

    if (timeDiff > 30) {
      return res.status(400).json({
        success: false,
        message: 'Orders can only be cancelled within 30 minutes of placement'
      });
    }

    // Update order status
    order.status = 'cancelled';
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    next(error);
  }
};

// @desc    Cancel order by Admin
// @route   PUT /api/admin/history/:id/cancel
// @access  Admin
exports.cancelOrderByAdmin = async (req, res, next) => {
  try {
    const historyId = req.params.id;

    // Find the order
    const order = await History.findById(historyId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if order is already cancelled
    if (order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This order is already cancelled',
      });
    }

    // Update order status
    order.status = 'cancelled';
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully by admin',
      data: order,
    });
  } catch (error) {
    console.error('Admin cancel error:', error);
    next(error);
  }
};


// @desc    Mark order as delivered by Admin
// @route   PUT /api/admin/history/:id/deliver
// @access  Admin
exports.markOrderAsDelivered = async (req, res, next) => {
  try {
    const historyId = req.params.id;

    // Find the order
    const order = await History.findById(historyId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if already delivered
    if (order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This order has been cancelled and cannot be marked as delivered',
      });
    }

    // Check if already delivered
    if (order.status === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'This order has already been marked as delivered',
      });
    }

    // Update order status
    order.status = 'delivered';
    order.deliveredAt = new Date(); // optional: track delivery timestamp
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order marked as delivered',
      data: order,
    });
  } catch (error) {
    console.error('Error marking order as delivered:', error);
    next(error);
  }
};


// @desc    Get user order history with cancellation eligibility
// @route   GET /api/history
// @access  Private
exports.getOrderHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const history = await History.find({ user: userId }).sort({ orderDate: -1 });
    //console.log("history",history);
    const enhancedHistory = await Promise.all(
      history.map(async (order) => {
        let canCancel = false;
        const status = order.status;
        const orderTime = new Date(order.orderDate).getTime();
        const currentTime = new Date().getTime();
        const timeDiff = (currentTime - orderTime) / (1000 * 60); // in minutes

        if (status !== 'cancelled' && status !== 'delivered' && timeDiff <= 30) {
          canCancel = true;
        }

        // Fetch address using order.addressId (adjust path if needed)

        // let fullAddress = null;
        // let addressId = new ObjectId(order.address[0]);

         //console.log(addressId);

        // try {
        //   fullAddress = await Address.findOne(
        //     { user: userId, "addresses._id": addressId },
        //     { "addresses.$": 1 }
        //   );
            
        //  fullAddress = fullAddress.addresses[0];
        // } catch (err) {
        //   console.error(`Failed to fetch address for order ${order._id}:`, err);
        // }

        return {
          ...order._doc,         // Include all order fields
          canCancel,             // Add cancel logic
          //address: fullAddress   // Replace or add address field
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enhancedHistory.length,
      data: enhancedHistory
    });
  } catch (error) {
    console.error('Error fetching order history:', error);
    next(error);
  }
};  


// @route   GET /api/admin/orders
// @desc    Get all user orders (Admin only)
// @access  Private/Admin
 

exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await History.find()
      .sort({ createdAt: -1 })
      .populate("user", "name email");

    const enhancedOrders = await Promise.all(
      orders.map(async (order) => {
        const userId = order.user._id;
        const addressId = order.address[0];

        // let fullAddress = null;

        // if (mongoose.Types.ObjectId.isValid(userId) && mongoose.Types.ObjectId.isValid(addressId)) {
        //   const addressDoc = await Address.findOne(
        //     { user: userId, "addresses._id": addressId },
        //     { "addresses.$": 1 }
        //   );

        //   if (addressDoc && addressDoc.addresses.length > 0) {
        //     fullAddress = addressDoc.addresses[0];
        //   }
        // }

        return {
          ...order._doc
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enhancedOrders.length,
      data: enhancedOrders
    });
  } catch (error) {
    console.error("Error fetching all orders:", error);
    next(error);
  }
};

