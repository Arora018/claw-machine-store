const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    // First authenticate the user
    await auth(req, res, (err) => {
      if (err) {
        return; // auth already sent response
      }
      
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      next();
    });
  } catch (error) {
    if (!res.headersSent) {
      res.status(403).json({ message: 'Access denied' });
    }
  }
};

const managerAuth = async (req, res, next) => {
  try {
    // First authenticate the user
    await auth(req, res, (err) => {
      if (err) {
        return; // auth already sent response
      }
      
      // Check if user is manager or admin
      if (!['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Manager access required' });
      }
      
      next();
    });
  } catch (error) {
    if (!res.headersSent) {
      res.status(403).json({ message: 'Access denied' });
    }
  }
};

module.exports = { auth, adminAuth, managerAuth };
