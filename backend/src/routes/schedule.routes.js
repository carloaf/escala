const express = require('express');
const multer = require('multer');
const path = require('path');
const { uploadPdf, listSchedules, getMySchedules, getChanges } = require('../controllers/schedule.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ts = Date.now();
    cb(null, ts + '-' + file.originalname);
  }
});

const upload = multer({ storage, fileFilter: (req, file, cb) => {
  if (!file.mimetype || !file.mimetype.includes('pdf')) {
    return cb(new Error('Only PDF files allowed'));
  }
  cb(null, true);
}});

// POST /api/schedules/upload - Upload PDF (admin only)
router.post('/upload', authenticate, requireAdmin, upload.single('pdf'), uploadPdf);

// GET /api/schedules - List all schedules (admin only)
router.get('/', authenticate, requireAdmin, listSchedules);

// GET /api/schedules/my - Get current user's schedules
router.get('/my', authenticate, getMySchedules);

// GET /api/schedules/changes - Get unnotified changes (admin only)
router.get('/changes', authenticate, requireAdmin, getChanges);

module.exports = router;