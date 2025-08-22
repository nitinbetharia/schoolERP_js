const express = require('express');
const router = express.Router();

// Import core route modules
const systemRoutes = require('./system');

// Module routes
const userRoutes = require('../modules/users/routes/userRoutes');
const studentRoutes = require('../modules/students/routes/studentRoutes');

// Mount core routes
router.use('/admin/system', systemRoutes);

// Mount simplified routes
router.use('/users', userRoutes);
router.use('/students', studentRoutes);

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
