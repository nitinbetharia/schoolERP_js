const express = require('express');
const UDISEController = require('../controllers/UDISEController');
const { authenticate, authorize } = require('../../../middleware/auth');

const router = express.Router();
const udiseController = new UDISEController();

/**
 * UDISE+ Routes
 * Government compliance routes for school registration and census reporting
 * All routes require authentication and appropriate authorization
 */

// School Registration with UDISE+
router.post(
   '/schools/:schoolId/register',
   authenticate,
   authorize('school_admin', 'principal', 'trust_admin', 'system_admin'),
   (req, res) => udiseController.registerSchool(req, res),
);

// Get UDISE+ school information
router.get(
   '/schools/:schoolId/info',
   authenticate,
   authorize('school_admin', 'principal', 'trust_admin', 'system_admin'),
   (req, res) => udiseController.getSchoolUDISEInfo(req, res),
);

// Class-wise enrollment management
router.put(
   '/udise-schools/:udiseSchoolId/enrollment',
   authenticate,
   authorize('school_admin', 'principal', 'trust_admin', 'system_admin'),
   (req, res) => udiseController.updateClassEnrollment(req, res),
);

router.get(
   '/udise-schools/:udiseSchoolId/enrollment-report',
   authenticate,
   authorize('school_admin', 'principal', 'trust_admin', 'system_admin'),
   (req, res) => udiseController.getClassEnrollmentReport(req, res),
);

// Facilities management
router.put(
   '/udise-schools/:udiseSchoolId/facilities',
   authenticate,
   authorize('school_admin', 'principal', 'trust_admin', 'system_admin'),
   (req, res) => udiseController.updateFacilities(req, res),
);

// Census reporting
router.get(
   '/udise-schools/:udiseSchoolId/census-report',
   authenticate,
   authorize('school_admin', 'principal', 'trust_admin', 'system_admin'),
   (req, res) => udiseController.generateCensusReport(req, res),
);

// Data export for government submission
router.get(
   '/udise-schools/:udiseSchoolId/export',
   authenticate,
   authorize('school_admin', 'principal', 'trust_admin', 'system_admin'),
   (req, res) => udiseController.exportUDISEData(req, res),
);

// Compliance monitoring
router.get(
   '/udise-schools/:udiseSchoolId/compliance',
   authenticate,
   authorize('school_admin', 'principal', 'trust_admin', 'system_admin'),
   (req, res) => udiseController.getComplianceStatus(req, res),
);

module.exports = router;
