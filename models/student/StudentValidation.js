const Joi = require('joi');

/**
 * Student Validation Schemas
 * Comprehensive validation schemas for Student model operations
 * File size: ~280 lines (within industry standards)
 */

/**
 * Basic validation schemas for common fields
 */
const commonValidation = {
   id: Joi.number().integer().positive(),
   admissionNumber: Joi.string().max(50).uppercase(),
   rollNumber: Joi.string().max(20).allow(null),
   email: Joi.string().email().allow(null),
   phone: Joi.string()
      .pattern(/^[\d\-\+\s\(\)]+$/)
      .max(15)
      .allow(null),
   name: Joi.string().max(100).allow(null),
   academicYear: Joi.string()
      .pattern(/^\d{4}-\d{2}$/)
      .required(),
   date: Joi.date().iso().allow(null),
   gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER').required(),
   bloodGroup: Joi.string().max(10).allow(null),
   category: Joi.string().valid('GENERAL', 'SC', 'ST', 'OBC', 'EWS', 'OTHER').allow(null),
   income: Joi.number().precision(2).min(0).allow(null),
   percentage: Joi.number().min(0).max(100).allow(null),
};

/**
 * Validation schema for creating a new student
 */
const createStudentSchema = Joi.object({
   // Required core fields
   user_id: Joi.number().integer().positive().required(),
   admission_number: commonValidation.admissionNumber.required(),
   school_id: Joi.number().integer().positive().required(),
   academic_year: commonValidation.academicYear,
   admission_date: commonValidation.date.required(),
   date_of_birth: commonValidation.date.required(),
   gender: commonValidation.gender,

   // Optional academic fields
   roll_number: commonValidation.rollNumber,
   class_id: Joi.number().integer().positive().allow(null),
   section_id: Joi.number().integer().positive().allow(null),
   stream: Joi.string().max(50).allow(null),
   subjects: Joi.array().items(Joi.string()).allow(null),

   // Personal information
   blood_group: commonValidation.bloodGroup,
   category: commonValidation.category,
   religion: Joi.string().max(50).allow(null),
   nationality: Joi.string().max(50).allow(null),
   mother_tongue: Joi.string().max(50).allow(null),

   // Address information
   address: Joi.string().allow(null),
   city: Joi.string().max(100).allow(null),
   state: Joi.string().max(100).allow(null),
   postal_code: Joi.string().max(20).allow(null),
   phone: commonValidation.phone,
   email: commonValidation.email,

   // Previous school information
   previous_school: Joi.string().max(200).allow(null),
   previous_class: Joi.string().max(50).allow(null),
   transfer_certificate_number: Joi.string().max(100).allow(null),

   // Parent information
   father_name: commonValidation.name,
   father_phone: commonValidation.phone,
   father_email: commonValidation.email,
   father_occupation: Joi.string().max(100).allow(null),
   father_annual_income: commonValidation.income,

   mother_name: commonValidation.name,
   mother_phone: commonValidation.phone,
   mother_email: commonValidation.email,
   mother_occupation: Joi.string().max(100).allow(null),
   mother_annual_income: commonValidation.income,

   guardian_name: commonValidation.name,
   guardian_phone: commonValidation.phone,
   guardian_email: commonValidation.email,
   guardian_relation: Joi.string().max(50).allow(null),
   guardian_occupation: Joi.string().max(100).allow(null),

   // Emergency contact
   emergency_contact_name: commonValidation.name,
   emergency_contact_phone: commonValidation.phone,
   emergency_contact_relation: Joi.string().max(50).allow(null),

   // Medical information
   medical_conditions: Joi.string().allow(null),
   allergies: Joi.string().allow(null),
   medications: Joi.string().allow(null),
   doctor_name: commonValidation.name,
   doctor_phone: commonValidation.phone,

   // Transport information
   transport_required: Joi.boolean().default(false),
   transport_route: Joi.string().max(100).allow(null),
   pickup_point: Joi.string().max(200).allow(null),
   drop_point: Joi.string().max(200).allow(null),

   // Hostel information
   hostel_required: Joi.boolean().default(false),
   hostel_block: Joi.string().max(50).allow(null),
   hostel_room_number: Joi.string().max(20).allow(null),

   // Fee information
   fee_structure: Joi.string().max(100).allow(null),
   scholarship: commonValidation.percentage,
   scholarship_reason: Joi.string().max(200).allow(null),

   // Documents
   documents: Joi.array()
      .items(
         Joi.object({
            type: Joi.string().required(),
            url: Joi.string().uri().required(),
            name: Joi.string().required(),
            uploadedAt: Joi.date().iso(),
         })
      )
      .allow(null),

   // Academic performance
   current_grade: Joi.string().max(10).allow(null),
   academic_performance: Joi.object().allow(null),

   // Status fields
   admission_status: Joi.string().valid('APPLIED', 'APPROVED', 'ENROLLED', 'REJECTED', 'WAITLISTED').default('APPLIED'),
   student_status: Joi.string()
      .valid('ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRANSFERRED', 'GRADUATED', 'DROPPED')
      .default('ACTIVE'),

   // Additional information
   special_needs: Joi.string().allow(null),
   talents: Joi.array().items(Joi.string()).allow(null),
   hobbies: Joi.array().items(Joi.string()).allow(null),
   achievements: Joi.array()
      .items(
         Joi.object({
            title: Joi.string().required(),
            description: Joi.string(),
            date: Joi.date().iso(),
            category: Joi.string(),
         })
      )
      .allow(null),

   // System fields
   remarks: Joi.string().allow(null),
   additional_info: Joi.object().allow(null),
   created_by: Joi.number().integer().positive().allow(null),
});

