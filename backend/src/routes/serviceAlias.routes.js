const express = require('express');
const { listServiceAliases, createOrUpdateServiceAlias, deleteServiceAlias } = require('../controllers/serviceAlias.controller');
const { authenticate, requireManagerOrAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', authenticate, requireManagerOrAdmin, listServiceAliases);
router.post('/', authenticate, requireManagerOrAdmin, createOrUpdateServiceAlias);
router.delete('/:id', authenticate, requireManagerOrAdmin, deleteServiceAlias);

module.exports = router;