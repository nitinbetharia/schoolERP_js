const express = require('express');
const SchoolController = require('../controllers/SchoolController');
const { authenticate, requireTrustAdmin } = require('../../../middleware/auth');

const router = express.Router();
const schoolController = new SchoolController();

/**
 * School Routes
 * Handles school management endpoints within a tenant
 */

// Apply authentication to all school routes
router.use(authenticate);

/**
 * @route GET /api/v1/schools
 * @desc Get all schools with filters
 * @access Private
 */
router.get('/', (req, res) => {
   schoolController.getSchools(req, res);
});

/**
 * @route POST /api/v1/schools
 * @desc Create a new school
 * @access Admin/Trust Admin
 */
router.post('/', requireTrustAdmin, (req, res) => {
   schoolController.createSchool(req, res);
});

/**
 * @route GET /api/v1/schools/:id
 * @desc Get school by ID with classes
 * @access Private
 */
router.get('/:id', (req, res) => {
   schoolController.getSchoolById(req, res);
});

/**
 * @route PUT /api/v1/schools/:id
 * @desc Update school by ID
 * @access Admin/Trust Admin
 */
router.put('/:id', requireTrustAdmin, (req, res) => {
   schoolController.updateSchool(req, res);
});

/**
 * @route DELETE /api/v1/schools/:id
 * @desc Delete school by ID (soft delete)
 * @access Admin/Trust Admin
 */
router.delete('/:id', requireTrustAdmin, (req, res) => {
   schoolController.deleteSchool(req, res);
});

/**
 * @route GET /api/v1/schools/:id/stats
 * @desc Get school statistics
 * @access Private
 */
router.get('/:id/stats', (req, res) => {
   schoolController.getSchoolStats(req, res);
});

module.exports = router;
