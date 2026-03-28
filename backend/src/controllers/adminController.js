const { User, Task } = require('../models');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

/**
 * @route   GET /api/v1/admin/users
 * @desc    List all users (admin only)
 * @access  Admin
 */
const listUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await User.findAndCountAll({
      attributes: { exclude: ['password', 'refresh_token'] },
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
    });

    return paginatedResponse(res, rows, {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / parseInt(limit)),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/v1/admin/users/:id/toggle-active
 * @desc    Activate or deactivate a user
 * @access  Admin
 */
const toggleUserActive = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return errorResponse(res, 'User not found.', 404);
    if (user.id === req.user.id) return errorResponse(res, 'Cannot deactivate yourself.', 400);

    await user.update({ is_active: !user.is_active });
    return successResponse(res, user.toSafeJSON(), `User ${user.is_active ? 'activated' : 'deactivated'}`);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/v1/admin/users/:id/role
 * @desc    Update user role
 * @access  Admin
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) return errorResponse(res, 'Invalid role.', 400);

    const user = await User.findByPk(req.params.id);
    if (!user) return errorResponse(res, 'User not found.', 404);

    await user.update({ role });
    return successResponse(res, user.toSafeJSON(), 'User role updated');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/admin/stats
 * @desc    Platform-wide stats
 * @access  Admin
 */
const getPlatformStats = async (req, res, next) => {
  try {
    const [totalUsers, adminUsers, totalTasks, activeTasks] = await Promise.all([
      User.count(),
      User.count({ where: { role: 'admin' } }),
      Task.count(),
      Task.count({ where: { status: 'in_progress' } }),
    ]);

    return successResponse(res, {
      users: { total: totalUsers, admins: adminUsers, regular: totalUsers - adminUsers },
      tasks: { total: totalTasks, active: activeTasks },
    }, 'Platform stats fetched');
  } catch (error) {
    next(error);
  }
};

module.exports = { listUsers, toggleUserActive, updateUserRole, getPlatformStats };
