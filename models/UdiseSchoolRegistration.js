const { DataTypes } = require('sequelize');
const Joi = require('joi');

/**
 * Q59-ENFORCED: Comprehensive validation schemas for UDISE school registration
 * These schemas enforce compliance with UDISE+ requirements and government standards
 */
const udiseSchoolRegistrationValidationSchemas = {
   // UDISE School Registration Creation
   createRegistration: Joi.object({
      school_id: Joi.string().max(50).required().messages({
         'string.max': 'School ID cannot exceed 50 characters',
         'any.required': 'School ID is required',
      }),
      udise_code: Joi.string().length(11).optional().allow(null).messages({
         'string.length': 'UDISE code must be exactly 11 digits',
      }),
      dise_code: Joi.string().max(14).optional().allow(null),
      school_name_english: Joi.string().max(200).required().messages({
         'string.max': 'English school name cannot exceed 200 characters',
         'any.required': 'English school name is required',
      }),
      school_name_hindi: Joi.string().max(200).optional().allow(null),
      state_code: Joi.string().length(2).required().messages({
         'string.length': 'State code must be exactly 2 digits',
         'any.required': 'State code is required',
      }),
      district_code: Joi.string().length(3).required().messages({
         'string.length': 'District code must be exactly 3 digits',
         'any.required': 'District code is required',
      }),
      block_code: Joi.string().length(4).required().messages({
         'string.length': 'Block code must be exactly 4 digits',
         'any.required': 'Block code is required',
      }),
      village_code: Joi.string().length(6).optional().allow(null),
      school_category: Joi.string()
         .valid('primary', 'upper_primary', 'secondary', 'higher_secondary')
         .required()
         .messages({
            'any.only': 'School category must be primary, upper_primary, secondary, or higher_secondary',
            'any.required': 'School category is required',
         }),
      school_management: Joi.string()
         .valid('government', 'government_aided', 'private_unaided', 'other')
         .required()
         .messages({
            'any.only': 'School management must be government, government_aided, private_unaided, or other',
            'any.required': 'School management is required',
         }),
      school_type: Joi.string().valid('boys', 'girls', 'co_educational').required().messages({
         'any.only': 'School type must be boys, girls, or co_educational',
         'any.required': 'School type is required',
      }),
      recognition_status: Joi.string().valid('recognized', 'unrecognized', 'partially_recognized').required().messages({
         'any.only': 'Recognition status must be recognized, unrecognized, or partially_recognized',
         'any.required': 'Recognition status is required',
      }),
      total_classrooms: Joi.number().integer().min(0).default(0).messages({
         'number.min': 'Total classrooms cannot be negative',
      }),
      boundary_wall: Joi.boolean().default(false),
      drinking_water_available: Joi.boolean().default(false),
      electricity_available: Joi.boolean().default(false),
      toilet_boys: Joi.number().integer().min(0).default(0).messages({
         'number.min': 'Toilet count for boys cannot be negative',
      }),
      toilet_girls: Joi.number().integer().min(0).default(0).messages({
         'number.min': 'Toilet count for girls cannot be negative',
      }),
      library_available: Joi.boolean().default(false),
      playground_available: Joi.boolean().default(false),
      computer_lab: Joi.boolean().default(false),
      internet_connectivity: Joi.boolean().default(false),
      academic_year: Joi.string()
         .length(7)
         .pattern(/^\d{4}-\d{2}$/)
         .required()
         .messages({
            'string.pattern.base': 'Academic year must be in format YYYY-YY (e.g., 2024-25)',
            'any.required': 'Academic year is required',
         }),
      affiliation_board: Joi.string().max(100).optional().allow(null),
      affiliation_number: Joi.string().max(50).optional().allow(null),
   }),

   // UDISE Registration Update
   updateRegistration: Joi.object({
      registration_status: Joi.string()
         .valid('draft', 'submitted', 'under_review', 'approved', 'rejected', 'renewal_required')
         .optional(),
      udise_code: Joi.string().length(11).optional().allow(null),
      school_name_english: Joi.string().max(200).optional(),
      school_name_hindi: Joi.string().max(200).optional().allow(null),
      recognition_status: Joi.string().valid('recognized', 'unrecognized', 'partially_recognized').optional(),
      total_classrooms: Joi.number().integer().min(0).optional(),
      boundary_wall: Joi.boolean().optional(),
      drinking_water_available: Joi.boolean().optional(),
      electricity_available: Joi.boolean().optional(),
      toilet_boys: Joi.number().integer().min(0).optional(),
      toilet_girls: Joi.number().integer().min(0).optional(),
      library_available: Joi.boolean().optional(),
      playground_available: Joi.boolean().optional(),
      computer_lab: Joi.boolean().optional(),
      internet_connectivity: Joi.boolean().optional(),
      affiliation_board: Joi.string().max(100).optional().allow(null),
      affiliation_number: Joi.string().max(50).optional().allow(null),
   }),

   // Query UDISE Registrations
   queryRegistrations: Joi.object({
      school_id: Joi.string().max(50).optional(),
      udise_code: Joi.string().length(11).optional(),
      registration_status: Joi.string()
         .valid('draft', 'submitted', 'under_review', 'approved', 'rejected', 'renewal_required')
         .optional(),
      state_code: Joi.string().length(2).optional(),
      district_code: Joi.string().length(3).optional(),
      school_category: Joi.string().valid('primary', 'upper_primary', 'secondary', 'higher_secondary').optional(),
      school_management: Joi.string().valid('government', 'government_aided', 'private_unaided', 'other').optional(),
      recognition_status: Joi.string().valid('recognized', 'unrecognized', 'partially_recognized').optional(),
      academic_year: Joi.string()
         .length(7)
         .pattern(/^\d{4}-\d{2}$/)
         .optional(),
      limit: Joi.number().integer().min(1).max(1000).default(50),
      offset: Joi.number().integer().min(0).default(0),
      sortBy: Joi.string().valid('id', 'udise_code', 'registration_date', 'school_name_english').default('id'),
      sortOrder: Joi.string().valid('ASC', 'DESC').default('ASC'),
   })
      .min(1)
      .messages({
         'object.min': 'At least one filter parameter is required',
      }),
};

