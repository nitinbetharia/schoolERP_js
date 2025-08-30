const { DataTypes } = require('sequelize');

/**
 * Tenant Configuration Model
 * Stores comprehensive configuration for each trust/tenant
 * Located in SYSTEM database
 */
const defineTenantConfiguration = (sequelize) => {
   const TenantConfiguration = sequelize.define(
      'TenantConfiguration',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
         },

         trust_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: {
               model: 'trusts',
               key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            comment: 'Reference to trust this configuration belongs to',
         },

         // Student Configuration
         student_config: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {
               admission_number_format: 'YYYY/NNNN', // Year/4-digit number
               roll_number_format: 'CLASS/NN', // Class/2-digit number
               required_documents: ['birth_certificate', 'transfer_certificate', 'address_proof', 'income_certificate'],
               custom_fields: {
                  enabled: true,
                  max_fields: 20,
                  allowed_types: ['text', 'number', 'date', 'dropdown', 'checkbox', 'textarea'],
               },
               parent_info_requirements: {
                  father_mandatory: true,
                  mother_mandatory: true,
                  guardian_mandatory: false,
                  income_details_required: true,
                  occupation_mandatory: true,
               },
               medical_info_requirements: {
                  blood_group_mandatory: false,
                  medical_conditions_mandatory: false,
                  allergies_mandatory: false,
                  vaccination_records_required: false,
               },
            },
            comment: 'Student management configuration',
         },

         // School Configuration
         school_config: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {
               max_schools_allowed: 10,
               school_types_allowed: ['PRIMARY', 'SECONDARY', 'HIGHER_SECONDARY', 'NURSERY', 'MIXED'],
               boards_supported: ['CBSE', 'CISCE', 'STATE_BOARD', 'INTERNATIONAL'],
               class_structure: {
                  nursery_classes: ['LKG', 'UKG'],
                  primary_classes: ['1', '2', '3', '4', '5'],
                  secondary_classes: ['6', '7', '8', '9', '10'],
                  higher_secondary_classes: ['11', '12'],
               },
               academic_year_format: 'YYYY-YY', // 2024-25
               session_start_month: 4, // April
               working_days_default: [1, 2, 3, 4, 5, 6], // Mon-Sat
               facilities_master: [
                  'library',
                  'computer_lab',
                  'science_lab',
                  'playground',
                  'canteen',
                  'transport',
                  'hostel',
                  'medical_room',
               ],
            },
            comment: 'School management configuration',
         },

         // Academic Configuration
         academic_config: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {
               grading_system: 'PERCENTAGE', // 'PERCENTAGE', 'GRADE', 'CGPA'
               max_marks_per_subject: 100,
               passing_marks_percentage: 33,
               grade_scale: {
                  'A+': { min: 91, max: 100 },
                  A: { min: 81, max: 90 },
                  'B+': { min: 71, max: 80 },
                  B: { min: 61, max: 70 },
                  'C+': { min: 51, max: 60 },
                  C: { min: 41, max: 50 },
                  D: { min: 33, max: 40 },
                  F: { min: 0, max: 32 },
               },
               subjects_configuration: {
                  core_subjects_mandatory: true,
                  elective_subjects_allowed: true,
                  max_subjects_per_class: 15,
                  language_subjects_mandatory: 2,
               },
            },
            comment: 'Academic system configuration',
         },

         // System Preferences
         system_preferences: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {
               timezone: 'Asia/Kolkata',
               date_format: 'DD/MM/YYYY',
               time_format: '12', // 12 or 24 hour
               currency: 'INR',
               language: 'en',
               notification_preferences: {
                  email_notifications: true,
                  sms_notifications: false,
                  push_notifications: true,
               },
               backup_preferences: {
                  auto_backup_enabled: true,
                  backup_frequency: 'daily',
                  retention_days: 30,
               },
            },
            comment: 'General system preferences',
         },

         // Feature Flags
         feature_flags: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {
               modules_enabled: {
                  student_management: true,
                  fee_management: false,
                  examination_system: false,
                  library_management: false,
                  transport_management: false,
                  hostel_management: false,
                  inventory_management: false,
                  hr_management: false,
               },
               advanced_features: {
                  custom_fields: true,
                  workflow_automation: false,
                  api_access: false,
                  mobile_app: false,
                  parent_portal: false,
                  teacher_portal: false,
               },
               compliance_features: {
                  nep_2020_support: true,
                  udise_integration: false,
                  government_reporting: false,
                  audit_trails: true,
               },
            },
            comment: 'Feature availability flags',
         },

         // Data Validation Rules
         validation_rules: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {
               student_validation: {
                  admission_number_unique_across: 'trust', // 'trust' or 'school'
                  roll_number_unique_across: 'section', // 'section' or 'class' or 'school'
                  phone_number_validation: true,
                  email_validation: true,
                  age_limits: {
                     min_age_years: 3,
                     max_age_years: 25,
                  },
               },
               data_quality: {
                  mandatory_fields_enforcement: true,
                  duplicate_detection: true,
                  data_format_validation: true,
               },
            },
            comment: 'Data validation and quality rules',
         },

         // Configuration Status
         is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: 'Whether this configuration is active',
         },

         version: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            comment: 'Configuration version for change tracking',
         },

         last_modified_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'User ID who last modified this configuration',
         },

         created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
         },

         updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
         },
      },
      {
         tableName: 'tenant_configurations',
         timestamps: true,
         createdAt: 'created_at',
         updatedAt: 'updated_at',
         indexes: [
            {
               fields: ['trust_id'],
               unique: true,
               name: 'idx_tenant_config_trust_id',
            },
            {
               fields: ['is_active'],
               name: 'idx_tenant_config_active',
            },
            {
               fields: ['version'],
               name: 'idx_tenant_config_version',
            },
         ],
      }
   );

   // Instance Methods
   TenantConfiguration.prototype.getStudentConfig = function () {
      return this.student_config || {};
   };

   TenantConfiguration.prototype.getSchoolConfig = function () {
      return this.school_config || {};
   };

   TenantConfiguration.prototype.isModuleEnabled = function (moduleName) {
      return this.feature_flags?.modules_enabled?.[moduleName] || false;
   };

   TenantConfiguration.prototype.isFeatureEnabled = function (featureName) {
      return this.feature_flags?.advanced_features?.[featureName] || false;
   };

   TenantConfiguration.prototype.incrementVersion = function () {
      this.version += 1;
      return this.save();
   };

   // Class Methods
   TenantConfiguration.getDefaultConfiguration = function () {
      return {
         student_config: this.rawAttributes.student_config.defaultValue,
         school_config: this.rawAttributes.school_config.defaultValue,
         academic_config: this.rawAttributes.academic_config.defaultValue,
         system_preferences: this.rawAttributes.system_preferences.defaultValue,
         feature_flags: this.rawAttributes.feature_flags.defaultValue,
         validation_rules: this.rawAttributes.validation_rules.defaultValue,
      };
   };

   return TenantConfiguration;
};

module.exports = defineTenantConfiguration;
