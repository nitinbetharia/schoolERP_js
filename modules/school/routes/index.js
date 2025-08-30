const express = require('express');
const schoolRoutes = require('./schoolRoutes');
// const classRoutes = require('./classRoutes'); // TODO: Fix bind error
// const sectionRoutes = require('./sectionRoutes'); // TODO: Fix bind error
// const boardComplianceRoutes = require('./boardCompliance'); // TODO: Fix constructor error
const udiseRoutes = require('./udise');
// const udiseStudentRoutes = require('./udiseStudent'); // TODO: Fix models import

const router = express.Router();

/**
 * School Module Routes
 * All routes are prefixed with /api/school
 * NOTE: Some routes temporarily disabled due to refactoring issues
 */

// Mount working sub-routes
router.use('/schools', schoolRoutes);
// router.use('/classes', classRoutes); // TODO: Enable after fixing
// router.use('/sections', sectionRoutes); // TODO: Enable after fixing
// router.use('/compliance', boardComplianceRoutes); // TODO: Enable after fixing
router.use('/udise/schools', udiseRoutes);
// router.use('/udise/students', udiseStudentRoutes); // TODO: Enable after fixing

module.exports = router;
