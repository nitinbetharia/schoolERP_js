const express = require('express');
const StudentController = require('../controllers/StudentController');
const { authenticate, requireTrustAdmin } = require('../../../middleware/auth');
const { validators } = require('../../../utils/errors');
const { studentValidationSchemas } = require('../../../models');

const router = express.Router();
const studentController = new StudentController();

/**
 * Student Routes
 * All routes require authentication and Trust Admin role
 * Complete student lifecycle management
 * Q59-ENFORCED: All routes use validators.validateBody() with schemas
 */

// Apply authentication middleware to all routes
router.use(authenticate);
router.use(requireTrustAdmin);

// Student CRUD operations with Q59-ENFORCED validation
router.post('/', 
   validators.validateBody(studentValidationSchemas.create),
   studentController.createStudent.bind(studentController)
);

router.get('/', studentController.getStudents.bind(studentController));
router.get('/:id', studentController.getStudentById.bind(studentController));

router.put('/:id', 
   validators.validateBody(studentValidationSchemas.update),
   studentController.updateStudent.bind(studentController)
);

// Student lifecycle operations with Q59-ENFORCED validation
router.post('/:id/transfer', 
   validators.validateBody(studentValidationSchemas.transfer),
   studentController.transferStudent.bind(studentController)
);

router.post('/:id/promote', 
   validators.validateBody(studentValidationSchemas.promote),
   studentController.promoteStudent.bind(studentController)
);

router.patch('/:id/status', 
   validators.validateBody(studentValidationSchemas.statusUpdate),
   studentController.updateStudentStatus.bind(studentController)
);

// Student enrollment history
router.get('/:id/enrollments', studentController.getStudentEnrollments.bind(studentController));

// Class/Section specific operations
router.get('/class/:classId/section/:sectionId', studentController.getStudentsByClassSection.bind(studentController));

// Bulk operations
router.post('/bulk', studentController.bulkOperations.bind(studentController));

module.exports = router;