/**
 * Validation schema for updating a student
 */
const updateStudentSchema = Joi.object({
   id: commonValidation.id.required(),

   // All fields from create schema but optional
   user_id: Joi.number().integer().positive(),
   admission_number: commonValidation.admissionNumber,
   school_id: Joi.number().integer().positive(),
   academic_year: commonValidation.academicYear,
   admission_date: commonValidation.date,
   date_of_birth: commonValidation.date,
   gender: commonValidation.gender,

   roll_number: commonValidation.rollNumber,
   class_id: Joi.number().integer().positive().allow(null),
   section_id: Joi.number().integer().positive().allow(null),
   stream: Joi.string().max(50).allow(null),
   subjects: Joi.array().items(Joi.string()).allow(null),

   blood_group: commonValidation.bloodGroup,
   category: commonValidation.category,
   religion: Joi.string().max(50).allow(null),
   nationality: Joi.string().max(50).allow(null),
   mother_tongue: Joi.string().max(50).allow(null),

   address: Joi.string().allow(null),
   city: Joi.string().max(100).allow(null),
   state: Joi.string().max(100).allow(null),
   postal_code: Joi.string().max(20).allow(null),
   phone: commonValidation.phone,
   email: commonValidation.email,

   previous_school: Joi.string().max(200).allow(null),
   previous_class: Joi.string().max(50).allow(null),
   transfer_certificate_number: Joi.string().max(100).allow(null),

   // Parent information (all optional for updates)
   father_name: commonValidation.name,
   father_phone: commonValidation.phone,
   father_email: commonValidation.email,
   father_occupation: Joi.string().max(100).allow(null),
   father_annual_income: commonValidation.income,

   mother_name: commonValidation.name,
   mother_phone: commonValidation.phone,
   mother_email: commonValidation.email,
   mother_occupation: Joi.string().max(100).allow(null),
   mother_annual_income: commonValidation.income,

   guardian_name: commonValidation.name,
   guardian_phone: commonValidation.phone,
   guardian_email: commonValidation.email,
   guardian_relation: Joi.string().max(50).allow(null),
   guardian_occupation: Joi.string().max(100).allow(null),

   emergency_contact_name: commonValidation.name,
   emergency_contact_phone: commonValidation.phone,
   emergency_contact_relation: Joi.string().max(50).allow(null),

   medical_conditions: Joi.string().allow(null),
   allergies: Joi.string().allow(null),
   medications: Joi.string().allow(null),
   doctor_name: commonValidation.name,
   doctor_phone: commonValidation.phone,

   transport_required: Joi.boolean(),
   transport_route: Joi.string().max(100).allow(null),
   pickup_point: Joi.string().max(200).allow(null),
   drop_point: Joi.string().max(200).allow(null),

   hostel_required: Joi.boolean(),
   hostel_block: Joi.string().max(50).allow(null),
   hostel_room_number: Joi.string().max(20).allow(null),

   fee_structure: Joi.string().max(100).allow(null),
   scholarship: commonValidation.percentage,
   scholarship_reason: Joi.string().max(200).allow(null),

   documents: Joi.array()
      .items(
         Joi.object({
            type: Joi.string().required(),
            url: Joi.string().uri().required(),
            name: Joi.string().required(),
            uploadedAt: Joi.date().iso(),
         })
      )
      .allow(null),

   current_grade: Joi.string().max(10).allow(null),
   academic_performance: Joi.object().allow(null),

   admission_status: Joi.string().valid('APPLIED', 'APPROVED', 'ENROLLED', 'REJECTED', 'WAITLISTED'),
   student_status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRANSFERRED', 'GRADUATED', 'DROPPED'),

   special_needs: Joi.string().allow(null),
   talents: Joi.array().items(Joi.string()).allow(null),
   hobbies: Joi.array().items(Joi.string()).allow(null),
   achievements: Joi.array()
      .items(
         Joi.object({
            title: Joi.string().required(),
            description: Joi.string(),
            date: Joi.date().iso(),
            category: Joi.string(),
         })
      )
      .allow(null),

   remarks: Joi.string().allow(null),
   additional_info: Joi.object().allow(null),
   updated_by: Joi.number().integer().positive().allow(null),
});

