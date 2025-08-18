/**
 * API Routes - v1
 * RESTful API endpoints for all modules
 */

const express = require('express');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Health check for API (no auth required)
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      version: require('../package.json').version,
      timestamp: new Date().toISOString()
    }
  });
});

// Authentication routes (no auth required for login)
router.use('/auth', require('./api/auth'));

// Apply authentication to all other API routes
router.use(requireAuth);

// Enhanced Reports API
router.use('/enhanced-reports', require('./api/enhanced-reports'));

// TODO: Add module-specific API routes
// router.use('/users', require('./api/users'));
// router.use('/students', require('./api/students'));
// router.use('/fees', require('./api/fees'));
// router.use('/attendance', require('./api/attendance'));
// router.use('/reports', require('./api/reports'));

module.exports = router;
