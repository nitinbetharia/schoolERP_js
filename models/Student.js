const { DataTypes } = require('sequelize');

/**
 * Student Model
 * Manages complete student lifecycle from admission to graduation
 * This is a critical model that extends the User concept with academic-specific data
 */
const defineStudent = (sequelize) => {
   const Student = sequelize.define(
      'Student',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
         },
         user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: {
               model: 'users',
               key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            comment: 'Reference to users table for login credentials and basic info',
         },
         admission_number: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            comment: 'Unique admission number across the trust',
         },
         roll_number: {
            type: DataTypes.STRING(20),
            allowNull: true,
            comment: 'Class-specific roll number',
         },
         school_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'schools',
               key: 'id',
            },
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE',
         },
         class_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
               model: 'classes',
               key: 'id',
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
            comment: 'Current class assignment',
         },
         section_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
               model: 'sections',
               key: 'id',
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
            comment: 'Current section assignment',
         },
         academic_year: {
            type: DataTypes.STRING(20),
            allowNull: false,
            comment: 'Academic year like "2024-25"',
         },
         admission_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: 'Date of admission to the school',
         },
         date_of_birth: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: 'Student date of birth',
         },
         gender: {
            type: DataTypes.ENUM('MALE', 'FEMALE', 'OTHER'),
            allowNull: false,
         },
         blood_group: {
            type: DataTypes.STRING(10),
            allowNull: true,
            comment: 'Blood group like A+, B-, O+, etc.',
         },
         category: {
            type: DataTypes.ENUM('GENERAL', 'SC', 'ST', 'OBC', 'EWS', 'OTHER'),
            allowNull: true,
            comment: 'Social category for reservations',
         },
         religion: {
            type: DataTypes.STRING(50),
            allowNull: true,
         },
         nationality: {
            type: DataTypes.STRING(50),
            allowNull: true,
            defaultValue: 'Indian',
         },
         mother_tongue: {
            type: DataTypes.STRING(50),
            allowNull: true,
         },
         address: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Current residential address',
         },
         city: {
            type: DataTypes.STRING(100),
            allowNull: true,
         },
         state: {
            type: DataTypes.STRING(100),
            allowNull: true,
         },
         postal_code: {
            type: DataTypes.STRING(20),
            allowNull: true,
         },
         phone: {
            type: DataTypes.STRING(15),
            allowNull: true,
            comment: 'Student contact number',
         },
         email: {
            type: DataTypes.STRING(255),
            allowNull: true,
            validate: { isEmail: true },
            comment: 'Student personal email (different from login email)',
         },
         previous_school: {
            type: DataTypes.STRING(200),
            allowNull: true,
            comment: 'Previous school attended',
         },
         previous_class: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: 'Last class completed in previous school',
         },
         transfer_certificate_number: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'TC number from previous school',
         },

         // Parent/Guardian Information
         father_name: {
            type: DataTypes.STRING(100),
            allowNull: true,
         },
         father_phone: {
            type: DataTypes.STRING(15),
            allowNull: true,
         },
         father_email: {
            type: DataTypes.STRING(255),
            allowNull: true,
            validate: { isEmail: true },
         },
         father_occupation: {
            type: DataTypes.STRING(100),
            allowNull: true,
         },
         father_annual_income: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true,
            comment: 'Father annual income for fee structure determination',
         },

         mother_name: {
            type: DataTypes.STRING(100),
            allowNull: true,
         },
         mother_phone: {
            type: DataTypes.STRING(15),
            allowNull: true,
         },
         mother_email: {
            type: DataTypes.STRING(255),
            allowNull: true,
            validate: { isEmail: true },
         },
         mother_occupation: {
            type: DataTypes.STRING(100),
            allowNull: true,
         },
         mother_annual_income: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true,
            comment: 'Mother annual income for fee structure determination',
         },

         guardian_name: {
            type: DataTypes.STRING(100),
            allowNull: true,
         },
         guardian_phone: {
            type: DataTypes.STRING(15),
            allowNull: true,
         },
         guardian_email: {
            type: DataTypes.STRING(255),
            allowNull: true,
            validate: { isEmail: true },
         },
         guardian_relation: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: 'Relationship with guardian (Uncle, Aunt, Grandparent, etc.)',
         },
         guardian_occupation: {
            type: DataTypes.STRING(100),
            allowNull: true,
         },

         // Emergency Contact (can be different from parents)
         emergency_contact_name: {
            type: DataTypes.STRING(100),
            allowNull: true,
         },
         emergency_contact_phone: {
            type: DataTypes.STRING(15),
            allowNull: true,
         },
         emergency_contact_relation: {
            type: DataTypes.STRING(50),
            allowNull: true,
         },

         // Medical Information
         medical_conditions: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Any chronic medical conditions or special needs',
         },
         allergies: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Known allergies and their severity',
         },
         medications: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Regular medications student takes',
         },
         doctor_name: {
            type: DataTypes.STRING(100),
            allowNull: true,
         },
         doctor_phone: {
            type: DataTypes.STRING(15),
            allowNull: true,
         },

         // Transport Information
         transport_required: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
         },
         transport_route: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Bus route or transport route code',
         },
         pickup_point: {
            type: DataTypes.STRING(200),
            allowNull: true,
         },
         drop_point: {
            type: DataTypes.STRING(200),
            allowNull: true,
         },

         // Hostel Information
         hostel_required: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
         },
         hostel_block: {
            type: DataTypes.STRING(50),
            allowNull: true,
         },
         hostel_room_number: {
            type: DataTypes.STRING(20),
            allowNull: true,
         },

         // Academic Information
         stream: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: 'Stream like Science, Commerce, Arts (for higher classes)',
         },
         subjects: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Array of subject codes/names the student is enrolled in',
         },

         // Fee Information
         fee_structure: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Fee structure category applicable to student',
         },
         scholarship: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            comment: 'Scholarship percentage (0-100)',
         },
         scholarship_reason: {
            type: DataTypes.STRING(200),
            allowNull: true,
         },

         // Documents
         documents: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Array of uploaded documents with their URLs and types',
         },

         // Academic Performance Summary
         current_grade: {
            type: DataTypes.STRING(10),
            allowNull: true,
            comment: 'Current overall grade/percentage',
         },
         academic_performance: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Summary of academic performance metrics',
         },

         // Status and Lifecycle
         admission_status: {
            type: DataTypes.ENUM('APPLIED', 'APPROVED', 'ENROLLED', 'REJECTED', 'WAITLISTED'),
            defaultValue: 'APPLIED',
            comment: 'Admission process status',
         },
         student_status: {
            type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRANSFERRED', 'GRADUATED', 'DROPPED'),
            defaultValue: 'ACTIVE',
            comment: 'Current student status in school',
         },

         // Transfer Information
         transfer_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: 'Date of transfer (if transferred out)',
         },
         transfer_reason: {
            type: DataTypes.TEXT,
            allowNull: true,
         },
         transfer_to_school: {
            type: DataTypes.STRING(200),
            allowNull: true,
         },

         // Graduation Information
         graduation_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
         },
         graduation_grade: {
            type: DataTypes.STRING(10),
            allowNull: true,
         },
         graduation_remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
         },

         // Additional Information
         special_needs: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Any special educational or accessibility needs',
         },
         talents: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Array of special talents or skills',
         },
         hobbies: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Array of hobbies and interests',
         },
         achievements: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Array of achievements and awards',
         },

         // System fields
         remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Internal remarks by school administration',
         },
         additional_info: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Additional flexible information',
         },
         created_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
         },
         updated_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
         },
         created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
         },
         updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
         },
      },
      {
         tableName: 'students',
         timestamps: true,
         createdAt: 'created_at',
         updatedAt: 'updated_at',
         indexes: [
            // Note: user_id and admission_number already have unique: true in field definitions
            // Only adding non-unique indexes here
            {
               name: 'student_school_id_idx',
               fields: ['school_id'],
            },
            {
               name: 'student_class_section_idx',
               fields: ['class_id', 'section_id'],
            },
         ],
         hooks: {
            beforeCreate: (student) => {
               // Ensure admission_number is always uppercase
               if (student.admission_number) {
                  student.admission_number = student.admission_number.toUpperCase();
               }
            },
            beforeUpdate: (student) => {
               // Ensure admission_number is always uppercase
               if (student.admission_number) {
                  student.admission_number = student.admission_number.toUpperCase();
               }
            },
         },
      }
   );

   return Student;
};

