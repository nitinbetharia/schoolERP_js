const Joi = require('joi');

/**
 * Simple Validation Schemas for School ERP
 * Basic validation patterns without complex references
 */

const ValidationSchemas = {
  // User validation
  user: {
    create: Joi.object({
      full_name: Joi.string().min(2).max(255).required(),
      email: Joi.string().email().max(255).required(),
      mobile: Joi.string().pattern(/^[0-9]{10}$/).required(),
      password: Joi.string().min(8).max(128).required(),
      role: Joi.string().valid('SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'ACCOUNTANT', 'PARENT').required(),
      school_id: Joi.number().integer().positive().allow(null),
      status: Joi.string().valid('ACTIVE', 'INACTIVE', 'PENDING').default('ACTIVE')
    }),

    update: Joi.object({
      id: Joi.number().integer().positive().required(),
      full_name: Joi.string().min(2).max(255),
      email: Joi.string().email().max(255),
      mobile: Joi.string().pattern(/^[0-9]{10}$/),
      role: Joi.string().valid('SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'ACCOUNTANT', 'PARENT'),
      school_id: Joi.number().integer().positive().allow(null),
      status: Joi.string().valid('ACTIVE', 'INACTIVE', 'PENDING')
    })
  },

  // Student validation
  student: {
    create: Joi.object({
      full_name: Joi.string().min(2).max(255).required(),
      email: Joi.string().email().max(255).allow(null, ''),
      mobile: Joi.string().pattern(/^[0-9]{10}$/).allow(null, ''),
      date_of_birth: Joi.date().max('now').required(),
      gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER').required(),
      class_id: Joi.number().integer().positive().required(),
      school_id: Joi.number().integer().positive().required(),
      admission_date: Joi.date().default(() => new Date()),
      status: Joi.string().valid('ACTIVE', 'INACTIVE', 'TRANSFERRED', 'GRADUATED').default('ACTIVE')
    }),

    update: Joi.object({
      id: Joi.number().integer().positive().required(),
      full_name: Joi.string().min(2).max(255),
      email: Joi.string().email().max(255).allow(null, ''),
      mobile: Joi.string().pattern(/^[0-9]{10}$/).allow(null, ''),
      date_of_birth: Joi.date().max('now'),
      gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER'),
      class_id: Joi.number().integer().positive(),
      status: Joi.string().valid('ACTIVE', 'INACTIVE', 'TRANSFERRED', 'GRADUATED')
    })
  },

  // Trust validation
  trust: {
    create: Joi.object({
      trust_name: Joi.string().min(2).max(255).required(),
      trust_code: Joi.string().pattern(/^[A-Z0-9_]{3,20}$/).required(),
      registration_number: Joi.string().max(100).required(),
      registration_date: Joi.date().required(),
      contact_email: Joi.string().email().max(255).required(),
      contact_phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
      address: Joi.string().max(2000).required(),
      city: Joi.string().max(100).required(),
      state: Joi.string().max(100).required(),
      pincode: Joi.string().pattern(/^[0-9]{6}$/).required()
    })
  },

  // School validation
  school: {
    create: Joi.object({
      school_name: Joi.string().min(2).max(255).required(),
      school_code: Joi.string().pattern(/^[A-Z0-9_]{3,20}$/).required(),
      address: Joi.string().max(2000).required(),
      city: Joi.string().max(100).required(),
      state: Joi.string().max(100).required(),
      pincode: Joi.string().pattern(/^[0-9]{6}$/).required(),
      phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
      email: Joi.string().email().max(255).required(),
      principal_name: Joi.string().max(255).allow(null, ''),
      principal_email: Joi.string().email().max(255).allow(null, ''),
      establishment_date: Joi.date().required(),
      status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE')
    })
  },

  // Authentication validation
  auth: {
    login: Joi.object({
      email: Joi.string().email().max(255).required(),
      password: Joi.string().min(1).max(128).required(),
      remember_me: Joi.boolean().default(false)
    }),

    register: Joi.object({
      full_name: Joi.string().min(2).max(255).required(),
      email: Joi.string().email().max(255).required(),
      mobile: Joi.string().pattern(/^[0-9]{10}$/).required(),
      password: Joi.string().min(8).max(128).required(),
      registration_type: Joi.string().valid('TRUST_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT').required(),
      accept_terms: Joi.boolean().valid(true).required()
    }),

    forgotPassword: Joi.object({
      email: Joi.string().email().max(255).required()
    }),

    resetPassword: Joi.object({
      token: Joi.string().required(),
      password: Joi.string().min(8).max(128).required(),
      confirm_password: Joi.string().valid(Joi.ref('password')).required()
    })
  },

  // Fee validation
  fee: {
    structure: Joi.object({
      structure_name: Joi.string().min(2).max(255).required(),
      class_id: Joi.number().integer().positive().required(),
      academic_year: Joi.string().pattern(/^[0-9]{4}-[0-9]{2}$/).required(),
      amount: Joi.number().precision(2).positive().required(),
      due_date: Joi.date().required(),
      late_fee_amount: Joi.number().precision(2).positive().allow(null),
      description: Joi.string().max(2000).allow(null, '')
    }),

    collection: Joi.object({
      student_id: Joi.number().integer().positive().required(),
      amount_paid: Joi.number().precision(2).positive().required(),
      payment_method: Joi.string().valid('CASH', 'CHEQUE', 'ONLINE', 'CARD').required(),
      payment_reference: Joi.string().max(255).allow(null, ''),
      paid_date: Joi.date().default(() => new Date()),
      collected_by: Joi.number().integer().positive().required(),
      remarks: Joi.string().max(2000).allow(null, '')
    })
  },

  // Attendance validation
  attendance: {
    mark: Joi.object({
      student_id: Joi.number().integer().positive().required(),
      attendance_date: Joi.date().required(),
      status: Joi.string().valid('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY').required(),
      marked_by: Joi.number().integer().positive().required(),
      remarks: Joi.string().max(500).allow(null, '')
    }),

    bulkMark: Joi.object({
      class_id: Joi.number().integer().positive().required(),
      attendance_date: Joi.date().required(),
      marked_by: Joi.number().integer().positive().required(),
      attendance_records: Joi.array().items(
        Joi.object({
          student_id: Joi.number().integer().positive().required(),
          status: Joi.string().valid('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY').required()
        })
      ).min(1).required()
    })
  },

  // General validation
  general: {
    id: Joi.object({
      id: Joi.number().integer().positive().required()
    }),

    pagination: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(25),
      sort: Joi.string().max(100).default('id'),
      order: Joi.string().valid('ASC', 'DESC').default('ASC')
    }),

    search: Joi.object({
      query: Joi.string().min(1).max(255).required(),
      type: Joi.string().valid('students', 'users', 'global').default('global')
    })
  }
};

module.exports = ValidationSchemas;