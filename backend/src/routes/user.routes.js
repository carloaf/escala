const express = require('express');
const { listUsers, getUser, getMe, updateUser, updateUserStatus } = require('../controllers/user.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// GET /api/users - List all users (admin only)
router.get('/', authenticate, requireAdmin, listUsers);

// GET /api/users/me - Get current authenticated user
router.get('/me', authenticate, getMe);

// GET /api/users/:id - Get specific user (admin only)
router.get('/:id', authenticate, requireAdmin, getUser);

// PUT /api/users/:id - Update user data (admin only)
router.put('/:id', authenticate, requireAdmin, updateUser);

// PATCH /api/users/:id/status - Activate/deactivate user (admin only)
router.patch('/:id/status', authenticate, requireAdmin, updateUserStatus);

module.exports = router;
