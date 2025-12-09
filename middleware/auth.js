const jwt = require('jsonwebtoken');

/**
 * Authentication middleware - verifies JWT token
 * Sets req.user with decoded token data
 */
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

/**
 * Optional authentication middleware - for guest cart support
 * Sets req.user if token is valid, otherwise req.user is null
 */
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // Invalid token, treat as guest
      req.user = null;
    }
  }
  
  next();
};

/**
 * Admin authorization middleware - must be used after auth middleware
 * Checks if user is admin
 */
const admin = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Requires admin' });
  }
  next();
};

module.exports = {
  auth,
  optionalAuth,
  admin
};



