const express = require('express');
const router = express.Router();

// Import route modules
const systemRoutes = require('./system');
const setupRoutes = require('../modules/setup/routes/setupRoutes');
const userRoutes = require('../modules/user/routes/userRoutes');
const schoolModuleRoutes = require('../modules/school/routes');
const studentRoutes = require('../modules/student/routes/studentRoutes');

// Mount routes
router.use('/admin/system', systemRoutes);
router.use('/setup', setupRoutes);
router.use('/users', userRoutes);
router.use('/school', schoolModuleRoutes);
router.use('/students', studentRoutes);

// API status endpoint
router.get('/status', (req, res) => {
   res.json({
      success: true,
      message: 'School ERP API is running',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
   });
});

module.exports = router;
