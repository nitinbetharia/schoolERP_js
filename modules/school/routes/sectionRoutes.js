const express = require('express');
const SectionController = require('../controllers/SectionController');
const { authenticate, requireTrustAdmin } = require('../../../middleware/auth');

const router = express.Router();
const sectionController = new SectionController();

/**
 * Section Routes
 * All routes require authentication and Trust Admin role
 */

// Apply authentication middleware to all routes
router.use(authenticate);
router.use(requireTrustAdmin);

// Create new section
router.post('/', sectionController.createSection.bind(sectionController));

// Get sections by class
router.get('/class/:classId', sectionController.getSectionsByClass.bind(sectionController));

// Bulk create sections for a class
router.post('/bulk/:classId', sectionController.bulkCreateSections.bind(sectionController));

// Get section by ID
router.get('/:id', sectionController.getSectionById.bind(sectionController));

// Update section
router.put('/:id', sectionController.updateSection.bind(sectionController));

// Delete section
router.delete('/:id', sectionController.deleteSection.bind(sectionController));

module.exports = router;
