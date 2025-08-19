const express = require('express');
const StudentController = require('../controllers/StudentController');
const { authenticate } = require('../../../middleware/authentication');
const { requireTrustAdmin } = require('../../../middleware/authorization');

const router = express.Router();
const studentController = new StudentController();

/**
 * Student Routes
 * All routes require authentication and Trust Admin role
 * Complete student lifecycle management
 */

// Apply authentication middleware to all routes
router.use(authenticate);
router.use(requireTrustAdmin);

// Student CRUD operations
router.post('/', studentController.createStudent.bind(studentController));
router.get('/', studentController.getStudents.bind(studentController));
router.get('/:id', studentController.getStudentById.bind(studentController));
router.put('/:id', studentController.updateStudent.bind(studentController));

// Student lifecycle operations
router.post('/:id/transfer', studentController.transferStudent.bind(studentController));
router.post('/:id/promote', studentController.promoteStudent.bind(studentController));
router.patch('/:id/status', studentController.updateStudentStatus.bind(studentController));

// Student enrollment history
router.get('/:id/enrollments', studentController.getStudentEnrollments.bind(studentController));

// Class/Section specific operations
router.get('/class/:classId/section/:sectionId', studentController.getStudentsByClassSection.bind(studentController));

// Bulk operations
router.post('/bulk', studentController.bulkOperations.bind(studentController));

module.exports = router;
