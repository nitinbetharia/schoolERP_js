const { DataTypes } = require('sequelize');
const Joi = require('joi');

/**
 * Q59-ENFORCED: Comprehensive validation schemas for UDISE census data collection
 */
const udiseCensusDataValidationSchemas = {
   // Census Data Creation
   createCensusData: Joi.object({
      udise_registration_id: Joi.number()
         .integer()
         .positive()
         .required()
         .messages({
            'number.positive': 'UDISE registration ID must be positive',
            'any.required': 'UDISE registration ID is required',
         }),
      school_id: Joi.string().max(50).required().messages({
         'any.required': 'School ID is required',
      }),
      academic_year: Joi.string()
         .length(7)
         .pattern(/^\d{4}-\d{2}$/)
         .required()
         .messages({
            'string.pattern.base': 'Academic year must be in format YYYY-YY',
            'any.required': 'Academic year is required',
         }),
      census_date: Joi.date().required().messages({
         'any.required': 'Census date is required',
      }),
      data_collection_phase: Joi.string()
         .valid('september_30', 'march_31', 'special')
         .required()
         .messages({
            'any.only':
          'Data collection phase must be september_30, march_31, or special',
            'any.required': 'Data collection phase is required',
         }),
      // Enrollment data (simplified - all integer, non-negative)
      enrollment_pre_primary_boys: Joi.number().integer().min(0).default(0),
      enrollment_pre_primary_girls: Joi.number().integer().min(0).default(0),
      enrollment_class_1_boys: Joi.number().integer().min(0).default(0),
      enrollment_class_1_girls: Joi.number().integer().min(0).default(0),
      enrollment_class_2_boys: Joi.number().integer().min(0).default(0),
      enrollment_class_2_girls: Joi.number().integer().min(0).default(0),
      enrollment_class_3_boys: Joi.number().integer().min(0).default(0),
      enrollment_class_3_girls: Joi.number().integer().min(0).default(0),
      enrollment_class_4_boys: Joi.number().integer().min(0).default(0),
      enrollment_class_4_girls: Joi.number().integer().min(0).default(0),
      enrollment_class_5_boys: Joi.number().integer().min(0).default(0),
      enrollment_class_5_girls: Joi.number().integer().min(0).default(0),
      enrollment_class_6_boys: Joi.number().integer().min(0).default(0),
      enrollment_class_6_girls: Joi.number().integer().min(0).default(0),
      enrollment_class_7_boys: Joi.number().integer().min(0).default(0),
      enrollment_class_7_girls: Joi.number().integer().min(0).default(0),
      enrollment_class_8_boys: Joi.number().integer().min(0).default(0),
      enrollment_class_8_girls: Joi.number().integer().min(0).default(0),
      enrollment_class_9_boys: Joi.number().integer().min(0).default(0),
      enrollment_class_9_girls: Joi.number().integer().min(0).default(0),
      enrollment_class_10_boys: Joi.number().integer().min(0).default(0),
      enrollment_class_10_girls: Joi.number().integer().min(0).default(0),
      enrollment_class_11_boys: Joi.number().integer().min(0).default(0),
      enrollment_class_11_girls: Joi.number().integer().min(0).default(0),
      enrollment_class_12_boys: Joi.number().integer().min(0).default(0),
      enrollment_class_12_girls: Joi.number().integer().min(0).default(0),
      sc_students_boys: Joi.number().integer().min(0).default(0),
      sc_students_girls: Joi.number().integer().min(0).default(0),
      st_students_boys: Joi.number().integer().min(0).default(0),
      st_students_girls: Joi.number().integer().min(0).default(0),
      obc_students_boys: Joi.number().integer().min(0).default(0),
      obc_students_girls: Joi.number().integer().min(0).default(0),
   }),

   // Census Data Update
   updateCensusData: Joi.object({
      census_date: Joi.date().optional(),
      data_collection_phase: Joi.string()
         .valid('september_30', 'march_31', 'special')
         .optional(),
      // Allow updating any enrollment numbers
      enrollment_pre_primary_boys: Joi.number().integer().min(0).optional(),
      enrollment_pre_primary_girls: Joi.number().integer().min(0).optional(),
      enrollment_class_1_boys: Joi.number().integer().min(0).optional(),
      enrollment_class_1_girls: Joi.number().integer().min(0).optional(),
      enrollment_class_2_boys: Joi.number().integer().min(0).optional(),
      enrollment_class_2_girls: Joi.number().integer().min(0).optional(),
      enrollment_class_3_boys: Joi.number().integer().min(0).optional(),
      enrollment_class_3_girls: Joi.number().integer().min(0).optional(),
      enrollment_class_4_boys: Joi.number().integer().min(0).optional(),
      enrollment_class_4_girls: Joi.number().integer().min(0).optional(),
      enrollment_class_5_boys: Joi.number().integer().min(0).optional(),
      enrollment_class_5_girls: Joi.number().integer().min(0).optional(),
      enrollment_class_6_boys: Joi.number().integer().min(0).optional(),
      enrollment_class_6_girls: Joi.number().integer().min(0).optional(),
      enrollment_class_7_boys: Joi.number().integer().min(0).optional(),
      enrollment_class_7_girls: Joi.number().integer().min(0).optional(),
      enrollment_class_8_boys: Joi.number().integer().min(0).optional(),
      enrollment_class_8_girls: Joi.number().integer().min(0).optional(),
      enrollment_class_9_boys: Joi.number().integer().min(0).optional(),
      enrollment_class_9_girls: Joi.number().integer().min(0).optional(),
      enrollment_class_10_boys: Joi.number().integer().min(0).optional(),
      enrollment_class_10_girls: Joi.number().integer().min(0).optional(),
      enrollment_class_11_boys: Joi.number().integer().min(0).optional(),
      enrollment_class_11_girls: Joi.number().integer().min(0).optional(),
      enrollment_class_12_boys: Joi.number().integer().min(0).optional(),
      enrollment_class_12_girls: Joi.number().integer().min(0).optional(),
   }),
};