/**
 * Validation schema for querying students
 */
const queryStudentSchema = Joi.object({
   id: commonValidation.id,
   user_id: Joi.number().integer().positive(),
   admission_number: commonValidation.admissionNumber,
   school_id: Joi.number().integer().positive(),
   class_id: Joi.number().integer().positive(),
   section_id: Joi.number().integer().positive(),
   academic_year: commonValidation.academicYear,
   admission_status: Joi.string().valid('APPLIED', 'APPROVED', 'ENROLLED', 'REJECTED', 'WAITLISTED'),
   student_status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRANSFERRED', 'GRADUATED', 'DROPPED'),

   // Pagination and sorting
   page: Joi.number().integer().min(1).default(1),
   limit: Joi.number().integer().min(1).max(100).default(20),
   sortBy: Joi.string()
      .valid('id', 'admission_number', 'admission_date', 'date_of_birth', 'created_at', 'updated_at')
      .default('created_at'),
   sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC'),

   // Search
   search: Joi.string().max(100),
   searchFields: Joi.array()
      .items(Joi.string().valid('admission_number', 'father_name', 'mother_name', 'guardian_name', 'phone', 'email'))
      .default(['admission_number']),
});

/**
 * Validation schema for student transfer
 */
const transferStudentSchema = Joi.object({
   id: commonValidation.id.required(),
   transfer_date: commonValidation.date.required(),
   transfer_reason: Joi.string().required(),
   transfer_to_school: Joi.string().max(200).required(),
   updated_by: Joi.number().integer().positive().required(),
});

/**
 * Validation schema for student graduation
 */
const graduateStudentSchema = Joi.object({
   id: commonValidation.id.required(),
   graduation_date: commonValidation.date.required(),
   graduation_grade: Joi.string().max(10).required(),
   graduation_remarks: Joi.string().allow(null),
   updated_by: Joi.number().integer().positive().required(),
});

/**
 * Validation schema for bulk operations
 */
const bulkStudentSchema = Joi.object({
   students: Joi.array()
      .items(
         Joi.object({
            id: commonValidation.id.required(),
            // Add specific fields that can be bulk updated
            class_id: Joi.number().integer().positive().allow(null),
            section_id: Joi.number().integer().positive().allow(null),
            student_status: Joi.string().valid(
               'ACTIVE',
               'INACTIVE',
               'SUSPENDED',
               'TRANSFERRED',
               'GRADUATED',
               'DROPPED'
            ),
         })
      )
      .min(1)
      .max(100)
      .required(),
   updated_by: Joi.number().integer().positive().required(),
});

module.exports = {
   createStudentSchema,
   updateStudentSchema,
   queryStudentSchema,
   transferStudentSchema,
   graduateStudentSchema,
   bulkStudentSchema,
   commonValidation,
};
