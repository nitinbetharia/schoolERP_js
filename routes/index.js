const express = require('express');
const router = express.Router();

// Import core route modules
const systemRoutes = require('./system');

// Module routes (working)
const userRoutes = require('../modules/users/routes/userRoutes');
const studentRoutes = require('../modules/students/routes/studentRoutes');
const setupRoutes = require('../modules/setup/routes/setupRoutes'); // PHASE 1: ENABLED
const schoolRoutes = require('../modules/school/routes/index'); // Basic school routes enabled

// Mount core routes
router.use('/admin/system', systemRoutes);

// Mount working module routes
router.use('/users', userRoutes);
router.use('/students', studentRoutes);
router.use('/setup', setupRoutes); // PHASE 1: ENABLED
router.use('/schools', schoolRoutes); // ENABLED: Basic school functionality

// API status endpoint
router.get('/status', (req, res) => {
   res.json({
      success: true,
      message: 'School ERP API is running',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
   });
});

module.exports = router;