/**
 * Student Validation Schemas
 * Following Q59-ENFORCED pattern - reusable across API and web routes
 */
const Joi = require('joi');
const { commonSchemas } = require('../utils/errors');

const studentValidationSchemas = {
   create: Joi.object({
      // User reference (required)
      user_id: Joi.number().integer().positive().required().messages({
         'number.base': 'User ID must be a number',
         'number.positive': 'User ID must be positive',
         'any.required': 'User ID is required',
      }),

      // Basic identification (required)
      admission_number: Joi.string().trim().uppercase().min(3).max(50).required().messages({
         'string.empty': 'Admission number is required',
         'string.min': 'Admission number must be at least 3 characters',
         'string.max': 'Admission number cannot exceed 50 characters',
      }),

      school_id: Joi.number().integer().positive().required().messages({
         'any.required': 'School ID is required',
      }),

      // Academic information (required)
      class_id: Joi.number().integer().positive().allow(null).optional(),
      section_id: Joi.number().integer().positive().allow(null).optional(),
      academic_year: Joi.string().trim().pattern(/^\d{4}-\d{2}$/).required().messages({
         'string.pattern.base': 'Academic year must be in format YYYY-YY (e.g., 2024-25)',
         'any.required': 'Academic year is required',
      }),

      admission_date: Joi.date().max('now').required().messages({
         'date.max': 'Admission date cannot be in the future',
         'any.required': 'Admission date is required',
      }),

      // Personal information (required)
      date_of_birth: Joi.date().max('now').required().messages({
         'date.max': 'Date of birth cannot be in the future',
         'any.required': 'Date of birth is required',
      }),

      gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER').required().messages({
         'any.only': 'Gender must be MALE, FEMALE, or OTHER',
         'any.required': 'Gender is required',
      }),

      // Optional personal information
      blood_group: Joi.string().trim().max(10).allow(null, '').optional(),
      category: Joi.string().valid('GENERAL', 'SC', 'ST', 'OBC', 'EWS', 'OTHER').allow(null).optional(),
      religion: Joi.string().trim().max(50).allow(null, '').optional(),
      nationality: Joi.string().trim().max(50).allow(null, '').optional(),
      mother_tongue: Joi.string().trim().max(50).allow(null, '').optional(),

      // Address information
      address: Joi.string().trim().max(500).allow(null, '').optional(),
      city: Joi.string().trim().max(100).allow(null, '').optional(),
      state: Joi.string().trim().max(100).allow(null, '').optional(),
      postal_code: Joi.string().trim().pattern(/^\d{5,10}$/).allow(null, '').optional().messages({
         'string.pattern.base': 'Postal code must be 5-10 digits',
      }),

      // Contact information
      phone: Joi.string().pattern(/^\d{10,15}$/).allow(null, '').optional().messages({
         'string.pattern.base': 'Phone number must be 10-15 digits',
      }),
      email: Joi.string().email().max(255).allow(null, '').optional(),

      // Parent information
      father_name: Joi.string().trim().max(100).allow(null, '').optional(),
      father_phone: Joi.string().pattern(/^\d{10,15}$/).allow(null, '').optional(),
      father_email: Joi.string().email().max(255).allow(null, '').optional(),
      father_occupation: Joi.string().trim().max(100).allow(null, '').optional(),
      father_annual_income: Joi.number().positive().allow(null).optional(),

      mother_name: Joi.string().trim().max(100).allow(null, '').optional(),
      mother_phone: Joi.string().pattern(/^\d{10,15}$/).allow(null, '').optional(),
      mother_email: Joi.string().email().max(255).allow(null, '').optional(),
      mother_occupation: Joi.string().trim().max(100).allow(null, '').optional(),
      mother_annual_income: Joi.number().positive().allow(null).optional(),

      // Guardian information
      guardian_name: Joi.string().trim().max(100).allow(null, '').optional(),
      guardian_phone: Joi.string().pattern(/^\d{10,15}$/).allow(null, '').optional(),
      guardian_email: Joi.string().email().max(255).allow(null, '').optional(),
      guardian_relation: Joi.string().trim().max(50).allow(null, '').optional(),
      guardian_occupation: Joi.string().trim().max(100).allow(null, '').optional(),

      // Emergency contact
      emergency_contact_name: Joi.string().trim().max(100).allow(null, '').optional(),
      emergency_contact_phone: Joi.string().pattern(/^\d{10,15}$/).allow(null, '').optional(),
      emergency_contact_relation: Joi.string().trim().max(50).allow(null, '').optional(),

      // Status fields
      admission_status: Joi.string().valid('APPLIED', 'APPROVED', 'ENROLLED', 'REJECTED', 'WAITLISTED').optional(),
      student_status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRANSFERRED', 'GRADUATED', 'DROPPED').optional(),

      // Transport and hostel
      transport_required: Joi.boolean().optional(),
      hostel_required: Joi.boolean().optional(),
   }),

   update: Joi.object({
      // Allow updating most fields, but not core identity fields
      admission_number: Joi.forbidden().messages({
         'any.unknown': 'Admission number cannot be updated',
      }),
      user_id: Joi.forbidden().messages({
         'any.unknown': 'User ID cannot be updated',
      }),

      school_id: Joi.number().integer().positive().optional(),
      class_id: Joi.number().integer().positive().allow(null).optional(),
      section_id: Joi.number().integer().positive().allow(null).optional(),
      academic_year: Joi.string().trim().pattern(/^\d{4}-\d{2}$/).optional(),

      // Personal information updates
      gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER').optional(),
      blood_group: Joi.string().trim().max(10).allow(null, '').optional(),
      category: Joi.string().valid('GENERAL', 'SC', 'ST', 'OBC', 'EWS', 'OTHER').allow(null).optional(),
      religion: Joi.string().trim().max(50).allow(null, '').optional(),

      // Contact and address updates
      phone: Joi.string().pattern(/^\d{10,15}$/).allow(null, '').optional(),
      email: Joi.string().email().max(255).allow(null, '').optional(),
      address: Joi.string().trim().max(500).allow(null, '').optional(),
      city: Joi.string().trim().max(100).allow(null, '').optional(),
      state: Joi.string().trim().max(100).allow(null, '').optional(),
      postal_code: Joi.string().trim().pattern(/^\d{5,10}$/).allow(null, '').optional(),

      // Parent information updates
      father_name: Joi.string().trim().max(100).allow(null, '').optional(),
      father_phone: Joi.string().pattern(/^\d{10,15}$/).allow(null, '').optional(),
      father_email: Joi.string().email().max(255).allow(null, '').optional(),
      mother_name: Joi.string().trim().max(100).allow(null, '').optional(),
      mother_phone: Joi.string().pattern(/^\d{10,15}$/).allow(null, '').optional(),
      mother_email: Joi.string().email().max(255).allow(null, '').optional(),

      // Status updates
      student_status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRANSFERRED', 'GRADUATED', 'DROPPED').optional(),
      transport_required: Joi.boolean().optional(),
      hostel_required: Joi.boolean().optional(),
   }),

   transfer: Joi.object({
      transfer_reason: Joi.string().trim().min(10).max(500).required().messages({
         'string.empty': 'Transfer reason is required',
         'string.min': 'Transfer reason must be at least 10 characters',
      }),
      transfer_to_school: Joi.string().trim().max(200).allow(null, '').optional(),
      transfer_date: Joi.date().max('now').required(),
   }),

   promote: Joi.object({
      new_class_id: Joi.number().integer().positive().required().messages({
         'any.required': 'New class ID is required for promotion',
      }),
      new_section_id: Joi.number().integer().positive().allow(null).optional(),
      new_academic_year: Joi.string().trim().pattern(/^\d{4}-\d{2}$/).required().messages({
         'any.required': 'New academic year is required for promotion',
      }),
   }),

   statusUpdate: Joi.object({
      student_status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRANSFERRED', 'GRADUATED', 'DROPPED').required(),
      status_reason: Joi.string().trim().min(5).max(200).optional(),
   }),
};

module.exports = { defineStudent, studentValidationSchemas };
