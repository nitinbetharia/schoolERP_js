const express = require('express');
const schoolRoutes = require('./schoolRoutes');
const classRoutes = require('./classRoutes');
const sectionRoutes = require('./sectionRoutes');
const boardComplianceRoutes = require('./boardCompliance');
const udiseRoutes = require('./udise');
const udiseStudentRoutes = require('./udiseStudent');

const router = express.Router();

/**
 * School Module Routes
 * All routes are prefixed with /api/school
 */

// Mount sub-routes
router.use('/schools', schoolRoutes);
router.use('/classes', classRoutes);
router.use('/sections', sectionRoutes);
router.use('/compliance', boardComplianceRoutes);
router.use('/udise', udiseRoutes);
router.use('/udise', udiseStudentRoutes); // UDISE+ student specific routes

module.exports = router;
