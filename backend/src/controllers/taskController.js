const { Op } = require('sequelize');
const { Task, User } = require('../models');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * @route   GET /api/v1/tasks
 * @desc    Get paginated list of tasks (own tasks for user, all for admin)
 * @access  Private
 */
const getTasks = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      sortBy = 'created_at',
      order = 'DESC',
      search,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    // Users only see their own tasks; admins see all
    if (req.user.role !== 'admin') {
      where.user_id = req.user.id;
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Task.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [[sortBy, order.toUpperCase()]],
      include: req.user.role === 'admin'
        ? [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
        : [],
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
 * @route   GET /api/v1/tasks/:id
 * @desc    Get a single task by ID
 * @access  Private
 */
const getTask = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.user.role !== 'admin') where.user_id = req.user.id;

    const task = await Task.findOne({ where });
    if (!task) return errorResponse(res, 'Task not found.', 404);

    return successResponse(res, task, 'Task fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/tasks
 * @desc    Create a new task
 * @access  Private
 */
const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, due_date, tags } = req.body;

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      due_date,
      tags,
      user_id: req.user.id,
    });

    logger.info(`Task created: "${title}" by user ${req.user.id}`);
    return successResponse(res, task, 'Task created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/v1/tasks/:id
 * @desc    Update a task
 * @access  Private
 */
const updateTask = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.user.role !== 'admin') where.user_id = req.user.id;

    const task = await Task.findOne({ where });
    if (!task) return errorResponse(res, 'Task not found.', 404);

    const { title, description, status, priority, due_date, tags } = req.body;
    const updated = await task.update({ title, description, status, priority, due_date, tags });

    return successResponse(res, updated, 'Task updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/v1/tasks/:id
 * @desc    Delete a task
 * @access  Private
 */
const deleteTask = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.user.role !== 'admin') where.user_id = req.user.id;

    const task = await Task.findOne({ where });
    if (!task) return errorResponse(res, 'Task not found.', 404);

    await task.destroy();
    logger.info(`Task deleted: ${req.params.id} by user ${req.user.id}`);
    return successResponse(res, null, 'Task deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/tasks/stats
 * @desc    Get task statistics for current user (or all users for admin)
 * @access  Private
 */
const getTaskStats = async (req, res, next) => {
  try {
    const where = req.user.role !== 'admin' ? { user_id: req.user.id } : {};

    const [total, todo, inProgress, done, archived] = await Promise.all([
      Task.count({ where }),
      Task.count({ where: { ...where, status: 'todo' } }),
      Task.count({ where: { ...where, status: 'in_progress' } }),
      Task.count({ where: { ...where, status: 'done' } }),
      Task.count({ where: { ...where, status: 'archived' } }),
    ]);

    return successResponse(res, { total, todo, inProgress, done, archived }, 'Task stats fetched');
  } catch (error) {
    next(error);
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask, getTaskStats };
