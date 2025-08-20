const { DataTypes } = require('sequelize');
const { logger } = require('../../../utils/logger');

/**
 * UDISE+ Student Registration Model
 * Individual student government compliance tracking
 * Extends existing Student model with UDISE+ specific data
 * Generates 12-digit UDISE+ student IDs for government reporting
 */
function defineUDISEStudent(sequelize) {
   const UDISEStudent = sequelize.define(
      'UDISEStudent',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
         },
         student_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: {
               model: 'students',
               key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            comment: 'Reference to internal student record',
         },
         udise_school_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'udise_schools',
               key: 'id',
            },
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE',
            comment: 'Reference to UDISE+ school registration',
         },

         // UDISE+ Student Identifiers
         udise_student_id: {
            type: DataTypes.STRING(12),
            allowNull: false,
            unique: true,
            validate: {
               len: [12, 12],
               isNumeric: true,
            },
            comment: '12-digit UDISE+ student ID (11-digit school code + student sequence)',
         },
         pen_number: {
            type: DataTypes.STRING(14),
            allowNull: true,
            unique: true,
            comment: 'Permanent Education Number - Individual student identifier',
         },

         // Government ID Integration
         aadhaar_number: {
            type: DataTypes.STRING(12),
            allowNull: true,
            validate: {
               len: [12, 12],
               isNumeric: true,
            },
            comment: 'Aadhaar card number (encrypted in production)',
         },
         aadhaar_verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Aadhaar verification status',
         },
         aadhaar_verification_date: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Date of Aadhaar verification',
         },

         // State-specific IDs
         saral_id: {
            type: DataTypes.STRING(20),
            allowNull: true,
            comment: 'SARAL ID (Maharashtra state-specific)',
         },
         emis_id: {
            type: DataTypes.STRING(20),
            allowNull: true,
            comment: 'Education Management Information System ID',
         },

         // Board-specific IDs
         cbse_uid: {
            type: DataTypes.STRING(20),
            allowNull: true,
            comment: 'CBSE Unique Identifier for board students',
         },
         cisce_uid: {
            type: DataTypes.STRING(20),
            allowNull: true,
            comment: 'CISCE Unique Identifier (ICSE/ISC board)',
         },

         // Special Categories
         rte_beneficiary: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Right to Education beneficiary status',
         },
         rte_beneficiary_id: {
            type: DataTypes.STRING(20),
            allowNull: true,
            comment: 'RTE beneficiary tracking ID',
         },
         cwsn_status: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Children with Special Needs status',
         },
         cwsn_id: {
            type: DataTypes.STRING(20),
            allowNull: true,
            comment: 'CWSN tracking identifier',
         },
         cwsn_disability_type: {
            type: DataTypes.ENUM(
               'VISUAL_IMPAIRMENT',
               'HEARING_IMPAIRMENT',
               'LOCOMOTOR_DISABILITY',
               'INTELLECTUAL_DISABILITY',
               'LEARNING_DISABILITY',
               'AUTISM_SPECTRUM_DISORDER',
               'MULTIPLE_DISABILITIES',
               'OTHER'
            ),
            allowNull: true,
            comment: 'Type of disability for CWSN students',
         },

         // Educational Background
         mother_tongue: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: 'Student mother tongue (NEP 2020 requirement)',
         },
         previous_school_type: {
            type: DataTypes.ENUM('GOVERNMENT', 'PRIVATE', 'AIDED', 'UNAIDED', 'MADRASA', 'OTHER'),
            allowNull: true,
            comment: 'Type of previous school attended',
         },
         previous_class: {
            type: DataTypes.STRING(10),
            allowNull: true,
            comment: 'Last class attended in previous school',
         },
         transfer_certificate_number: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: 'Transfer certificate number from previous school',
         },

         // Enrollment Details
         enrollment_type: {
            type: DataTypes.ENUM('FRESH', 'TRANSFER', 'READMISSION'),
            allowNull: false,
            defaultValue: 'FRESH',
            comment: 'Type of enrollment',
         },
         enrollment_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: 'Date of UDISE+ enrollment',
         },
         academic_session: {
            type: DataTypes.STRING(20),
            allowNull: false,
            comment: 'Academic session like "2024-25"',
         },

         // Learning Assessment (NEP 2020)
         foundational_literacy_level: {
            type: DataTypes.ENUM('BEGINNER', 'DEVELOPING', 'PROFICIENT', 'ADVANCED'),
            allowNull: true,
            comment: 'Foundational literacy assessment level',
         },
         foundational_numeracy_level: {
            type: DataTypes.ENUM('BEGINNER', 'DEVELOPING', 'PROFICIENT', 'ADVANCED'),
            allowNull: true,
            comment: 'Foundational numeracy assessment level',
         },
         digital_literacy_level: {
            type: DataTypes.ENUM('BEGINNER', 'DEVELOPING', 'PROFICIENT', 'ADVANCED'),
            allowNull: true,
            comment: 'Digital literacy assessment level',
         },

         // Government Reporting Status
         census_year: {
            type: DataTypes.STRING(10),
            allowNull: false,
            comment: 'Census year for government reporting',
         },
         data_submitted_to_gov: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Whether data has been submitted to government',
         },
         gov_submission_date: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Date of government data submission',
         },
         gov_response_status: {
            type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'UNDER_REVIEW'),
            allowNull: true,
            comment: 'Government response status',
         },
         gov_remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Government remarks or feedback',
         },

         // Validation and Compliance
         data_validation_status: {
            type: DataTypes.ENUM('VALID', 'INVALID', 'INCOMPLETE', 'UNDER_REVIEW'),
            defaultValue: 'INCOMPLETE',
            comment: 'Data validation status before government submission',
         },
         validation_errors: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Array of validation errors that need to be fixed',
         },
         last_validated_at: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Timestamp of last data validation',
         },

         // Tracking and Metadata
         created_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'User ID who created this record',
         },
         updated_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'User ID who last updated this record',
         },
         is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: 'Active status of UDISE+ registration',
         },
         remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Additional remarks or notes',
         },
      },
      {
         tableName: 'udise_students',
         timestamps: true,
         createdAt: 'created_at',
         updatedAt: 'updated_at',
         indexes: [
            {
               fields: ['udise_student_id'],
               unique: true,
               name: 'idx_udise_student_id',
            },
            {
               fields: ['student_id'],
               unique: true,
               name: 'idx_student_id',
            },
            {
               fields: ['udise_school_id'],
               name: 'idx_udise_school_id',
            },
            {
               fields: ['aadhaar_number'],
               name: 'idx_aadhaar_number',
            },
            {
               fields: ['pen_number'],
               name: 'idx_pen_number',
            },
            {
               fields: ['census_year'],
               name: 'idx_census_year',
            },
            {
               fields: ['academic_session'],
               name: 'idx_academic_session',
            },
            {
               fields: ['enrollment_date'],
               name: 'idx_enrollment_date',
            },
            {
               fields: ['data_validation_status'],
               name: 'idx_data_validation_status',
            },
            {
               fields: ['is_active'],
               name: 'idx_is_active',
            },
         ],
         comment: 'UDISE+ student government compliance tracking',
      }
   );

   // Static method for generating UDISE+ Student ID
   UDISEStudent.generateUDISEStudentId = function (schoolUdiseCode, sequenceNumber) {
      if (!schoolUdiseCode || schoolUdiseCode.length !== 11) {
         throw new Error('Invalid school UDISE+ code. Must be 11 digits.');
      }

      if (!sequenceNumber || sequenceNumber < 1 || sequenceNumber > 999) {
         throw new Error('Invalid sequence number. Must be between 1 and 999.');
      }

      // Format sequence number to 1 digit (this creates 12-digit total)
      const formattedSequence = sequenceNumber.toString().padStart(1, '0');
      return schoolUdiseCode + formattedSequence;
   };

   // Static method for validating Aadhaar number (basic checksum)
   UDISEStudent.validateAadhaarNumber = function (aadhaarNumber) {
      if (!aadhaarNumber || aadhaarNumber.length !== 12) {
         return false;
      }

      // Basic numeric validation
      if (!/^\d{12}$/.test(aadhaarNumber)) {
         return false;
      }

      // Verhoeff algorithm validation for Aadhaar
      const d = [
         [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
         [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
         [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
         [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
         [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
         [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
         [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
         [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
         [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
         [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
      ];

      const p = [
         [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
         [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
         [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
         [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
         [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
         [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
         [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
         [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
      ];

      let c = 0;
      const reversedArray = aadhaarNumber.split('').map(Number).reverse();

      for (let i = 0; i < reversedArray.length; i++) {
         c = d[c][p[i % 8][reversedArray[i]]];
      }

      return c === 0;
   };

   // Instance method for data validation before government submission
   UDISEStudent.prototype.validateForSubmission = function () {
      const errors = [];

      if (!this.udise_student_id) {
         errors.push('UDISE+ Student ID is required');
      }

      if (!this.student_id) {
         errors.push('Student reference is required');
      }

      if (!this.udise_school_id) {
         errors.push('UDISE+ School reference is required');
      }

      if (!this.enrollment_date) {
         errors.push('Enrollment date is required');
      }

      if (!this.academic_session) {
         errors.push('Academic session is required');
      }

      if (!this.census_year) {
         errors.push('Census year is required');
      }

      if (this.aadhaar_number && !UDISEStudent.validateAadhaarNumber(this.aadhaar_number)) {
         errors.push('Invalid Aadhaar number format');
      }

      return {
         isValid: errors.length === 0,
         errors: errors,
      };
   };

   return UDISEStudent;
}

module.exports = {
   defineUDISEStudent,
};
