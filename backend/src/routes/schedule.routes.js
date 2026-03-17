const express = require('express');
const multer = require('multer');
const path = require('path');
const { uploadPdf, listSchedules, getMySchedules, getChanges, getReport, getReportDateRange, getReportServiceTypes } = require('../controllers/schedule.controller');
const { authenticate, requireManagerOrAdmin } = require('../middleware/auth.middleware');

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

// POST /api/schedules/upload - Upload PDF (admin and manager)
router.post('/upload', authenticate, requireManagerOrAdmin, upload.single('pdf'), uploadPdf);

// GET /api/schedules - List all schedules (admin and manager)
router.get('/', authenticate, requireManagerOrAdmin, listSchedules);

// GET /api/schedules/my - Get current user's schedules
router.get('/my', authenticate, getMySchedules);

// GET /api/schedules/changes - Get unnotified changes (admin and manager)
router.get('/changes', authenticate, requireManagerOrAdmin, getChanges);

// GET /api/schedules/report - Relatório por militar e graduação (admin and manager)
router.get('/report', authenticate, requireManagerOrAdmin, getReport);

// GET /api/schedules/report/range - Período disponível no BD (admin and manager)
router.get('/report/range', authenticate, requireManagerOrAdmin, getReportDateRange);

// GET /api/schedules/report/service-types - Tipos de escala disponíveis (admin and manager)
router.get('/report/service-types', authenticate, requireManagerOrAdmin, getReportServiceTypes);

module.exports = router;