const { DataTypes } = require('sequelize');

/**
 * UDISE Census Data Field Definitions
 * Comprehensive field specifications for UDISE census data model
 * Organized by categories: Basic Info, Enrollment, Teachers, Infrastructure, Facilities
 */

/**
 * Basic census information fields
 */
const basicInfoFields = {
   id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: 'Primary key for UDISE census data',
   },

   // Reference fields
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

   // Census period information
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
};

/**
 * Student enrollment fields by class and gender
 */
const enrollmentFields = {
   // Pre-Primary
   enrollment_pre_primary_boys: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Pre-primary enrollment - Boys',
   },
   enrollment_pre_primary_girls: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Pre-primary enrollment - Girls',
   },

   // Primary Classes (I-V)
   enrollment_class_1_boys: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Class I enrollment - Boys',
   },
   enrollment_class_1_girls: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Class I enrollment - Girls',
   },
   enrollment_class_2_boys: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Class II enrollment - Boys',
   },
   enrollment_class_2_girls: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Class II enrollment - Girls',
   },
   enrollment_class_3_boys: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Class III enrollment - Boys',
   },
   enrollment_class_3_girls: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Class III enrollment - Girls',
   },
   enrollment_class_4_boys: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Class IV enrollment - Boys',
   },
   enrollment_class_4_girls: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Class IV enrollment - Girls',
   },
   enrollment_class_5_boys: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Class V enrollment - Boys',
   },
   enrollment_class_5_girls: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Class V enrollment - Girls',
   },

   // Upper Primary Classes (VI-VIII)
   enrollment_class_6_boys: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Class VI enrollment - Boys',
   },
   enrollment_class_6_girls: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Class VI enrollment - Girls',
   },
   enrollment_class_7_boys: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Class VII enrollment - Boys',
   },
   enrollment_class_7_girls: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Class VII enrollment - Girls',
   },
   enrollment_class_8_boys: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Class VIII enrollment - Boys',
   },
   enrollment_class_8_girls: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Class VIII enrollment - Girls',
   },

   // Secondary Classes (IX-X)
   enrollment_class_9_boys: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Class IX enrollment - Boys',
   },
   enrollment_class_9_girls: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Class IX enrollment - Girls',
   },
   enrollment_class_10_boys: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Class X enrollment - Boys',
   },
   enrollment_class_10_girls: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Class X enrollment - Girls',
   },

   // Higher Secondary Classes (XI-XII)
   enrollment_class_11_boys: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Class XI enrollment - Boys',
   },
   enrollment_class_11_girls: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Class XI enrollment - Girls',
   },
   enrollment_class_12_boys: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Class XII enrollment - Boys',
   },
   enrollment_class_12_girls: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Class XII enrollment - Girls',
   },
};

/**
 * Special category student fields
 */
const specialCategoryFields = {
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
};

/**
 * Teacher information fields
 */
const teacherFields = {
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
};

/**
 * Infrastructure and facility fields
 */
const infrastructureFields = {
   // Classroom information
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
      comment: 'Classrooms requiring minor repair',
   },
   classrooms_major_repair: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Classrooms requiring major repair',
   },

   // Basic facilities
   library_available: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Library facility available',
   },
   computer_lab_available: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Computer laboratory available',
   },
   drinking_water_available: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Drinking water facility available',
   },
   toilet_facility_available: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Toilet facility available',
   },
   electricity_available: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Electricity connection available',
   },
};

/**
 * Status and approval workflow fields
 */
const statusFields = {
   status: {
      type: DataTypes.ENUM('draft', 'submitted', 'validated', 'approved'),
      allowNull: false,
      defaultValue: 'draft',
      comment: 'Status of census data entry and approval',
   },
   remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Remarks or notes about the census data',
   },
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
};

/**
 * Metadata fields for audit trail
 */
const metadataFields = {
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
};

/**
 * Combine all field definitions
 */
const allFields = {
   ...basicInfoFields,
   ...enrollmentFields,
   ...specialCategoryFields,
   ...teacherFields,
   ...infrastructureFields,
   ...statusFields,
   ...metadataFields,
};

/**
 * Model options configuration
 */
const modelOptions = {
   tableName: 'udise_census_data',
   timestamps: true,
   underscored: true,
   indexes: [
      {
         fields: ['school_id'],
         name: 'idx_udise_census_school_id',
      },
      {
         fields: ['academic_year'],
         name: 'idx_udise_census_academic_year',
      },
      {
         fields: ['udise_registration_id'],
         name: 'idx_udise_census_registration_id',
      },
      {
         fields: ['status'],
         name: 'idx_udise_census_status',
      },
      {
         fields: ['school_id', 'academic_year'],
         name: 'idx_udise_census_school_year',
         unique: true,
      },
   ],
   comment: 'UDISE+ annual census data collection',
};

/**
 * Get field definitions by category
 * @param {string} category - Field category name
 * @returns {Object} - Field definitions for the category
 */
function getFieldsByCategory(category) {
   const categories = {
      basic: basicInfoFields,
      enrollment: enrollmentFields,
      special: specialCategoryFields,
      teachers: teacherFields,
      infrastructure: infrastructureFields,
      status: statusFields,
      metadata: metadataFields,
   };

   return categories[category] || {};
}

/**
 * Get all enrollment field names
 * @returns {Array<string>} - Array of enrollment field names
 */
function getEnrollmentFieldNames() {
   return Object.keys(enrollmentFields);
}

/**
 * Get all teacher field names
 * @returns {Array<string>} - Array of teacher field names
 */
function getTeacherFieldNames() {
   return Object.keys(teacherFields);
}

/**
 * Get all infrastructure field names
 * @returns {Array<string>} - Array of infrastructure field names
 */
function getInfrastructureFieldNames() {
   return Object.keys(infrastructureFields);
}

module.exports = {
   allFields,
   basicInfoFields,
   enrollmentFields,
   specialCategoryFields,
   teacherFields,
   infrastructureFields,
   statusFields,
   metadataFields,
   modelOptions,
   getFieldsByCategory,
   getEnrollmentFieldNames,
   getTeacherFieldNames,
   getInfrastructureFieldNames,
};
