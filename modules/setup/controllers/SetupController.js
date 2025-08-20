const SetupService = require('../services/SetupService');
const {
   ErrorFactory,
   ValidationError,
   NotFoundError,
   DuplicateError
} = require('../../../utils/errors');
const logger = require('../../../utils/logger');

/**
 * Setup Controller
 * Handles HTTP requests for trust setup management
 */
function createSetupController() {
   const setupService = new SetupService();

   /**
    * Initialize setup for a trust
    */
   async function initializeSetup(req, res) {
      try {
         const { trust_id } = req.body;

         if (!trust_id) {
            return res.status(400).json({
               success: false,
               error: {
                  code: 'MISSING_TRUST_ID',
                  message: 'Trust ID is required'
               }
            });
         }

         const result = await setupService.initializeSetup(trust_id);
         
         res.json({
            success: true,
            message: 'Setup initialized successfully',
            data: result
         });
      } catch (error) {
         logger.error('Setup Controller Error', {
            service: 'setup-controller',
            category: 'ERROR',
            event: 'Setup initialization failed',
            error: error.message,
         });

         res.status(500).json({
            success: false,
            error: {
               code: 'SETUP_INIT_FAILED',
               message: 'Setup initialization failed',
               details: error.message
            }
         });
      }
   }

   /**
    * Get setup progress for a trust
    */
   async function getSetupProgress(req, res) {
      try {
         const { trust_id } = req.params;

         if (!trust_id) {
            return res.status(400).json({
               success: false,
               error: {
                  code: 'MISSING_TRUST_ID',
                  message: 'Trust ID is required'
               }
            });
         }

         const progress = await setupService.getSetupProgress(trust_id);
         
         res.json({
            success: true,
            data: progress
         });
      } catch (error) {
         logger.error('Setup Controller Error', {
            service: 'setup-controller',
            category: 'ERROR',
            event: 'Get setup progress failed',
            error: error.message,
         });

         res.status(500).json({
            success: false,
            error: {
               code: 'GET_PROGRESS_FAILED',
               message: 'Failed to get setup progress',
               details: error.message
            }
         });
      }
   }

   /**
    * Complete a setup step
    */
   async function completeStep(req, res) {
      try {
         const { trust_id, step_name } = req.body;

         if (!trust_id || !step_name) {
            return res.status(400).json({
               success: false,
               error: {
                  code: 'MISSING_PARAMETERS',
                  message: 'Trust ID and step name are required'
               }
            });
         }

         const result = await setupService.completeStep(trust_id, step_name, req.body.data);
         
         res.json({
            success: true,
            message: 'Setup step completed successfully',
            data: result
         });
      } catch (error) {
         logger.error('Setup Controller Error', {
            service: 'setup-controller',
            category: 'ERROR',
            event: 'Setup step completion failed',
            error: error.message,
         });

         res.status(500).json({
            success: false,
            error: {
               code: 'STEP_COMPLETION_FAILED',
               message: 'Setup step completion failed',
               details: error.message
            }
         });
      }
   }

   /**
    * Get step details
    */
   async function getStepDetails(req, res) {
      try {
         const { trust_id, step_name } = req.params;

         if (!trust_id || !step_name) {
            return res.status(400).json({
               success: false,
               error: {
                  code: 'MISSING_PARAMETERS',
                  message: 'Trust ID and step name are required'
               }
            });
         }

         const stepDetails = await setupService.getStepDetails(trust_id, step_name);
         
         res.json({
            success: true,
            data: stepDetails
         });
      } catch (error) {
         logger.error('Setup Controller Error', {
            service: 'setup-controller',
            category: 'ERROR',
            event: 'Get step details failed',
            error: error.message,
         });

         res.status(500).json({
            success: false,
            error: {
               code: 'GET_STEP_DETAILS_FAILED',
               message: 'Failed to get step details',
               details: error.message
            }
         });
      }
   }

   /**
    * Reset setup for a trust
    */
   async function resetSetup(req, res) {
      try {
         const { trust_id } = req.body;

         if (!trust_id) {
            return res.status(400).json({
               success: false,
               error: {
                  code: 'MISSING_TRUST_ID',
                  message: 'Trust ID is required'
               }
            });
         }

         const result = await setupService.resetSetup(trust_id);
         
         res.json({
            success: true,
            message: 'Setup reset successfully',
            data: result
         });
      } catch (error) {
         logger.error('Setup Controller Error', {
            service: 'setup-controller',
            category: 'ERROR',
            event: 'Setup reset failed',
            error: error.message,
         });

         res.status(500).json({
            success: false,
            error: {
               code: 'SETUP_RESET_FAILED',
               message: 'Setup reset failed',
               details: error.message
            }
         });
      }
   }

   return {
      initializeSetup,
      getSetupProgress,
      completeStep,
      getStepDetails,
      resetSetup,
   };
}

module.exports = createSetupController;
