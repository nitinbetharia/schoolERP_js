const express = require('express');
const BoardComplianceController = require('../controllers/BoardComplianceController');
const { authenticate, authorize } = require('../../../middleware/auth');

const router = express.Router();
const boardComplianceController = new BoardComplianceController();

/**
 * Enhanced Board Compliance Routes
 * All routes require authentication and proper authorization
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

// General board affiliation management
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

// ============================================================================
// CBSE BOARD COMPLIANCE ROUTES
// ============================================================================

// CBSE affiliation registration and management
router.post(
   '/schools/:schoolId/cbse/affiliation',
   authenticate,
   authorize('school_admin', 'principal', 'trust_admin', 'system_admin'),
   (req, res) => boardComplianceController.registerCBSEAffiliation(req, res)
);

router.put(
   '/schools/:schoolId/cbse/compliance',
   authenticate,
   authorize('school_admin', 'principal', 'trust_admin', 'system_admin'),
   (req, res) => boardComplianceController.updateCBSECompliance(req, res)
);

// CBSE transfer certificate generation
router.post(
   '/schools/:schoolId/cbse/students/:studentId/transfer-certificate',
   authenticate,
   authorize('school_admin', 'principal', 'academic_coordinator'),
   (req, res) => boardComplianceController.generateCBSETransferCertificate(req, res)
);

// ============================================================================
// CISCE BOARD COMPLIANCE ROUTES
// ============================================================================

// CISCE affiliation registration and management
router.post(
   '/schools/:schoolId/cisce/affiliation',
   authenticate,
   authorize('school_admin', 'principal', 'trust_admin', 'system_admin'),
   (req, res) => boardComplianceController.registerCISCEAffiliation(req, res)
);

// CISCE transfer certificate generation
router.post(
   '/schools/:schoolId/cisce/students/:studentId/transfer-certificate',
   authenticate,
   authorize('school_admin', 'principal', 'academic_coordinator'),
   (req, res) => boardComplianceController.generateCISCETransferCertificate(req, res)
);

// ============================================================================
// STATE BOARD COMPLIANCE ROUTES
// ============================================================================

// State Board affiliation registration and management
router.post(
   '/schools/:schoolId/state-board/affiliation',
   authenticate,
   authorize('school_admin', 'principal', 'trust_admin', 'system_admin'),
   (req, res) => boardComplianceController.registerStateBoardAffiliation(req, res)
);

// ============================================================================
// INTERNATIONAL BOARD COMPLIANCE ROUTES
// ============================================================================

// International Board authorization registration and management
router.post(
   '/schools/:schoolId/international-board/authorization',
   authenticate,
   authorize('school_admin', 'principal', 'trust_admin', 'system_admin'),
   (req, res) => boardComplianceController.registerInternationalBoardAuthorization(req, res)
);

// ============================================================================
// COMPREHENSIVE COMPLIANCE REPORTING
// ============================================================================

// Comprehensive board compliance report
router.get(
   '/schools/:schoolId/comprehensive-report',
   authenticate,
   authorize('school_admin', 'principal', 'trust_admin', 'system_admin'),
   (req, res) => boardComplianceController.getComprehensiveBoardComplianceReport(req, res)
);

// NEP compliance report (existing)
router.get('/reports/nep-compliance', authenticate, authorize('trust_admin', 'system_admin'), (req, res) =>
   boardComplianceController.getNEPComplianceReport(req, res)
);

module.exports = router;
