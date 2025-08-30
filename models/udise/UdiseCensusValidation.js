const Joi = require('joi');

/**
 * UDISE Census Data Validation Schemas
 * Comprehensive validation for UDISE census data collection
 * Follows government UDISE+ standards and requirements
 */

const udiseCensusDataValidationSchemas = {
   // Census Data Creation - Main validation schema
   createCensusData: Joi.object({
      udise_registration_id: Joi.number().integer().positive().required().messages({
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

      data_collection_phase: Joi.string().valid('september_30', 'march_31', 'special').required().messages({
         'any.only': 'Data collection phase must be september_30, march_31, or special',
         'any.required': 'Data collection phase is required',
      }),

      // Pre-Primary Enrollment
      enrollment_pre_primary_boys: Joi.number().integer().min(0).default(0),
      enrollment_pre_primary_girls: Joi.number().integer().min(0).default(0),

      // Primary Enrollment (Classes I-V)
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

      // Upper Primary Enrollment (Classes VI-VIII)
      enrollment_class_6_boys: Joi.number().integer().min(0).optional(),
      enrollment_class_6_girls: Joi.number().integer().min(0).optional(),
      enrollment_class_7_boys: Joi.number().integer().min(0).optional(),
      enrollment_class_7_girls: Joi.number().integer().min(0).optional(),
      enrollment_class_8_boys: Joi.number().integer().min(0).optional(),
      enrollment_class_8_girls: Joi.number().integer().min(0).optional(),

      // Secondary Enrollment (Classes IX-X)
      enrollment_class_9_boys: Joi.number().integer().min(0).optional(),
      enrollment_class_9_girls: Joi.number().integer().min(0).optional(),
      enrollment_class_10_boys: Joi.number().integer().min(0).optional(),
      enrollment_class_10_girls: Joi.number().integer().min(0).optional(),

      // Higher Secondary Enrollment (Classes XI-XII)
      enrollment_class_11_boys: Joi.number().integer().min(0).optional(),
      enrollment_class_11_girls: Joi.number().integer().min(0).optional(),
      enrollment_class_12_boys: Joi.number().integer().min(0).optional(),
      enrollment_class_12_girls: Joi.number().integer().min(0).optional(),

      // Special Categories
      cwsn_students_boys: Joi.number().integer().min(0).default(0),
      cwsn_students_girls: Joi.number().integer().min(0).default(0),

      // Teacher Information
      total_teachers: Joi.number().integer().min(0).default(0),
      male_teachers: Joi.number().integer().min(0).default(0),
      female_teachers: Joi.number().integer().min(0).default(0),
      trained_teachers: Joi.number().integer().min(0).default(0),

      // Infrastructure Data
      total_classrooms: Joi.number().integer().min(0).default(0),
      classrooms_good_condition: Joi.number().integer().min(0).default(0),
      classrooms_minor_repair: Joi.number().integer().min(0).default(0),
      classrooms_major_repair: Joi.number().integer().min(0).default(0),

      // Facilities
      library_available: Joi.boolean().default(false),
      computer_lab_available: Joi.boolean().default(false),
      drinking_water_available: Joi.boolean().default(false),
      toilet_facility_available: Joi.boolean().default(false),
      electricity_available: Joi.boolean().default(false),

      // Metadata
      created_by: Joi.string().max(100).required(),
      updated_by: Joi.string().max(100).optional(),
   }),

   // Update validation schema (excludes required fields that shouldn't change)
   updateCensusData: Joi.object({
      // Enrollment data can be updated
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

      // Special Categories
      cwsn_students_boys: Joi.number().integer().min(0).optional(),
      cwsn_students_girls: Joi.number().integer().min(0).optional(),

      // Teacher Information
      total_teachers: Joi.number().integer().min(0).optional(),
      male_teachers: Joi.number().integer().min(0).optional(),
      female_teachers: Joi.number().integer().min(0).optional(),
      trained_teachers: Joi.number().integer().min(0).optional(),

      // Infrastructure Data
      total_classrooms: Joi.number().integer().min(0).optional(),
      classrooms_good_condition: Joi.number().integer().min(0).optional(),
      classrooms_minor_repair: Joi.number().integer().min(0).optional(),
      classrooms_major_repair: Joi.number().integer().min(0).optional(),

      // Facilities
      library_available: Joi.boolean().optional(),
      computer_lab_available: Joi.boolean().optional(),
      drinking_water_available: Joi.boolean().optional(),
      toilet_facility_available: Joi.boolean().optional(),
      electricity_available: Joi.boolean().optional(),

      // Status updates
      status: Joi.string().valid('draft', 'submitted', 'validated', 'approved').optional(),
      remarks: Joi.string().max(500).optional(),
      updated_by: Joi.string().max(100).required(),
   }),

   // Query validation schemas
   queryBySchool: Joi.object({
      school_id: Joi.string().max(50).required(),
      academic_year: Joi.string()
         .length(7)
         .pattern(/^\d{4}-\d{2}$/)
         .optional(),
   }),

   queryByAcademicYear: Joi.object({
      academic_year: Joi.string()
         .length(7)
         .pattern(/^\d{4}-\d{2}$/)
         .required(),
      data_collection_phase: Joi.string().valid('september_30', 'march_31', 'special').optional(),
   }),

   // Bulk operations validation
   bulkCreate: Joi.array()
      .items(
         Joi.object({
            udise_registration_id: Joi.number().integer().positive().required(),
            school_id: Joi.string().max(50).required(),
            academic_year: Joi.string()
               .length(7)
               .pattern(/^\d{4}-\d{2}$/)
               .required(),
            // ... other required fields
         })
      )
      .min(1)
      .max(100),
};

/**
 * Custom validation functions for business rules
 */

/**
 * Validate that teacher gender counts add up to total
 * @param {Object} data - Census data
 * @returns {Object} - Validation result
 */
function validateTeacherCounts(data) {
   const { total_teachers, male_teachers, female_teachers } = data;

   if (total_teachers !== male_teachers + female_teachers) {
      return {
         isValid: false,
         error: 'Male and female teacher counts must equal total teachers',
      };
   }

   return { isValid: true };
}

/**
 * Validate that classroom condition counts are logical
 * @param {Object} data - Census data
 * @returns {Object} - Validation result
 */
function validateClassroomCounts(data) {
   const { total_classrooms, classrooms_good_condition, classrooms_minor_repair, classrooms_major_repair } = data;

   const conditionTotal = classrooms_good_condition + classrooms_minor_repair + classrooms_major_repair;

   if (conditionTotal > total_classrooms) {
      return {
         isValid: false,
         error: 'Sum of classroom conditions cannot exceed total classrooms',
      };
   }

   return { isValid: true };
}

/**
 * Validate enrollment data for consistency
 * @param {Object} data - Census data
 * @returns {Object} - Validation result
 */
function validateEnrollmentData(data) {
   const errors = [];

   // Check that trained teachers don't exceed total teachers
   if (data.trained_teachers > data.total_teachers) {
      errors.push('Trained teachers cannot exceed total teachers');
   }

   // Check CWSN students are reasonable (typically small percentage)
   const totalEnrollment = Object.keys(data)
      .filter((key) => key.startsWith('enrollment_'))
      .reduce((sum, key) => sum + (data[key] || 0), 0);

   const totalCWSN = (data.cwsn_students_boys || 0) + (data.cwsn_students_girls || 0);

   if (totalCWSN > totalEnrollment * 0.1) {
      // More than 10% seems unusual
      errors.push('CWSN student count seems unusually high - please verify');
   }

   return {
      isValid: errors.length === 0,
      errors,
      warnings: errors.length > 0 ? errors : [],
   };
}

module.exports = {
   udiseCensusDataValidationSchemas,
   validateTeacherCounts,
   validateClassroomCounts,
   validateEnrollmentData,
};
