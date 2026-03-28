const { body, query, param } = require('express-validator');

const createTaskValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 1, max: 200 }).withMessage('Title must be 1–200 characters')
    .escape(),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description max 2000 characters'),

  body('status')
    .optional()
    .isIn(['todo', 'in_progress', 'done', 'archived'])
    .withMessage('Status must be: todo, in_progress, done, or archived'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Priority must be: low, medium, high, or critical'),

  body('due_date')
    .optional()
    .isDate().withMessage('due_date must be a valid date (YYYY-MM-DD)'),

  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array')
    .custom((tags) => tags.every((t) => typeof t === 'string' && t.length <= 30))
    .withMessage('Each tag must be a string max 30 chars'),
];

const updateTaskValidator = [
  param('id').isUUID().withMessage('Invalid task ID'),

  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('Title cannot be empty')
    .isLength({ min: 1, max: 200 })
    .escape(),

  body('description').optional().trim().isLength({ max: 2000 }),

  body('status')
    .optional()
    .isIn(['todo', 'in_progress', 'done', 'archived']),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical']),

  body('due_date').optional({ nullable: true }).isDate(),

  body('tags').optional().isArray(),
];

const listTasksValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1–100'),
  query('status').optional().isIn(['todo', 'in_progress', 'done', 'archived']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  query('sortBy').optional().isIn(['created_at', 'updated_at', 'due_date', 'priority', 'title']),
  query('order').optional().isIn(['ASC', 'DESC', 'asc', 'desc']),
];

module.exports = { createTaskValidator, updateTaskValidator, listTasksValidator };
