const logger = require('../../../utils/logger');
const { ValidationError, NotFoundError, DuplicateError } = require('../../../utils/errors');

/**
 * Setup Service
 * Handles trust setup workflow management
 */
class SetupService {
   constructor() {
      this.setupSteps = [
         {
            name: 'trust_info',
            order: 1,
            title: 'Trust Information',
            description: 'Basic trust details and configuration',
         },
         {
            name: 'academic_year',
            order: 2,
            title: 'Academic Year Setup',
            description: 'Configure academic calendar and sessions',
         },
         { name: 'schools_basic', order: 3, title: 'Schools Basic Info', description: 'Add schools under this trust' },
         { name: 'user_roles', order: 4, title: 'User Roles & Permissions', description: 'Configure RBAC system' },
         { name: 'system_users', order: 5, title: 'System Users', description: 'Create initial administrative users' },
         {
            name: 'school_structure',
            order: 6,
            title: 'School Structure',
            description: 'Configure classes, sections, and academic structure',
         },
         {
            name: 'finalization',
            order: 7,
            title: 'Setup Finalization',
            description: 'Complete setup and activate system',
         },
      ];
   }

   /**
    * Initialize setup configuration for a trust
    */
   async initializeSetup(trustId, systemUserId) {
      try {
         const { SetupConfiguration } = require('../../../models');

         // Check if setup already initialized
         const existingSetup = await SetupConfiguration.findOne({
            where: { trust_id: trustId },
         });

         if (existingSetup) {
            throw new DuplicateError('Setup already initialized for this trust');
         }

         // Create setup steps
         const setupRecords = this.setupSteps.map((step) => ({
            trust_id: trustId,
            step_name: step.name,
            step_order: step.order,
            is_completed: false,
            configuration_data: {
               title: step.title,
               description: step.description,
               required_fields: this.getRequiredFields(step.name),
            },
         }));

         const createdSteps = await SetupConfiguration.bulkCreate(setupRecords);

         logger.info('Setup Service Event', {
            service: 'setup-service',
            category: 'SETUP',
            event: 'Setup initialized successfully',
            trust_id: trustId,
            system_user_id: systemUserId,
            steps_created: createdSteps.length,
         });

         return {
            message: 'Setup initialized successfully',
            steps: createdSteps,
            total_steps: this.setupSteps.length,
         };
      } catch (error) {
         logger.error('Setup Service Error', {
            service: 'setup-service',
            category: 'ERROR',
            event: 'Failed to initialize setup',
            trust_id: trustId,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Get setup progress for a trust
    */
   async getSetupProgress(trustId) {
      try {
         const { SetupConfiguration } = require('../../../models');

         const setupSteps = await SetupConfiguration.findAll({
            where: { trust_id: trustId },
            order: [['step_order', 'ASC']],
         });

         if (setupSteps.length === 0) {
            return {
               is_initialized: false,
               total_steps: this.setupSteps.length,
               completed_steps: 0,
               progress_percentage: 0,
               current_step: null,
               steps: [],
            };
         }

         const completedSteps = setupSteps.filter((step) => step.is_completed);
         const currentStep = setupSteps.find((step) => !step.is_completed);

         return {
            is_initialized: true,
            total_steps: setupSteps.length,
            completed_steps: completedSteps.length,
            progress_percentage: Math.round((completedSteps.length / setupSteps.length) * 100),
            current_step: currentStep || null,
            steps: setupSteps,
         };
      } catch (error) {
         logger.error('Setup Service Error', {
            service: 'setup-service',
            category: 'ERROR',
            event: 'Failed to get setup progress',
            trust_id: trustId,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Complete a setup step
    */
   async completeStep(trustId, stepName, configurationData, systemUserId) {
      try {
         const { SetupConfiguration } = require('../../../models');

         const setupStep = await SetupConfiguration.findOne({
            where: {
               trust_id: trustId,
               step_name: stepName,
            },
         });

         if (!setupStep) {
            throw new NotFoundError(`Setup step '${stepName}' not found for trust`);
         }

         if (setupStep.is_completed) {
            throw new DuplicateError(`Setup step '${stepName}' is already completed`);
         }

         // Validate configuration data
         const validationErrors = this.validateStepData(stepName, configurationData);
         if (validationErrors.length > 0) {
            throw new ValidationError('Setup step validation failed', { validationErrors });
         }

         // Update step as completed
         await setupStep.update({
            is_completed: true,
            completed_by: systemUserId,
            completed_at: new Date(),
            configuration_data: {
               ...setupStep.configuration_data,
               ...configurationData,
            },
            validation_errors: null,
         });

         // Check if all steps are completed
         const allSteps = await SetupConfiguration.findAll({
            where: { trust_id: trustId },
         });

         const allCompleted = allSteps.every((step) => step.is_completed);

         if (allCompleted) {
            await this.finalizeSetup(trustId, systemUserId);
         }

         logger.info('Setup Service Event', {
            service: 'setup-service',
            category: 'SETUP',
            event: 'Setup step completed',
            trust_id: trustId,
            step_name: stepName,
            system_user_id: systemUserId,
            all_completed: allCompleted,
         });

         return {
            message: `Setup step '${stepName}' completed successfully`,
            step: setupStep,
            all_completed: allCompleted,
         };
      } catch (error) {
         logger.error('Setup Service Error', {
            service: 'setup-service',
            category: 'ERROR',
            event: 'Failed to complete setup step',
            trust_id: trustId,
            step_name: stepName,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Finalize setup process
    */
   async finalizeSetup(trustId, systemUserId) {
      try {
         const { Trust } = require('../../../models');

         await Trust.update(
            {
               setup_completed_at: new Date(),
               is_active: true,
            },
            { where: { id: trustId } }
         );

         logger.info('Setup Service Event', {
            service: 'setup-service',
            category: 'SETUP',
            event: 'Setup finalized successfully',
            trust_id: trustId,
            system_user_id: systemUserId,
         });
      } catch (error) {
         logger.error('Setup Service Error', {
            service: 'setup-service',
            category: 'ERROR',
            event: 'Failed to finalize setup',
            trust_id: trustId,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Get required fields for each setup step
    */
   getRequiredFields(stepName) {
      const fieldMappings = {
         trust_info: ['name', 'code', 'address', 'contact_email', 'contact_phone'],
         academic_year: ['year', 'start_date', 'end_date', 'terms'],
         schools_basic: ['schools'],
         user_roles: ['roles', 'permissions'],
         system_users: ['users'],
         school_structure: ['classes', 'sections'],
         finalization: ['confirmation'],
      };

      return fieldMappings[stepName] || [];
   }

   /**
    * Validate step configuration data
    */
   validateStepData(stepName, data) {
      const errors = [];
      const requiredFields = this.getRequiredFields(stepName);

      requiredFields.forEach((field) => {
         if (!data || !data[field]) {
            errors.push(`Field '${field}' is required for step '${stepName}'`);
         }
      });

      // Add specific validations per step
      switch (stepName) {
         case 'trust_info':
            if (data.contact_email && !this.isValidEmail(data.contact_email)) {
               errors.push('Invalid email format');
            }
            break;
         case 'academic_year':
            if (data.start_date && data.end_date && new Date(data.start_date) >= new Date(data.end_date)) {
               errors.push('Start date must be before end date');
            }
            break;
      }

      return errors;
   }

   /**
    * Email validation helper
    */
   isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
   }
}

module.exports = SetupService;
