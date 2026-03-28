const express = require('express');
const router = express.Router();
const { listUsers, toggleUserActive, updateUserRole, getPlatformStats } = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin'));

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only operations
 */

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Get platform-wide statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', getPlatformStats);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: List all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/users', listUsers);

/**
 * @swagger
 * /admin/users/{id}/toggle-active:
 *   patch:
 *     summary: Activate or deactivate a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/users/:id/toggle-active', toggleUserActive);

/**
 * @swagger
 * /admin/users/{id}/role:
 *   patch:
 *     summary: Update a user's role
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 */
router.patch('/users/:id/role', updateUserRole);

module.exports = router;
