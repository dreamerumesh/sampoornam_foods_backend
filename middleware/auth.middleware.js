const jwt = require('jsonwebtoken');
const config = require('../config/default');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token, authorization denied' });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, config.JWT_SECRET);
      
      // Find user by id
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }
      
      // Check if user is verified
      if (!user.isVerified) {
        return res.status(401).json({ success: false, message: 'Account not verified' });
      }
      
      //console.log(user);
      // Add user to request object
      req.user = {
        id: user._id,
        email: user.email,
        role: decoded.role,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified
      };
      
      next();
    } catch (err) {
      res.status(401).json({ success: false, message: 'Token is not valid' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};