const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/response');

/**
 * Runs after validation chains — returns 422 if any errors
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
      value: e.value,
    }));
    return errorResponse(res, 'Validation failed', 422, formatted);
  }
  next();
};

module.exports = { validate };
