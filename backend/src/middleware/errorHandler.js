const logger = require('../utils/logger');

/**
 * Central error handler — catches all errors passed via next(err)
 */
const errorHandler = (err, req, res, next) => {
  logger.error(`${req.method} ${req.originalUrl} — ${err.message}`, {
    stack: err.stack,
    body: req.body,
    user: req.user?.id,
  });

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const messages = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: messages,
      timestamp: new Date().toISOString(),
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token.', timestamp: new Date().toISOString() });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired.', timestamp: new Date().toISOString() });
  }

  // Syntax / JSON parse errors
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON payload.', timestamp: new Date().toISOString() });
  }

  // Default
  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal server error'
    : err.message || 'Internal server error';

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
};

/**
 * 404 handler for unmatched routes
 */
const notFound = (req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
    timestamp: new Date().toISOString(),
  });
};

module.exports = { errorHandler, notFound };
