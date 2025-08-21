const logger = require('../../../utils/logger');
const { ErrorFactory, ValidationError, NotFoundError, DuplicateError } = require('../../../utils/errors');

/**
 * Setup Service
 * Handles trust setup workflow management
 */
function createSetupService() {
   const setupSteps = [
      {
         name: 'trust_info',
         order: 1,
         title: 'Trust Information',
         description: 'Basic trust details and configuration',
      },
      {
         name: 'academic_year',
         order: 2,
         title: 'Academic Year',
         description: 'Set up academic year configuration',
      },
      {
         name: 'schools_basic',
         order: 3,
         title: 'Schools Basic Info',
         description: 'Add basic school information',
      },
      {
         name: 'user_roles',
         order: 4,
         title: 'User Roles',
         description: 'Configure user roles and permissions',
      },
      {
         name: 'system_users',
         order: 5,
         title: 'System Users',
         description: 'Create initial system users',
      },
      {
         name: 'school_structure',
         order: 6,
         title: 'School Structure',
         description: 'Set up classes and sections',
      },
      {
         name: 'finalization',
         order: 7,
         title: 'Finalization',
         description: 'Complete setup and activate trust',
      },
   ];

   /**
    * Initialize setup for a trust
    */
   async function initializeSetup(trustId) {
      try {
         const { getTenantModels } = require('../../../models');
         const models = await getTenantModels('system'); // Use system models for setup configuration
         const { SetupConfiguration } = models;

         // Check if setup already exists
         const existingSetup = await SetupConfiguration.findOne({
            where: { trust_id: trustId },
         });

         if (existingSetup) {
            throw ErrorFactory.createError('ConflictError', 'Setup already initialized for this trust');
         }

         // Create initial setup configuration
         const setupConfig = await SetupConfiguration.create({
            trust_id: trustId,
            current_step: 'trust_info',
            steps_completed: [],
            is_completed: false,
            configuration_data: {},
         });

         logger.info('Setup Service Info', {
            service: 'setup-service',
            category: 'INITIALIZATION',
            event: 'Setup initialized successfully',
            trust_id: trustId,
         });

         return setupConfig;
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
   async function getSetupProgress(trustId) {
      try {
         const { getTenantModels } = require('../../../models');
         const models = await getTenantModels('system');
         const { SetupConfiguration } = models;

         const setupConfig = await SetupConfiguration.findOne({
            where: { trust_id: trustId },
         });

         if (!setupConfig) {
            return {
               is_initialized: false,
               total_steps: setupSteps.length,
               completed_steps: 0,
               progress_percentage: 0,
               current_step: null,
               steps: [],
            };
         }

         const completedSteps = setupConfig.steps_completed || [];
         const progressPercentage = Math.round((completedSteps.length / setupSteps.length) * 100);

         return {
            is_initialized: true,
            total_steps: setupSteps.length,
            completed_steps: completedSteps.length,
            progress_percentage: progressPercentage,
            current_step: setupConfig.current_step,
            steps: setupSteps.map((step) => ({
               ...step,
               completed: completedSteps.includes(step.name),
               is_current: step.name === setupConfig.current_step,
            })),
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
   async function completeStep(trustId, stepName, stepData, systemUserId) {
      try {
         const { getTenantModels } = require('../../../models');
         const models = await getTenantModels('system');
         const { SetupConfiguration } = models;

         const setupConfig = await SetupConfiguration.findOne({
            where: { trust_id: trustId },
         });

         if (!setupConfig) {
            throw ErrorFactory.createError('NotFoundError', `Setup configuration not found for trust: ${trustId}`);
         }

         // Validate step exists
         const step = setupSteps.find((s) => s.name === stepName);
         if (!step) {
            throw ErrorFactory.createError('NotFoundError', `Setup step '${stepName}' not found`);
         }

         // Check if step already completed
         const completedSteps = setupConfig.steps_completed || [];
         if (completedSteps.includes(stepName)) {
            throw ErrorFactory.createError('ConflictError', `Setup step '${stepName}' already completed`);
         }

         // Validate step data
         const validationErrors = this.validateStepData(stepName, stepData);
         if (validationErrors.length > 0) {
            throw ErrorFactory.createError('ValidationError', 'Step validation failed', { validationErrors });
         }

         // Update setup configuration
         completedSteps.push(stepName);
         setupConfig.steps_completed = completedSteps;
         setupConfig.configuration_data = {
            ...setupConfig.configuration_data,
            [stepName]: stepData,
         };

         // Determine next step
         const nextStep = setupSteps.find((s) => s.order === step.order + 1);
         setupConfig.current_step = nextStep ? nextStep.name : null;

         // Check if all steps completed
         if (completedSteps.length === setupSteps.length) {
            setupConfig.is_completed = true;
            await this.finalizeSetup(trustId, systemUserId);
         }

         await setupConfig.save();

         logger.info('Setup Service Info', {
            service: 'setup-service',
            category: 'STEP_COMPLETION',
            event: 'Setup step completed successfully',
            trust_id: trustId,
            step_name: stepName,
         });

         return setupConfig;
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
    * Finalize setup (activate trust)
    */
   async function finalizeSetup(trustId, systemUserId) {
      try {
         const { getTrustModel } = require('../../../models');
         const Trust = await getTrustModel();

         const trust = await Trust.findByPk(trustId);
         if (!trust) {
            throw ErrorFactory.createError('NotFoundError', `Trust not found: ${trustId}`);
         }

         await trust.markSetupComplete();

         logger.info('Setup Service Info', {
            service: 'setup-service',
            category: 'FINALIZATION',
            event: 'Setup finalized successfully',
            trust_id: trustId,
         });

         return trust;
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
    * Get required fields for a step
    */
   function getRequiredFields(stepName) {
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
    * Validate step data
    */
   function validateStepData(stepName, data) {
      const errors = [];
      const requiredFields = this.getRequiredFields(stepName);

      requiredFields.forEach((field) => {
         if (!data || !data[field]) {
            errors.push(`Field '${field}' is required for step '${stepName}'`);
         }
      });

      // Additional step-specific validation
      switch (stepName) {
         case 'trust_info':
            if (data.contact_email && !this.isValidEmail(data.contact_email)) {
               errors.push('Invalid email format');
            }
            break;
         case 'academic_year':
            if (data.start_date && data.end_date && new Date(data.start_date) >= new Date(data.end_date)) {
               errors.push('End date must be after start date');
            }
            break;
      }

      return errors;
   }

   /**
    * Validate email format
    */
   function isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
   }

   /**
    * Get step details
    */
   async function getStepDetails(trustId, stepName) {
      try {
         const { getTenantModels } = require('../../../models');
         const models = await getTenantModels('system');
         const { SetupConfiguration } = models;

         const setupConfig = await SetupConfiguration.findOne({
            where: { trust_id: trustId },
         });

         const step = setupSteps.find((s) => s.name === stepName);
         if (!step) {
            throw ErrorFactory.createError('NotFoundError', `Setup step '${stepName}' not found`);
         }

         return {
            ...step,
            required_fields: this.getRequiredFields(stepName),
            current_data: setupConfig?.configuration_data?.[stepName] || {},
            completed: setupConfig?.steps_completed?.includes(stepName) || false,
         };
      } catch (error) {
         logger.error('Setup Service Error', {
            service: 'setup-service',
            category: 'ERROR',
            event: 'Failed to get step details',
            trust_id: trustId,
            step_name: stepName,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Reset setup for a trust
    */
   async function resetSetup(trustId) {
      try {
         const { getTenantModels } = require('../../../models');
         const models = await getTenantModels('system');
         const { SetupConfiguration } = models;

         await SetupConfiguration.destroy({
            where: { trust_id: trustId },
         });

         logger.info('Setup Service Info', {
            service: 'setup-service',
            category: 'RESET',
            event: 'Setup reset successfully',
            trust_id: trustId,
         });

         return { success: true };
      } catch (error) {
         logger.error('Setup Service Error', {
            service: 'setup-service',
            category: 'ERROR',
            event: 'Failed to reset setup',
            trust_id: trustId,
            error: error.message,
         });
         throw error;
      }
   }

   return {
      initializeSetup,
      getSetupProgress,
      completeStep,
      finalizeSetup,
      getRequiredFields,
      validateStepData,
      isValidEmail,
      getStepDetails,
      resetSetup,
   };
}

module.exports = createSetupService;
