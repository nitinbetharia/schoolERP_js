const express = require('express');
const FeeConfigurationController = require('../controllers/FeeConfigurationController');
const auth = require('../../../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

/**
 * Fee Configuration Routes
 * These routes manage fee configurations in the system database
 */

// List all fee configurations
router.get('/', FeeConfigurationController.listFeeConfigurations);

// Get a specific fee configuration
router.get('/:id', FeeConfigurationController.getFeeConfiguration);

// Create a new fee configuration
router.post('/', FeeConfigurationController.createFeeConfiguration);

// Update an existing fee configuration
router.put('/:id', FeeConfigurationController.updateFeeConfiguration);

// Delete a fee configuration
router.delete('/:id', FeeConfigurationController.deleteFeeConfiguration);

// Calculate fees for a student profile (preview)
router.post('/:fee_configuration_id/calculate', FeeConfigurationController.calculateFeesForProfile);

// Clone an existing fee configuration
router.post('/:id/clone', FeeConfigurationController.cloneFeeConfiguration);

module.exports = router;
