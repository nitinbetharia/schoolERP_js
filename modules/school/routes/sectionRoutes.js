const express = require('express');
const SectionController = require('../controllers/SectionController');
const { authenticate, requireTrustAdmin } = require('../../../middleware/auth');
const { validators } = require('../../../utils/errors');
const { sectionValidationSchemas } = require('../../../models');

const router = express.Router();
const sectionController = new SectionController();

/**
 * Section Routes
 * All routes require authentication and Trust Admin role
 * Q59-ENFORCED: All routes use validators.validateBody() with schemas
 */

// Apply authentication middleware to all routes
router.use(authenticate);
router.use(requireTrustAdmin);

// Create new section with Q59-ENFORCED validation
router.post(
   '/',
   validators.validateBody(sectionValidationSchemas.create),
   sectionController.createSection.bind(sectionController)
);

// Get sections by class
router.get('/class/:classId', sectionController.getSectionsByClass.bind(sectionController));

// Bulk create sections for a class with Q59-ENFORCED validation
router.post(
   '/bulk/:classId',
   validators.validateBody(sectionValidationSchemas.bulkCreate),
   sectionController.bulkCreateSections.bind(sectionController)
);

// Get section by ID
router.get('/:id', sectionController.getSectionById.bind(sectionController));

// Update section with Q59-ENFORCED validation
router.put(
   '/:id',
   validators.validateBody(sectionValidationSchemas.update),
   sectionController.updateSection.bind(sectionController)
);

// Assign teacher to section with Q59-ENFORCED validation
router.patch(
   '/:id/teacher',
   validators.validateBody(sectionValidationSchemas.assignTeacher),
   sectionController.assignTeacher.bind(sectionController)
);

// Delete section
router.delete('/:id', sectionController.deleteSection.bind(sectionController));

module.exports = router;
