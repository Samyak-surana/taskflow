const express = require('express');
const router = express.Router();

const { getTasks, getTask, createTask, updateTask, deleteTask, getTaskStats } = require('../controllers/taskController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createTaskValidator, updateTaskValidator, listTasksValidator } = require('../validators/taskValidator');

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management (CRUD)
 */

// All task routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /tasks/stats:
 *   get:
 *     summary: Get task stats for current user
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Task statistics
 */
router.get('/stats', getTaskStats);

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: List tasks (with filtering and pagination)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [todo, in_progress, done, archived] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [low, medium, high, critical] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: created_at }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [ASC, DESC], default: DESC }
 *     responses:
 *       200:
 *         description: Paginated tasks list
 */
router.get('/', listTasksValidator, validate, getTasks);

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 */
router.get('/:id', getTask);

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               status: { type: string, enum: [todo, in_progress, done, archived] }
 *               priority: { type: string, enum: [low, medium, high, critical] }
 *               due_date: { type: string, format: date }
 *               tags: { type: array, items: { type: string } }
 */
router.post('/', createTaskValidator, validate, createTask);

/**
 * @swagger
 * /tasks/{id}:
 *   put:
 *     summary: Update a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', updateTaskValidator, validate, updateTask);

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', deleteTask);

module.exports = router;
