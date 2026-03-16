const express = require('express');
const { listServiceAliases, createOrUpdateServiceAlias, deleteServiceAlias } = require('../controllers/serviceAlias.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', authenticate, requireAdmin, listServiceAliases);
router.post('/', authenticate, requireAdmin, createOrUpdateServiceAlias);
router.delete('/:id', authenticate, requireAdmin, deleteServiceAlias);

module.exports = router;