const express = require('express');
const router = express.Router();

// Import route modules
const systemRoutes = require('./system');
const setupRoutes = require('../modules/setup/routes/setupRoutes');
const trustRoutes = require('./trust');
// const userRoutes = require('../modules/user/routes/userRoutes'); // Needs investigation
// const schoolModuleRoutes = require('../modules/school/routes'); // ClassController not implemented
// const studentRoutes = require('../modules/student/routes/studentRoutes'); // Needs investigation
// const attendanceRoutes = require('../modules/attendance/routes/attendanceRoutes'); // Needs investigation
const feeRoutes = require('../modules/fee/routes');
const udiseRoutes = require('../modules/udise/routes');

// Mount routes
router.use('/admin/system', systemRoutes);
router.use('/setup', setupRoutes);
router.use('/trust/:trustId', trustRoutes); // Enable trust-scoped routes
// router.use('/users', userRoutes); // Disabled - needs investigation
// router.use('/school', schoolModuleRoutes); // Disabled - ClassController not implemented
// router.use('/students', studentRoutes); // Disabled - needs investigation
// router.use('/attendance', attendanceRoutes); // Disabled - needs investigation
router.use('/fees', feeRoutes);
router.use('/udise', udiseRoutes);

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
