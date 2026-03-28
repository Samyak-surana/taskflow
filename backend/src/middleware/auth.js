const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Verify JWT access token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Access denied. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return errorResponse(res, 'Token expired. Please log in again.', 401);
      }
      return errorResponse(res, 'Invalid token.', 401);
    }

    const user = await User.findByPk(decoded.id);
    if (!user || !user.is_active) {
      return errorResponse(res, 'User not found or account deactivated.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return errorResponse(res, 'Authentication failed.', 500);
  }
};

/**
 * Role-based access control middleware factory
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required.', 401);
    }
    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Access denied. Required role(s): ${roles.join(', ')}.`,
        403
      );
    }
    next();
  };
};

/**
 * Optional auth - attaches user if token present, continues either way
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);
        if (user && user.is_active) req.user = user;
      } catch (_) {
        // Token invalid — continue without user
      }
    }
    next();
  } catch (error) {
    next();
  }
};

module.exports = { authenticate, authorize, optionalAuth };
