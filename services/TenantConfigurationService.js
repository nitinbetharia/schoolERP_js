const { logger } = require('../utils/logger');

/**
 * Tenant Configuration Service
 * Manages tenant-specific configurations and custom fields
 * Acts as a bridge between system and tenant databases
 */
class TenantConfigurationService {
   constructor() {
      this.configCache = new Map();
      this.customFieldsCache = new Map();
      this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
   }

   /**
    * Get tenant configuration with caching
    */
   async getTenantConfiguration(trustId, systemDb) {
      const cacheKey = `config_${trustId}`;
      const cached = this.configCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
         return cached.data;
      }

      try {
         const TenantConfiguration = systemDb.models.TenantConfiguration;
         let config = await TenantConfiguration.findOne({
            where: { trust_id: trustId },
         });

         if (!config) {
            // Create default configuration
            config = await TenantConfiguration.create({
               trust_id: trustId,
               ...TenantConfiguration.getDefaultConfiguration(),
            });
            logger.info(`Created default configuration for trust ${trustId}`);
         }

         // Cache the configuration
         this.configCache.set(cacheKey, {
            data: config,
            timestamp: Date.now(),
         });

         return config;
      } catch (error) {
         logger.error('Error fetching tenant configuration:', error);
         throw error;
      }
   }

   /**
    * Get custom fields for an entity type with caching
    */
   async getCustomFields(trustId, entityType, systemDb) {
      const cacheKey = `fields_${trustId}_${entityType}`;
      const cached = this.customFieldsCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
         return cached.data;
      }

      try {
         const TenantCustomFields = systemDb.models.TenantCustomFields;
         const fields = await TenantCustomFields.getFieldsForEntity(trustId, entityType);

         // Cache the fields
         this.customFieldsCache.set(cacheKey, {
            data: fields,
            timestamp: Date.now(),
         });

         return fields;
      } catch (error) {
         logger.error(`Error fetching custom fields for ${entityType}:`, error);
         throw error;
      }
   }

   /**
    * Get grouped custom fields for form rendering
    */
   async getGroupedCustomFields(trustId, entityType, systemDb) {
      const fields = await this.getCustomFields(trustId, entityType, systemDb);
      const grouped = {};

      fields.forEach((field) => {
         const displayOptions = field.getDisplayOptions();
         const group = displayOptions.group || 'Additional Information';

         if (!grouped[group]) {
            grouped[group] = [];
         }
         grouped[group].push({
            ...field.toJSON(),
            displayOptions,
         });
      });

      return grouped;
   }

   /**
    * Validate custom field values against field definitions
    */
   async validateCustomFieldValues(trustId, entityType, fieldValues, systemDb) {
      const fields = await this.getCustomFields(trustId, entityType, systemDb);
      const errors = {};

      for (const field of fields) {
         const fieldName = field.field_name;
         const fieldValue = fieldValues[fieldName];
         const validationRules = field.getValidationRules();

         // Check if required
         const isEmpty = fieldValue === null || fieldValue === undefined || fieldValue === '';
         if (validationRules.required && isEmpty) {
            errors[fieldName] = `${field.field_label} is required`;
            continue;
         }

         // Skip further validation if field is empty and not required
         if (fieldValue === null || fieldValue === undefined || fieldValue === '') {
            continue;
         }

         // Type-specific validation
         const typeErrors = this.validateFieldType(field, fieldValue);
         if (typeErrors) {
            errors[fieldName] = typeErrors;
         }

         // Custom validation rules
         const customErrors = this.validateCustomRules(field, fieldValue);
         if (customErrors) {
            errors[fieldName] = customErrors;
         }
      }

      return errors;
   }

   /**
    * Validate field value against its type
    */
   validateFieldType(field, value) {
      switch (field.field_type) {
         case 'number':
            if (isNaN(value)) {
               return `${field.field_label} must be a valid number`;
            }
            const numOptions = field.getFieldOptions();
            if (numOptions.min_value !== undefined && parseFloat(value) < numOptions.min_value) {
               return `${field.field_label} must be at least ${numOptions.min_value}`;
            }
            if (numOptions.max_value !== undefined && parseFloat(value) > numOptions.max_value) {
               return `${field.field_label} must be at most ${numOptions.max_value}`;
            }
            break;

         case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
               return `${field.field_label} must be a valid email address`;
            }
            break;

         case 'phone':
            const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/;
            if (!phoneRegex.test(value)) {
               return `${field.field_label} must be a valid phone number`;
            }
            break;

         case 'url':
            try {
               new URL(value);
            } catch {
               return `${field.field_label} must be a valid URL`;
            }
            break;

         case 'date':
         case 'datetime':
            const date = new Date(value);
            if (isNaN(date.getTime())) {
               return `${field.field_label} must be a valid date`;
            }
            const dateOptions = field.getFieldOptions();
            if (dateOptions.min_date && date < new Date(dateOptions.min_date)) {
               return `${field.field_label} must be after ${dateOptions.min_date}`;
            }
            if (dateOptions.max_date && date > new Date(dateOptions.max_date)) {
               return `${field.field_label} must be before ${dateOptions.max_date}`;
            }
            break;

         case 'text':
         case 'textarea':
            const textOptions = field.getFieldOptions();
            if (textOptions.min_length !== undefined && value.length < textOptions.min_length) {
               return `${field.field_label} must be at least ${textOptions.min_length} characters`;
            }
            if (textOptions.max_length !== undefined && value.length > textOptions.max_length) {
               return `${field.field_label} must be at most ${textOptions.max_length} characters`;
            }
            if (textOptions.pattern) {
               const regex = new RegExp(textOptions.pattern);
               if (!regex.test(value)) {
                  return `${field.field_label} format is invalid`;
               }
            }
            break;

         case 'dropdown':
            const dropdownOptions = field.getFieldOptions();
            if (dropdownOptions.options && Array.isArray(dropdownOptions.options)) {
               const validOptions = dropdownOptions.options;
               if (Array.isArray(value)) {
                  // Multiple selection
                  const invalidValues = value.filter((v) => !validOptions.includes(v));
                  if (invalidValues.length > 0) {
                     const invalidStr = invalidValues.join(', ');
                     return `${field.field_label} contains invalid options: ${invalidStr}`;
                  }
               } else {
                  // Single selection
                  if (!validOptions.includes(value)) {
                     return `${field.field_label} must be one of: ${validOptions.join(', ')}`;
                  }
               }
            }
            break;
      }

      return null;
   }

   /**
    * Validate custom validation rules
    */
   validateCustomRules(field, value) {
      const validationRules = field.getValidationRules();

      if (validationRules.custom_validation) {
         try {
            const regex = new RegExp(validationRules.custom_validation);
            if (!regex.test(value)) {
               return `${field.field_label} format is invalid`;
            }
         } catch (error) {
            logger.warn(`Invalid regex pattern for field ${field.field_name}:`, error);
         }
      }

      return null;
   }

   /**
    * Generate form schema for frontend
    */
   async generateFormSchema(trustId, entityType, systemDb) {
      const config = await this.getTenantConfiguration(trustId, systemDb);
      const customFields = await this.getGroupedCustomFields(trustId, entityType, systemDb);

      const schema = {
         entity_type: entityType,
         tenant_config: this.extractRelevantConfig(config, entityType),
         custom_field_groups: customFields,
         validation_rules: this.extractValidationRules(config, entityType),
      };

      return schema;
   }

   /**
    * Extract relevant configuration for specific entity type
    */
   extractRelevantConfig(config, entityType) {
      switch (entityType) {
         case 'student':
            return {
               admission_number_format: config.student_config?.admission_number_format,
               roll_number_format: config.student_config?.roll_number_format,
               required_documents: config.student_config?.required_documents,
               parent_info_requirements: config.student_config?.parent_info_requirements,
               medical_info_requirements: config.student_config?.medical_info_requirements,
            };
         case 'school':
            return {
               max_schools_allowed: config.school_config?.max_schools_allowed,
               school_types_allowed: config.school_config?.school_types_allowed,
               boards_supported: config.school_config?.boards_supported,
               facilities_master: config.school_config?.facilities_master,
            };
         default:
            return {};
      }
   }

   /**
    * Extract validation rules for specific entity type
    */
   extractValidationRules(config, entityType) {
      const rules = config.validation_rules || {};

      switch (entityType) {
         case 'student':
            return rules.student_validation || {};
         case 'school':
            return rules.school_validation || {};
         default:
            return {};
      }
   }

   /**
    * Clear cache for a specific trust
    */
   clearCache(trustId) {
      const configKey = `config_${trustId}`;
      const fieldsKeyPrefix = `fields_${trustId}_`;

      this.configCache.delete(configKey);

      // Clear all custom fields cache for this trust
      for (const key of this.customFieldsCache.keys()) {
         if (key.startsWith(fieldsKeyPrefix)) {
            this.customFieldsCache.delete(key);
         }
      }

      logger.info(`Cleared configuration cache for trust ${trustId}`);
   }

   /**
    * Clear all caches
    */
   clearAllCache() {
      this.configCache.clear();
      this.customFieldsCache.clear();
      logger.info('Cleared all configuration caches');
   }
}

// Export singleton instance
module.exports = new TenantConfigurationService();