/**
 * UDISE School Registration Model
 * Manages school registration with UDISE+ (Unified District Information System for Education Plus)
 * Essential for government recognition and compliance
 */
module.exports = (sequelize) => {
   const UdiseSchoolRegistration = sequelize.define(
      'UdiseSchoolRegistration',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: 'Primary key for UDISE school registration',
         },

         // Basic Identification
         school_id: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: 'Reference to school in school management system',
         },
         udise_code: {
            type: DataTypes.STRING(11),
            unique: true,
            allowNull: true,
            comment: 'Official 11-digit UDISE code assigned by government',
         },
         dise_code: {
            type: DataTypes.STRING(14),
            allowNull: true,
            comment: 'Legacy DISE code (if applicable)',
         },

         // Registration Status
         registration_status: {
            type: DataTypes.ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected', 'renewal_required'),
            allowNull: false,
            defaultValue: 'draft',
            comment: 'Current registration status with UDISE+',
         },
         registration_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: 'Date when registration was first submitted',
         },
         approval_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: 'Date when registration was approved',
         },
         renewal_due_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: 'Date when registration renewal is required',
         },

         // School Basic Information for UDISE
         school_name_hindi: {
            type: DataTypes.STRING(200),
            allowNull: true,
            comment: 'School name in Hindi as per government records',
         },
         school_name_english: {
            type: DataTypes.STRING(200),
            allowNull: false,
            comment: 'School name in English as per government records',
         },

         // Location Details (as per UDISE requirements)
         state_code: {
            type: DataTypes.STRING(2),
            allowNull: false,
            comment: 'State code as per UDISE coding',
         },
         district_code: {
            type: DataTypes.STRING(3),
            allowNull: false,
            comment: 'District code as per UDISE coding',
         },
         block_code: {
            type: DataTypes.STRING(4),
            allowNull: false,
            comment: 'Block code as per UDISE coding',
         },
         village_code: {
            type: DataTypes.STRING(6),
            allowNull: true,
            comment: 'Village code as per UDISE coding (if applicable)',
         },

         // School Category & Type
         school_category: {
            type: DataTypes.ENUM('primary', 'upper_primary', 'secondary', 'higher_secondary'),
            allowNull: false,
            comment: 'Highest class offered by school',
         },
         school_management: {
            type: DataTypes.ENUM('government', 'government_aided', 'private_unaided', 'other'),
            allowNull: false,
            comment: 'School management type as per UDISE classification',
         },
         school_type: {
            type: DataTypes.ENUM('boys', 'girls', 'co_educational'),
            allowNull: false,
            comment: 'Gender composition of school',
         },

         // Recognition & Affiliation
         recognition_status: {
            type: DataTypes.ENUM('recognized', 'unrecognized', 'partially_recognized'),
            allowNull: false,
            comment: 'Government recognition status',
         },
         affiliation_board: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Educational board affiliation (CBSE, NCERT, State Board, etc.)',
         },
         affiliation_number: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: 'Board affiliation number',
         },

         // Infrastructure & Facilities (Key UDISE parameters)
         total_classrooms: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Total number of classrooms',
         },
         boundary_wall: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether school has boundary wall',
         },
         drinking_water_available: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Availability of drinking water facility',
         },
         electricity_available: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Availability of electricity',
         },
         toilet_boys: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Number of toilets for boys',
         },
         toilet_girls: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Number of toilets for girls',
         },
         library_available: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether school has library',
         },
         playground_available: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether school has playground',
         },

         // Digital Infrastructure
         computer_lab: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether school has computer lab',
         },
         internet_connectivity: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether school has internet connectivity',
         },

         // Annual Data (for census)
         academic_year: {
            type: DataTypes.STRING(7),
            allowNull: false,
            comment: 'Academic year for which data is reported (e.g., 2024-25)',
         },

         // Compliance & Audit
         last_inspection_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: 'Date of last government inspection',
         },
         inspection_grade: {
            type: DataTypes.ENUM('A', 'B', 'C', 'D', 'pending'),
            allowNull: true,
            comment: 'Grade received in last inspection',
         },
         compliance_score: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            comment: 'Overall compliance score (0-100)',
         },

         // Submission & Tracking
         submitted_by: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'User who submitted the UDISE registration',
         },
         submission_remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Remarks or notes during submission',
         },
         rejection_reason: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Reason for rejection (if applicable)',
         },

         // Metadata
         created_by: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: 'User who created this record',
         },
         updated_by: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'User who last updated this record',
         },
      },
      {
         tableName: 'udise_school_registrations',
         timestamps: true,
         underscored: true,
         indexes: [
            // Note: udise_code already has unique: true in field definition
            // Only adding non-unique indexes here
            {
               fields: ['school_id'],
            },
         ],
         comment: 'UDISE+ school registration and compliance tracking',
      }
   );

   // Model associations will be defined in index.js
   UdiseSchoolRegistration.associate = function (models) {
      // Association with School model (if available)
      // UdiseSchoolRegistration.belongsTo(models.School, {
      //    foreignKey: 'school_id',
      //    as: 'school'
      // });

      // Association with UDISE Census Data
      UdiseSchoolRegistration.hasMany(models.UdiseCensusData, {
         foreignKey: 'udise_registration_id',
         as: 'census_data',
      });

      // Association with UDISE Compliance Records
      UdiseSchoolRegistration.hasMany(models.UdiseComplianceRecord, {
         foreignKey: 'udise_registration_id',
         as: 'compliance_records',
      });
   };

   return UdiseSchoolRegistration;
};

// Q59-ENFORCED: Export validation schemas
module.exports.udiseSchoolRegistrationValidationSchemas = udiseSchoolRegistrationValidationSchemas;
