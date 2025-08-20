const express = require('express');
const ClassController = require('../controllers/ClassController');
const { authenticate, requireTrustAdmin } = require('../../../middleware/auth');

const router = express.Router();
const classController = new ClassController();

/**
 * Class Routes
 * All routes require authentication and Trust Admin role
 */

// Apply authentication middleware to all routes
router.use(authenticate);
router.use(requireTrustAdmin);

// Create new class
router.post('/', classController.createClass.bind(classController));

// Get classes by school
router.get('/school/:schoolId', classController.getClassesBySchool.bind(classController));

// Bulk create classes for a school
router.post('/bulk/:schoolId', classController.bulkCreateClasses.bind(classController));

// Get class by ID
router.get('/:id', classController.getClassById.bind(classController));

// Update class
router.put('/:id', classController.updateClass.bind(classController));

// Delete class
router.delete('/:id', classController.deleteClass.bind(classController));

// Get class statistics
router.get('/:id/stats', classController.getClassStats.bind(classController));

module.exports = router;
