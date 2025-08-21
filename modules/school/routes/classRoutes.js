const express = require('express');
const ClassController = require('../controllers/ClassController');
const { authenticate, requireTrustAdmin } = require('../../../middleware/auth');
const { validators } = require('../../../utils/errors');
const { classValidationSchemas } = require('../../../models');

const router = express.Router();
const classController = new ClassController();

/**
 * Class Routes
 * All routes require authentication and Trust Admin role
 * Q59-ENFORCED: All routes use validators.validateBody() with schemas
 */

// Apply authentication middleware to all routes
router.use(authenticate);
router.use(requireTrustAdmin);

// Create new class with Q59-ENFORCED validation
router.post(
   '/',
   validators.validateBody(classValidationSchemas.create),
   classController.createClass.bind(classController)
);

// Get classes by school
router.get('/school/:schoolId', classController.getClassesBySchool.bind(classController));

// Bulk create classes for a school with Q59-ENFORCED validation
router.post(
   '/bulk/:schoolId',
   validators.validateBody(classValidationSchemas.bulkCreate),
   classController.bulkCreateClasses.bind(classController)
);

// Get class by ID
router.get('/:id', classController.getClassById.bind(classController));

// Update class with Q59-ENFORCED validation
router.put(
   '/:id',
   validators.validateBody(classValidationSchemas.update),
   classController.updateClass.bind(classController)
);

// Assign teacher to class with Q59-ENFORCED validation
router.patch(
   '/:id/teacher',
   validators.validateBody(classValidationSchemas.assignTeacher),
   classController.assignTeacher.bind(classController)
);

// Delete class
router.delete('/:id', classController.deleteClass.bind(classController));

// Get class statistics
router.get('/:id/stats', classController.getClassStats.bind(classController));

module.exports = router;
