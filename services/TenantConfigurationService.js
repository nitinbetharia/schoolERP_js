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

   /**
    * Get configurable modules for tenant management
    */
   async getConfigurableModules() {
      return [
         {
            id: 'student_management',
            name: 'Student Management',
            description: 'Student enrollment, numbering, and validation settings',
            icon: 'fas fa-user-graduate',
            categories: ['numbering', 'validation', 'custom_fields'],
         },
         {
            id: 'academic_settings',
            name: 'Academic Settings',
            description: 'Grading system, subjects, and academic year configuration',
            icon: 'fas fa-graduation-cap',
            categories: ['grading', 'subjects', 'calendar'],
         },
         {
            id: 'school_management',
            name: 'School Management',
            description: 'School capacity, types, and facilities configuration',
            icon: 'fas fa-school',
            categories: ['capacity', 'facilities', 'structure'],
         },
         {
            id: 'system_preferences',
            name: 'System Preferences',
            description: 'Locale, notifications, and backup settings',
            icon: 'fas fa-cog',
            categories: ['locale', 'notifications', 'backup'],
         },
         {
            id: 'feature_flags',
            name: 'Feature Flags',
            description: 'Module and feature availability controls',
            icon: 'fas fa-toggle-on',
            categories: ['modules', 'advanced', 'compliance'],
         },
      ];
   }

   /**
    * Get configuration schema for a specific module
    */
   async getModuleSchema(module) {
      const schemas = {
         student_management: {
            numbering: {
               admission_number_format: {
                  type: 'text',
                  label: 'Admission Number Format',
                  description: 'Format for student admission numbers (e.g., ADM-{YYYY}-{####})',
                  immutable_after_activation: true,
                  default: 'ADM-{YYYY}-{####}',
               },
               roll_number_format: {
                  type: 'text',
                  label: 'Roll Number Format',
                  description: 'Format for student roll numbers',
                  immutable_after_activation: true,
                  default: '{CLASS}-{##}',
               },
            },
            validation: {
               admission_number_unique_across: {
                  type: 'select',
                  label: 'Admission Number Uniqueness',
                  options: [
                     { value: 'trust', label: 'Across Trust' },
                     { value: 'school', label: 'Within School' },
                  ],
                  high_impact: true,
                  default: 'school',
               },
               age_limits: {
                  min_age_years: {
                     type: 'number',
                     label: 'Minimum Age (Years)',
                     min: 2,
                     max: 25,
                     default: 3,
                  },
                  max_age_years: {
                     type: 'number',
                     label: 'Maximum Age (Years)',
                     min: 5,
                     max: 30,
                     default: 18,
                  },
               },
            },
         },
         academic_settings: {
            grading: {
               grading_system: {
                  type: 'select',
                  label: 'Grading System',
                  options: [
                     { value: 'percentage', label: 'Percentage (0-100)' },
                     { value: 'grade', label: 'Letter Grade (A-F)' },
                     { value: 'points', label: 'Points System' },
                  ],
                  immutable_after_activation: true,
                  default: 'percentage',
               },
               passing_marks_percentage: {
                  type: 'number',
                  label: 'Passing Marks (%)',
                  min: 30,
                  max: 60,
                  default: 40,
               },
            },
            subjects: {
               core_subjects_mandatory: {
                  type: 'checkbox',
                  label: 'Core Subjects Mandatory',
                  description: 'Require core subjects for all students',
                  default: true,
               },
               max_subjects_per_class: {
                  type: 'number',
                  label: 'Maximum Subjects per Class',
                  min: 5,
                  max: 15,
                  default: 8,
               },
            },
         },
         school_management: {
            capacity: {
               max_schools_allowed: {
                  type: 'number',
                  label: 'Maximum Schools Allowed',
                  description: 'Maximum number of schools in this trust',
                  min: 1,
                  max: 100,
                  high_impact: true,
                  default: 5,
               },
            },
            structure: {
               class_structure: {
                  type: 'multiselect',
                  label: 'Supported Classes',
                  options: [
                     { value: 'nursery', label: 'Nursery' },
                     { value: 'lkg', label: 'LKG' },
                     { value: 'ukg', label: 'UKG' },
                     { value: '1', label: 'Class 1' },
                     { value: '2', label: 'Class 2' },
                     { value: '3', label: 'Class 3' },
                     { value: '4', label: 'Class 4' },
                     { value: '5', label: 'Class 5' },
                     { value: '6', label: 'Class 6' },
                     { value: '7', label: 'Class 7' },
                     { value: '8', label: 'Class 8' },
                     { value: '9', label: 'Class 9' },
                     { value: '10', label: 'Class 10' },
                     { value: '11', label: 'Class 11' },
                     { value: '12', label: 'Class 12' },
                  ],
                  high_impact: true,
                  default: ['1', '2', '3', '4', '5'],
               },
            },
         },
         system_preferences: {
            locale: {
               timezone: {
                  type: 'select',
                  label: 'Timezone',
                  options: [
                     { value: 'Asia/Kolkata', label: 'India Standard Time' },
                     { value: 'Asia/Dubai', label: 'UAE Time' },
                     { value: 'UTC', label: 'UTC' },
                  ],
                  default: 'Asia/Kolkata',
               },
               currency: {
                  type: 'select',
                  label: 'Currency',
                  options: [
                     { value: 'INR', label: 'Indian Rupee (₹)' },
                     { value: 'USD', label: 'US Dollar ($)' },
                     { value: 'AED', label: 'UAE Dirham (AED)' },
                  ],
                  immutable_after_activation: true,
                  default: 'INR',
               },
            },
            notifications: {
               email_notifications: {
                  type: 'checkbox',
                  label: 'Email Notifications',
                  default: true,
               },
               sms_notifications: {
                  type: 'checkbox',
                  label: 'SMS Notifications',
                  default: false,
               },
            },
         },
         feature_flags: {
            modules: {
               student_management: {
                  type: 'checkbox',
                  label: 'Student Management Module',
                  description: 'Enable student registration and management',
                  default: true,
               },
               fee_management: {
                  type: 'checkbox',
                  label: 'Fee Management Module',
                  description: 'Enable fee collection and tracking',
                  default: true,
               },
               examination_system: {
                  type: 'checkbox',
                  label: 'Examination System',
                  description: 'Enable exams and grade management',
                  high_impact: true,
                  default: false,
               },
            },
            advanced: {
               custom_fields: {
                  type: 'checkbox',
                  label: 'Custom Fields',
                  description: 'Allow custom field creation',
                  default: false,
               },
               api_access: {
                  type: 'checkbox',
                  label: 'API Access',
                  description: 'Enable REST API access',
                  default: false,
               },
            },
         },
      };

      return schemas[module] || {};
   }

   /**
    * Validate configuration changes
    */
   async validateConfigChange(trustId, module, configData, isActive) {
      const schema = await this.getModuleSchema(module);
      const currentConfig = await this.getTenantConfiguration(trustId);

      const result = {
         isValid: true,
         errors: [],
         warnings: [],
         requiresConfirmation: false,
      };

      // Check immutable fields
      if (isActive) {
         const immutableViolations = this.checkImmutableFields(schema, currentConfig, configData, module);
         if (immutableViolations.length > 0) {
            result.isValid = false;
            result.errors.push(...immutableViolations);
         }
      }

      // Check high-impact changes
      const highImpactChanges = this.checkHighImpactFields(schema, currentConfig, configData, module);
      if (highImpactChanges.length > 0) {
         result.requiresConfirmation = true;
         result.warnings.push(...highImpactChanges);
      }

      // Validate field constraints
      const constraintViolations = this.validateFieldConstraints(schema, configData);
      if (constraintViolations.length > 0) {
         result.isValid = false;
         result.errors.push(...constraintViolations);
      }

      return result;
   }

   /**
    * Check for immutable field violations
    */
   checkImmutableFields(schema, currentConfig, newConfig, module) {
      const violations = [];

      const checkFields = (schemaObj, configPath = '') => {
         for (const [key, fieldSchema] of Object.entries(schemaObj)) {
            const fullPath = configPath ? `${configPath}.${key}` : key;

            if (fieldSchema.immutable_after_activation) {
               const currentValue = this.getNestedValue(currentConfig, `${module}.${fullPath}`);
               const newValue = this.getNestedValue(newConfig, fullPath);

               if (currentValue !== undefined && currentValue !== newValue) {
                  violations.push(`${fieldSchema.label || key} cannot be changed after tenant activation`);
               }
            } else if (typeof fieldSchema === 'object' && !fieldSchema.type) {
               checkFields(fieldSchema, fullPath);
            }
         }
      };

      checkFields(schema);
      return violations;
   }

   /**
    * Check for high-impact field changes
    */
   checkHighImpactFields(schema, currentConfig, newConfig, module) {
      const warnings = [];

      const checkFields = (schemaObj, configPath = '') => {
         for (const [key, fieldSchema] of Object.entries(schemaObj)) {
            const fullPath = configPath ? `${configPath}.${key}` : key;

            if (fieldSchema.high_impact) {
               const currentValue = this.getNestedValue(currentConfig, `${module}.${fullPath}`);
               const newValue = this.getNestedValue(newConfig, fullPath);

               if (currentValue !== newValue) {
                  warnings.push(`Changing ${fieldSchema.label || key} may affect existing data`);
               }
            } else if (typeof fieldSchema === 'object' && !fieldSchema.type) {
               checkFields(fieldSchema, fullPath);
            }
         }
      };

      checkFields(schema);
      return warnings;
   }

   /**
    * Validate field constraints
    */
   validateFieldConstraints(schema, configData) {
      const violations = [];

      const validateFields = (schemaObj, data, configPath = '') => {
         for (const [key, fieldSchema] of Object.entries(schemaObj)) {
            const fullPath = configPath ? `${configPath}.${key}` : key;
            const value = this.getNestedValue(data, fullPath);

            if (fieldSchema.type) {
               // Validate based on field type
               switch (fieldSchema.type) {
                  case 'number':
                     if (value !== undefined) {
                        const num = parseInt(value);
                        if (isNaN(num)) {
                           violations.push(`${fieldSchema.label || key} must be a number`);
                        } else {
                           if (fieldSchema.min && num < fieldSchema.min) {
                              violations.push(`${fieldSchema.label || key} must be at least ${fieldSchema.min}`);
                           }
                           if (fieldSchema.max && num > fieldSchema.max) {
                              violations.push(`${fieldSchema.label || key} must be at most ${fieldSchema.max}`);
                           }
                        }
                     }
                     break;
                  case 'select':
                     if (value !== undefined && fieldSchema.options) {
                        const validValues = fieldSchema.options.map((opt) => opt.value);
                        if (!validValues.includes(value)) {
                           violations.push(`${fieldSchema.label || key} must be one of: ${validValues.join(', ')}`);
                        }
                     }
                     break;
               }
            } else if (typeof fieldSchema === 'object') {
               validateFields(fieldSchema, data, fullPath);
            }
         }
      };

      validateFields(schema, configData);
      return violations;
   }

   /**
    * Apply configuration changes
    */
   async applyConfigChange(trustId, module, configData, userId) {
      const currentConfig = await this.getTenantConfiguration(trustId);

      // Merge new configuration
      const updatedConfig = { ...currentConfig };
      updatedConfig[module] = { ...updatedConfig[module], ...configData };

      // Save configuration (you'll need to implement the update method)
      await this.updateTenantConfiguration(trustId, updatedConfig);

      // Log change for audit
      await this.logConfigChange(trustId, module, configData, userId);

      // Clear cache
      this.clearCache(trustId);

      return updatedConfig;
   }

   /**
    * Update tenant configuration in database
    */
   async updateTenantConfiguration(trustId, configData) {
      try {
         const { dbManager } = require('../models/system/database');
         const systemDb = await dbManager.getSystemDB();
         const TenantConfiguration = systemDb.models.TenantConfiguration;

         await TenantConfiguration.update(configData, { where: { trust_id: trustId } });

         logger.info(`Updated tenant configuration for trust ${trustId}`);
      } catch (error) {
         logger.error('Error updating tenant configuration:', error);
         throw error;
      }
   }

   /**
    * Log configuration change for audit
    */
   async logConfigChange(trustId, module, changes, userId) {
      // Implementation depends on your audit logging system
      logger.info(`Config change logged: Trust ${trustId}, Module ${module}, User ${userId}`, changes);
      // You might want to store this in a dedicated audit log table
   }

   /**
    * Get configuration change history
    */
   async getChangeHistory(trustId, limit = 10) {
      // Mock implementation - replace with actual audit log query
      return [
         {
            id: 1,
            module: 'student_management',
            changes: 'Updated admission number format',
            changed_by: 'System Admin',
            changed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            impact: 'low',
         },
         {
            id: 2,
            module: 'feature_flags',
            changes: 'Enabled examination system',
            changed_by: 'System Admin',
            changed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            impact: 'high',
         },
      ];
   }

   /**
    * Get nested value from object using dot notation
    */
   getNestedValue(obj, path) {
      return path.split('.').reduce((current, key) => {
         return current && current[key] !== undefined ? current[key] : undefined;
      }, obj);
   }
}

// Export singleton instance
module.exports = new TenantConfigurationService();
