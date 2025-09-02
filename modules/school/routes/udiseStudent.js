const express = require('express');
const UDISEStudentController = require('../controllers/UDISEStudentController');
const { authenticate, authorize } = require('../../../middleware/auth');

const router = express.Router();

/**
 * UDISE+ Student Routes
 * Individual student government compliance routes
 * All routes require authentication and appropriate authorization
 *
 * Following copilot instructions: CommonJS, proper middleware patterns
 */

// Student Registration with UDISE+
router.post(
   '/students/register',
   authenticate,
   authorize('school_admin', 'principal', 'trust_admin', 'system_admin'),
   (req, res) => UDISEStudentController.registerStudent(req, res),
);

// Get UDISE+ student by UDISE+ student ID
router.get(
   '/students/:udiseStudentId',
   authenticate,
   authorize(
      'school_admin',
      'principal',
      'trust_admin',
      'system_admin',
      'teacher',
      'staff',
   ),
   (req, res) => UDISEStudentController.getStudentById(req, res),
);

// Update UDISE+ student information
router.put(
   '/students/:udiseStudentId',
   authenticate,
   authorize('school_admin', 'principal', 'trust_admin', 'system_admin'),
   (req, res) => UDISEStudentController.updateStudent(req, res),
);

// Get UDISE+ students by school
router.get(
   '/schools/:udiseSchoolId/students',
   authenticate,
   authorize(
      'school_admin',
      'principal',
      'trust_admin',
      'system_admin',
      'teacher',
      'staff',
   ),
   (req, res) => UDISEStudentController.getStudentsBySchool(req, res),
);

// Validate student data for government submission
router.post(
   '/students/:udiseStudentId/validate',
   authenticate,
   authorize('school_admin', 'principal', 'trust_admin', 'system_admin'),
   (req, res) => UDISEStudentController.validateStudent(req, res),
);

// Generate student census data for government submission
router.get(
   '/schools/:udiseSchoolId/census/:censusYear',
   authenticate,
   authorize('school_admin', 'principal', 'trust_admin', 'system_admin'),
   (req, res) => UDISEStudentController.generateCensusData(req, res),
);

// Bulk register students with UDISE+
router.post(
   '/students/bulk-register',
   authenticate,
   authorize('school_admin', 'principal', 'trust_admin', 'system_admin'),
   (req, res) => UDISEStudentController.bulkRegisterStudents(req, res),
);

module.exports = router;
