const FeeManagementService = require('../../../services/FeeManagementService');
const { logger } = require('../../../utils/logger');

/**
 * Fee Configuration Controller
 * Handles all fee configuration operations in the system database
 */
class FeeConfigurationController {
   /**
    * List all fee configurations for a trust
    */
   static async listFeeConfigurations(req, res) {
      try {
         const { trust_id } = req.query;
         const systemDb = req.systemDb;

         const whereClause = {};
         if (trust_id) {
            whereClause.trust_id = trust_id;
         }

         const FeeConfiguration = systemDb.models.FeeConfiguration;
         const configurations = await FeeConfiguration.findAll({
            where: whereClause,
            order: [['created_at', 'DESC']],
            include: [
               {
                  model: systemDb.models.Trust,
                  attributes: ['name', 'code'],
               },
            ],
         });

         res.json({
            success: true,
            data: configurations,
            total: configurations.length,
         });
      } catch (error) {
         logger.error('Error listing fee configurations:', error);
         res.status(500).json({
            success: false,
            message: 'Failed to list fee configurations',
            error: error.message,
         });
      }
   }

   /**
    * Get a specific fee configuration
    */
   static async getFeeConfiguration(req, res) {
      try {
         const { id } = req.params;
         const systemDb = req.systemDb;

         const configuration = await FeeManagementService.getFeeConfiguration(id, systemDb);

         if (!configuration) {
            return res.status(404).json({
               success: false,
               message: 'Fee configuration not found',
            });
         }

         res.json({
            success: true,
            data: configuration,
         });
      } catch (error) {
         logger.error('Error fetching fee configuration:', error);
         res.status(500).json({
            success: false,
            message: 'Failed to fetch fee configuration',
            error: error.message,
         });
      }
   }

   /**
    * Create a new fee configuration
    */
   static async createFeeConfiguration(req, res) {
      try {
         const systemDb = req.systemDb;
         const FeeConfiguration = systemDb.models.FeeConfiguration;

         const configurationData = {
            ...req.body,
            created_by: req.user.id,
            last_updated_by: req.user.id,
         };

         const configuration = await FeeConfiguration.create(configurationData);

         // Clear cache for this fee configuration
         FeeManagementService.clearCache();

         logger.info(`Fee configuration created: ${configuration.id} by user ${req.user.id}`);

         res.status(201).json({
            success: true,
            message: 'Fee configuration created successfully',
            data: configuration,
         });
      } catch (error) {
         logger.error('Error creating fee configuration:', error);
         res.status(500).json({
            success: false,
            message: 'Failed to create fee configuration',
            error: error.message,
         });
      }
   }

   /**
    * Update an existing fee configuration
    */
   static async updateFeeConfiguration(req, res) {
      try {
         const { id } = req.params;
         const systemDb = req.systemDb;
         const FeeConfiguration = systemDb.models.FeeConfiguration;

         const configuration = await FeeConfiguration.findByPk(id);

         if (!configuration) {
            return res.status(404).json({
               success: false,
               message: 'Fee configuration not found',
            });
         }

         const updateData = {
            ...req.body,
            last_updated_by: req.user.id,
            version: configuration.version + 1,
         };

         await configuration.update(updateData);

         // Clear cache for this fee configuration
         FeeManagementService.clearCache();

         logger.info(`Fee configuration updated: ${id} by user ${req.user.id}`);

         res.json({
            success: true,
            message: 'Fee configuration updated successfully',
            data: configuration,
         });
      } catch (error) {
         logger.error('Error updating fee configuration:', error);
         res.status(500).json({
            success: false,
            message: 'Failed to update fee configuration',
            error: error.message,
         });
      }
   }

   /**
    * Delete a fee configuration
    */
   static async deleteFeeConfiguration(req, res) {
      try {
         const { id } = req.params;
         const systemDb = req.systemDb;
         const FeeConfiguration = systemDb.models.FeeConfiguration;

         const configuration = await FeeConfiguration.findByPk(id);

         if (!configuration) {
            return res.status(404).json({
               success: false,
               message: 'Fee configuration not found',
            });
         }

         // Check if this configuration is being used by any students
         const tenantDb = req.tenantDb;
         const StudentFeeAssignment = tenantDb.models.StudentFeeAssignment;

         const assignmentCount = await StudentFeeAssignment.count({
            where: { fee_configuration_id: id },
         });

         if (assignmentCount > 0) {
            return res.status(400).json({
               success: false,
               message: 'Cannot delete fee configuration. ' + `It is assigned to ${assignmentCount} students.`,
            });
         }

         await configuration.destroy();

         // Clear cache
         FeeManagementService.clearCache();

         logger.info(`Fee configuration deleted: ${id} by user ${req.user.id}`);

         res.json({
            success: true,
            message: 'Fee configuration deleted successfully',
         });
      } catch (error) {
         logger.error('Error deleting fee configuration:', error);
         res.status(500).json({
            success: false,
            message: 'Failed to delete fee configuration',
            error: error.message,
         });
      }
   }

   /**
    * Calculate fees for a student profile
    */
   static async calculateFeesForProfile(req, res) {
      try {
         const { fee_configuration_id } = req.params;
         const { student_profile } = req.body;
         const systemDb = req.systemDb;

         const configuration = await FeeManagementService.getFeeConfiguration(fee_configuration_id, systemDb);

         if (!configuration) {
            return res.status(404).json({
               success: false,
               message: 'Fee configuration not found',
            });
         }

         // Get applicable discounts
         const applicableDiscounts = configuration.getApplicableDiscounts(student_profile);

         // Calculate total annual fee
         const totalAnnualFee = configuration.calculateTotalAnnualFee();

         // Calculate fee components
         const feeComponents = configuration.getFeeComponents();

         res.json({
            success: true,
            data: {
               fee_configuration_id,
               total_annual_fee: totalAnnualFee,
               fee_components: feeComponents,
               applicable_discounts: applicableDiscounts,
               student_profile,
            },
         });
      } catch (error) {
         logger.error('Error calculating fees for profile:', error);
         res.status(500).json({
            success: false,
            message: 'Failed to calculate fees',
            error: error.message,
         });
      }
   }

   /**
    * Clone an existing fee configuration
    */
   static async cloneFeeConfiguration(req, res) {
      try {
         const { id } = req.params;
         const systemDb = req.systemDb;
         const FeeConfiguration = systemDb.models.FeeConfiguration;

         const originalConfig = await FeeConfiguration.findByPk(id);

         if (!originalConfig) {
            return res.status(404).json({
               success: false,
               message: 'Fee configuration not found',
            });
         }

         // Create a clone with modified name
         const cloneData = originalConfig.toJSON();
         delete cloneData.id;
         delete cloneData.created_at;
         delete cloneData.updated_at;

         cloneData.name = `${cloneData.name} (Copy)`;
         cloneData.is_active = false; // Clones are inactive by default
         cloneData.created_by = req.user.id;
         cloneData.last_updated_by = req.user.id;
         cloneData.version = 1;

         const clonedConfig = await FeeConfiguration.create(cloneData);

         logger.info(`Fee configuration cloned: ${id} -> ${clonedConfig.id} by user ${req.user.id}`);

         res.status(201).json({
            success: true,
            message: 'Fee configuration cloned successfully',
            data: clonedConfig,
         });
      } catch (error) {
         logger.error('Error cloning fee configuration:', error);
         res.status(500).json({
            success: false,
            message: 'Failed to clone fee configuration',
            error: error.message,
         });
      }
   }
}

module.exports = FeeConfigurationController;