/**
 * UDISE Census Data Model
 * Manages annual census data collection for UDISE+ reporting
 * Contains enrollment, infrastructure, and other statistical data
 */
module.exports = (sequelize) => {
   const UdiseCensusData = sequelize.define(
      'UdiseCensusData',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: 'Primary key for UDISE census data',
         },

         // Reference to UDISE Registration
         udise_registration_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Reference to UDISE school registration',
         },
         school_id: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: 'Reference to school in school management system',
         },

         // Census Period
         academic_year: {
            type: DataTypes.STRING(7),
            allowNull: false,
            comment: 'Academic year for census data (e.g., 2024-25)',
         },
         census_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: 'Date when census data was collected',
         },
         data_collection_phase: {
            type: DataTypes.ENUM('september_30', 'march_31', 'special'),
            allowNull: false,
            comment: 'Phase of data collection (Sept 30 or March 31)',
         },

         // Student Enrollment Data (Class-wise and Gender-wise)
         // Pre-Primary
         enrollment_pre_primary_boys: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Boys enrolled in pre-primary',
         },
         enrollment_pre_primary_girls: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Girls enrolled in pre-primary',
         },

         // Primary (Classes I-V)
         enrollment_class_1_boys: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
         },
         enrollment_class_1_girls: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
         },
         enrollment_class_2_boys: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
         },
         enrollment_class_2_girls: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
         },
         enrollment_class_3_boys: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
         },
         enrollment_class_3_girls: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
         },
         enrollment_class_4_boys: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
         },
         enrollment_class_4_girls: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
         },
         enrollment_class_5_boys: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
         },
         enrollment_class_5_girls: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
         },

         // Upper Primary (Classes VI-VIII)
         enrollment_class_6_boys: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
         },
         enrollment_class_6_girls: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
         },
         enrollment_class_7_boys: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
         },
         enrollment_class_7_girls: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
         },
         enrollment_class_8_boys: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
         },
         enrollment_class_8_girls: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
         },

         // Secondary (Classes IX-X)
         enrollment_class_9_boys: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
         },
         enrollment_class_9_girls: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
         },
         enrollment_class_10_boys: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
         },
         enrollment_class_10_girls: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
         },

         // Higher Secondary (Classes XI-XII)
         enrollment_class_11_boys: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
         },
         enrollment_class_11_girls: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
         },
         enrollment_class_12_boys: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
         },
         enrollment_class_12_girls: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
         },

         // Special Categories Enrollment
         sc_students_boys: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Scheduled Caste students - Boys',
         },
         sc_students_girls: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Scheduled Caste students - Girls',
         },
         st_students_boys: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Scheduled Tribe students - Boys',
         },
         st_students_girls: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Scheduled Tribe students - Girls',
         },
         obc_students_boys: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Other Backward Classes students - Boys',
         },
         obc_students_girls: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Other Backward Classes students - Girls',
         },
         minority_students_boys: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Religious Minority students - Boys',
         },
         minority_students_girls: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Religious Minority students - Girls',
         },
         cwsn_students_boys: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Children with Special Needs - Boys',
         },
         cwsn_students_girls: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Children with Special Needs - Girls',
         },

         // Teacher Information
         total_teachers: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Total number of teachers',
         },
         male_teachers: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Number of male teachers',
         },
         female_teachers: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Number of female teachers',
         },
         trained_teachers: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Number of professionally trained teachers',
         },

         // Infrastructure Data
         total_classrooms: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Total number of classrooms',
         },
         classrooms_good_condition: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Classrooms in good condition',
         },
         classrooms_minor_repair: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Classrooms needing minor repair',
         },
         classrooms_major_repair: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Classrooms needing major repair',
         },

         // Facilities Available
         separate_room_headmaster: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Separate room for headmaster available',
         },
         boundary_wall: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Boundary wall exists',
         },
         drinking_water: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Drinking water facility available',
         },
         hand_wash_facility: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Hand wash facility available',
         },
         toilet_facility: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Toilet facility available',
         },
         electricity: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Electricity available',
         },
         library: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Library available',
         },
         reading_room: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Reading room available',
         },
         playground: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Playground available',
         },

         // Digital Infrastructure
         computer_aided_learning: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Computer aided learning available',
         },
         internet_facility: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Internet facility available',
         },
         dth_availability: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'DTH (Direct to Home) facility available',
         },

         // Mid-day Meal Program
         midday_meal_available: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Mid-day meal program available',
         },
         kitchen_garden: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Kitchen garden available',
         },

         // Financial Information
         total_grant_received: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
            comment: 'Total government grant received',
         },
         grant_utilized: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
            comment: 'Total grant utilized',
         },

         // Data Quality & Status
         data_status: {
            type: DataTypes.ENUM('draft', 'validated', 'submitted', 'approved'),
            allowNull: false,
            defaultValue: 'draft',
            comment: 'Status of census data',
         },
         data_collection_method: {
            type: DataTypes.ENUM('online', 'offline', 'hybrid'),
            allowNull: false,
            defaultValue: 'online',
            comment: 'Method of data collection',
         },
         remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Additional remarks or notes',
         },

         // Submission Tracking
         submitted_by: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'User who submitted the data',
         },
         submitted_date: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Date when data was submitted',
         },
         validated_by: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'User who validated the data',
         },
         validated_date: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Date when data was validated',
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
         tableName: 'udise_census_data',
         timestamps: true,
         underscored: true,
         indexes: [
            {
               fields: ['school_id'],
            },
         ],
         comment: 'UDISE+ annual census data collection',
      },
   );

   // Model associations will be defined in index.js
   UdiseCensusData.associate = function (models) {
      // Association with UDISE School Registration
      UdiseCensusData.belongsTo(models.UdiseSchoolRegistration, {
         foreignKey: 'udise_registration_id',
         as: 'udise_registration',
      });
   };

   return UdiseCensusData;
};

// Q59-ENFORCED: Export validation schemas
module.exports.udiseCensusDataValidationSchemas =
  udiseCensusDataValidationSchemas;
