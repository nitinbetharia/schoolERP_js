const express = require('express');
const BoardComplianceController = require('../controllers/BoardComplianceController');
const { authenticate, authorize } = require('../../../middleware/auth');

const router = express.Router();
const boardComplianceController = new BoardComplianceController();

/**
 * Board Compliance Routes
 * All routes require authentication
 */

// Trust-level NEP policy management (Trust Admin only)
router.put('/trust/nep-policy', authenticate, authorize('trust_admin', 'system_admin'), (req, res) =>
   boardComplianceController.setTrustNEPPolicy(req, res)
);

// School-level NEP policy management
router.get(
   '/schools/:schoolId/nep-policy',
   authenticate,
   authorize('school_admin', 'principal', 'trust_admin', 'system_admin'),
   (req, res) => boardComplianceController.getEffectiveNEPPolicy(req, res)
);

router.put(
   '/schools/:schoolId/nep-policy',
   authenticate,
   authorize('school_admin', 'principal', 'trust_admin', 'system_admin'),
   (req, res) => boardComplianceController.setSchoolNEPPolicy(req, res)
);

// Board affiliation management
router.get(
   '/schools/:schoolId/board-compliance',
   authenticate,
   authorize('school_admin', 'principal', 'trust_admin', 'system_admin'),
   (req, res) => boardComplianceController.getBoardCompliance(req, res)
);

router.put(
   '/schools/:schoolId/board-affiliation',
   authenticate,
   authorize('school_admin', 'principal', 'trust_admin', 'system_admin'),
   (req, res) => boardComplianceController.setBoardAffiliation(req, res)
);

// Reports and analytics
router.get('/reports/nep-compliance', authenticate, authorize('trust_admin', 'system_admin'), (req, res) =>
   boardComplianceController.getNEPComplianceReport(req, res)
);

module.exports = router;
