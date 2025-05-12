// Middleware to check if user is an admin
module.exports = (req, res, next) => {
  // auth middleware should run before this middleware
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  
  // Check if user is admin
  if (!req.user.isAdmin) {
    return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required' });
  }
  
  next();
};