require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const scheduleRoutes = require('./routes/schedule.routes');

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
const publicDir = path.join(__dirname, '..', 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API info endpoint (JSON)
app.get('/api', (req, res) => {
  res.json({
    name: 'Sistema de Gerenciamento de Escalas API',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      health: 'GET /health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me'
      },
      users: {
        list: 'GET /api/users (admin)',
        get: 'GET /api/users/:id (admin)'
      },
      schedules: {
        upload: 'POST /api/schedules/upload (admin)',
        list: 'GET /api/schedules (admin)',
        my: 'GET /api/schedules/my',
        changes: 'GET /api/schedules/changes (admin)'
      }
    },
    documentation: 'Ver README.md para mais informações'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/schedules', scheduleRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error' 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Escala backend listening on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;