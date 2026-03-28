const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
  return { accessToken, refreshToken };
};

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return errorResponse(res, 'Email already registered.', 409);
    }

    // Only allow admin creation via env-protected flow in production
    const assignedRole = process.env.NODE_ENV !== 'production' ? (role || 'user') : 'user';

    const user = await User.create({ name, email, password, role: assignedRole });
    const { accessToken, refreshToken } = generateTokens(user.id);

    await user.update({ refresh_token: refreshToken, last_login: new Date() });

    logger.info(`New user registered: ${email} [${assignedRole}]`);

    return successResponse(
      res,
      { user: user.toSafeJSON(), accessToken, refreshToken },
      'Registration successful',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user and return tokens
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    if (!user.is_active) {
      return errorResponse(res, 'Account has been deactivated. Contact support.', 403);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    await user.update({ refresh_token: refreshToken, last_login: new Date() });

    logger.info(`User logged in: ${email}`);

    return successResponse(res, { user: user.toSafeJSON(), accessToken, refreshToken }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return errorResponse(res, 'Refresh token required.', 400);

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    } catch {
      return errorResponse(res, 'Invalid or expired refresh token.', 401);
    }

    const user = await User.findByPk(decoded.id);
    if (!user || user.refresh_token !== refreshToken) {
      return errorResponse(res, 'Refresh token mismatch or user not found.', 401);
    }

    const { accessToken, refreshToken: newRefresh } = generateTokens(user.id);
    await user.update({ refresh_token: newRefresh });

    return successResponse(res, { accessToken, refreshToken: newRefresh }, 'Tokens refreshed');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Invalidate refresh token
 * @access  Private
 */
const logout = async (req, res, next) => {
  try {
    await req.user.update({ refresh_token: null });
    logger.info(`User logged out: ${req.user.email}`);
    return successResponse(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
const getMe = async (req, res) => {
  return successResponse(res, req.user.toSafeJSON(), 'Profile fetched');
};

/**
 * @route   PUT /api/v1/auth/change-password
 * @desc    Change current user's password
 * @access  Private
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const isMatch = await req.user.comparePassword(currentPassword);
    if (!isMatch) return errorResponse(res, 'Current password is incorrect.', 400);

    await req.user.update({ password: newPassword, refresh_token: null });
    return successResponse(res, null, 'Password updated. Please log in again.');
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, refresh, logout, getMe, changePassword };
