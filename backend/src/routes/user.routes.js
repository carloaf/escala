const express = require('express');
const { listUsers, getUser } = require('../controllers/user.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// GET /api/users - List all users (admin only)
router.get('/', authenticate, requireAdmin, listUsers);

// GET /api/users/:id - Get specific user (admin only)
router.get('/:id', authenticate, requireAdmin, getUser);

module.exports = router;
