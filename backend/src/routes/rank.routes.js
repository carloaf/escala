const express = require('express');
const Rank = require('../models/Rank');

const router = express.Router();

// GET /api/ranks - Lista todas as graduações (público)
router.get('/', async (req, res) => {
  try {
    const ranks = await Rank.all();
    res.json(ranks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
