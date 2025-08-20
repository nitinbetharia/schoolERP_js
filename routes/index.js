const express = require('express');
const router = express.Router();

// Import route modules
const systemRoutes = require('./system');
const setupRoutes = require('../modules/setup/routes/setupRoutes');
// const userRoutes = require('../modules/user/routes/userRoutes'); // Temporarily disabled - corrupted
// const schoolModuleRoutes = require('../modules/school/routes'); // Temporarily disabled - may be corrupted
// const studentRoutes = require('../modules/student/routes/studentRoutes'); // Temporarily disabled - may be corrupted
// const attendanceRoutes = require('../modules/attendance/routes/attendanceRoutes'); // Temporarily disabled - may be corrupted
const feeRoutes = require('../modules/fee/routes');
const udiseRoutes = require('../modules/udise/routes');

// Mount routes
router.use('/admin/system', systemRoutes);
router.use('/setup', setupRoutes);
// router.use('/users', userRoutes); // Temporarily disabled
// router.use('/school', schoolModuleRoutes); // Temporarily disabled
// router.use('/students', studentRoutes); // Temporarily disabled
// router.use('/attendance', attendanceRoutes); // Temporarily disabled
router.use('/fees', feeRoutes);
router.use('/udise', udiseRoutes);

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
