const express = require('express');
const SetupController = require('../controllers/SetupController');
const { requireSystemAdmin } = require('../../../middleware/auth');

// Q59-ENFORCED: Import validation schemas for setup operations
const { validateBody } = require('../../../utils/validation');
const { setupConfigurationValidationSchemas } = require('../models/SetupConfiguration');

const router = express.Router();
const setupController = new SetupController();

/**
 * Setup Routes
 * Handles trust setup workflow endpoints
 */

// Apply system authentication to all setup routes
router.use(requireSystemAdmin);

/**
 * @route POST /api/v1/setup/:trust_id/initialize
 * @desc Initialize setup for a trust
 * @access System Admin
 */
router.post('/:trust_id/initialize', (req, res) => {
   setupController.initializeSetup(req, res);
});

/**
 * @route GET /api/v1/setup/:trust_id/progress
 * @desc Get setup progress for a trust
 * @access System Admin
 */
router.get('/:trust_id/progress', (req, res) => {
   setupController.getSetupProgress(req, res);
});

/**
 * @route POST /api/v1/setup/:trust_id/step/:step_name/complete
 * @desc Complete a setup step
 * @access System Admin
 */
router.post(
   '/:trust_id/step/:step_name/complete',
   validateBody(setupConfigurationValidationSchemas.updateSetupConfiguration), // Q59-ENFORCED validation
   (req, res) => {
      setupController.completeStep(req, res);
   }
);

/**
 * @route GET /api/v1/setup/:trust_id/step/:step_name
 * @desc Get setup step details
 * @access System Admin
 */
router.get('/:trust_id/step/:step_name', (req, res) => {
   setupController.getStepDetails(req, res);
});

/**
 * @route DELETE /api/v1/setup/:trust_id/reset
 * @desc Reset setup for a trust (development/testing only)
 * @access System Admin
 */
router.delete('/:trust_id/reset', (req, res) => {
   setupController.resetSetup(req, res);
});

module.exports = router;
