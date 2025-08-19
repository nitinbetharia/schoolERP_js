const SetupService = require('../services/SetupService');
const { ValidationError, NotFoundError, DuplicateError } = require('../../../utils/errors');
const logger = require('../../../utils/logger');

/**
 * Setup Controller
 * Handles HTTP requests for trust setup management
 */
class SetupController {
   constructor() {
      this.setupService = new SetupService();
   }

   /**
    * Initialize setup for a trust
    */
   async initializeSetup(req, res) {
      try {
         const { trust_id } = req.params;
         const systemUserId = req.user.id;

         if (!trust_id || isNaN(trust_id)) {
            throw new ValidationError('Valid trust ID is required');
         }

         const result = await this.setupService.initializeSetup(parseInt(trust_id), systemUserId);

         logger.info('Setup Controller Event', {
            service: 'setup-controller',
            category: 'SETUP',
            event: 'Setup initialization request processed',
            trust_id: trust_id,
            system_user_id: systemUserId,
         });

         res.status(201).json({
            success: true,
            data: result,
         });
      } catch (error) {
         logger.error('Setup Controller Error', {
            service: 'setup-controller',
            category: 'ERROR',
            event: 'Setup initialization failed',
            error: error.message,
         });

         const statusCode = error instanceof ValidationError ? 400 : error instanceof DuplicateError ? 409 : 500;

         res.status(statusCode).json({
            success: false,
            error: error.message,
         });
      }
   }

   /**
    * Get setup progress for a trust
    */
   async getSetupProgress(req, res) {
      try {
         const { trust_id } = req.params;

         if (!trust_id || isNaN(trust_id)) {
            throw new ValidationError('Valid trust ID is required');
         }

         const progress = await this.setupService.getSetupProgress(parseInt(trust_id));

         res.status(200).json({
            success: true,
            data: progress,
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
            error: error.message,
         });
      }
   }

   /**
    * Complete a setup step
    */
   async completeStep(req, res) {
      try {
         const { trust_id, step_name } = req.params;
         const configurationData = req.body;
         const systemUserId = req.user.id;

         if (!trust_id || isNaN(trust_id)) {
            throw new ValidationError('Valid trust ID is required');
         }

         if (!step_name) {
            throw new ValidationError('Step name is required');
         }

         const result = await this.setupService.completeStep(
            parseInt(trust_id),
            step_name,
            configurationData,
            systemUserId
         );

         logger.info('Setup Controller Event', {
            service: 'setup-controller',
            category: 'SETUP',
            event: 'Setup step completion processed',
            trust_id: trust_id,
            step_name: step_name,
            system_user_id: systemUserId,
         });

         res.status(200).json({
            success: true,
            data: result,
         });
      } catch (error) {
         logger.error('Setup Controller Error', {
            service: 'setup-controller',
            category: 'ERROR',
            event: 'Setup step completion failed',
            error: error.message,
         });

         const statusCode =
            error instanceof ValidationError
               ? 400
               : error instanceof NotFoundError
                 ? 404
                 : error instanceof DuplicateError
                   ? 409
                   : 500;

         res.status(statusCode).json({
            success: false,
            error: error.message,
         });
      }
   }

   /**
    * Get setup step details
    */
   async getStepDetails(req, res) {
      try {
         const { trust_id, step_name } = req.params;

         if (!trust_id || isNaN(trust_id)) {
            throw new ValidationError('Valid trust ID is required');
         }

         if (!step_name) {
            throw new ValidationError('Step name is required');
         }

         const { SetupConfiguration } = require('../../../models');

         const step = await SetupConfiguration.findOne({
            where: {
               trust_id: parseInt(trust_id),
               step_name: step_name,
            },
         });

         if (!step) {
            throw new NotFoundError(`Setup step '${step_name}' not found for trust`);
         }

         res.status(200).json({
            success: true,
            data: {
               step: step,
               required_fields: this.setupService.getRequiredFields(step_name),
            },
         });
      } catch (error) {
         logger.error('Setup Controller Error', {
            service: 'setup-controller',
            category: 'ERROR',
            event: 'Get step details failed',
            error: error.message,
         });

         const statusCode = error instanceof ValidationError ? 400 : error instanceof NotFoundError ? 404 : 500;

         res.status(statusCode).json({
            success: false,
            error: error.message,
         });
      }
   }

   /**
    * Reset setup for a trust (development/testing only)
    */
   async resetSetup(req, res) {
      try {
         const { trust_id } = req.params;
         const systemUserId = req.user.id;

         if (!trust_id || isNaN(trust_id)) {
            throw new ValidationError('Valid trust ID is required');
         }

         const { SetupConfiguration, Trust } = require('../../../models');

         // Delete all setup configurations
         await SetupConfiguration.destroy({
            where: { trust_id: parseInt(trust_id) },
         });

         // Reset trust setup status
         await Trust.update(
            {
               setup_completed_at: null,
               is_active: false,
            },
            { where: { id: parseInt(trust_id) } }
         );

         logger.info('Setup Controller Event', {
            service: 'setup-controller',
            category: 'SETUP',
            event: 'Setup reset completed',
            trust_id: trust_id,
            system_user_id: systemUserId,
         });

         res.status(200).json({
            success: true,
            message: 'Setup reset successfully',
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
            error: error.message,
         });
      }
   }
}

module.exports = SetupController;
