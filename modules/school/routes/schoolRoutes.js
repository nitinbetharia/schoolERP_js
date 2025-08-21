const express = require('express');
const SchoolController = require('../controllers/SchoolController');
const { requireTrustAdmin } = require('../../../middleware/auth');
const { validators } = require('../../../utils/errors');
const { schoolValidationSchemas } = require('../../../models');

const router = express.Router({ mergeParams: true });
const schoolController = new SchoolController();

/**
 * School Routes
 * Handles school management endpoints within a tenant
 * Q59-ENFORCED: All routes use validators.validateBody() with schemas
 */

// Apply authentication to all school routes (if not already applied)
// router.use(authenticate); // This should be applied in the trust routes

/**
 * @route GET /api/v1/trust/:trustId/schools
 * @desc Get all schools with filters
 * @access Private
 */
router.get('/', (req, res) => {
   schoolController.getSchools(req, res);
});

/**
 * @route POST /api/v1/trust/:trustId/schools
 * @desc Create a new school
 * @access Admin/Trust Admin
 * @validation Q59-ENFORCED
 */
router.post('/', requireTrustAdmin, validators.validateBody(schoolValidationSchemas.create), (req, res) => {
   schoolController.createSchool(req, res);
});

/**
 * @route GET /api/v1/trust/:trustId/schools/:id
 * @desc Get school by ID with classes
 * @access Private
 */
router.get('/:id', (req, res) => {
   schoolController.getSchoolById(req, res);
});

/**
 * @route PUT /api/v1/trust/:trustId/schools/:id
 * @desc Update school by ID
 * @access Admin/Trust Admin
 * @validation Q59-ENFORCED
 */
router.put('/:id', requireTrustAdmin, validators.validateBody(schoolValidationSchemas.update), (req, res) => {
   schoolController.updateSchool(req, res);
});

/**
 * @route PATCH /api/v1/trust/:trustId/schools/:id/status
 * @desc Update school status (soft delete)
 * @access Admin/Trust Admin
 * @validation Q59-ENFORCED - Status update validation
 */
router.patch(
   '/:id/status',
   requireTrustAdmin,
   validators.validateBody(schoolValidationSchemas.statusUpdate),
   (req, res) => {
      schoolController.updateSchoolStatus(req, res);
   }
);

/**
 * @route DELETE /api/v1/trust/:trustId/schools/:id
 * @desc Delete school by ID (soft delete)
 * @access Admin/Trust Admin
 */
router.delete('/:id', requireTrustAdmin, (req, res) => {
   schoolController.deleteSchool(req, res);
});

/**
 * @route PATCH /api/v1/trust/:trustId/schools/:id/compliance
 * @desc Update school compliance information
 * @access Admin/Trust Admin
 * @validation Q59-ENFORCED
 */
router.patch(
   '/:id/compliance',
   requireTrustAdmin,
   validators.validateBody(schoolValidationSchemas.compliance),
   (req, res) => {
      schoolController.updateSchoolCompliance(req, res);
   }
);

module.exports = router;

/**
 * @route GET /api/v1/schools/:id/stats
 * @desc Get school statistics
 * @access Private
 */
router.get('/:id/stats', (req, res) => {
   schoolController.getSchoolStats(req, res);
});

module.exports = router;
