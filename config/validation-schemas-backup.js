const Joi = require('joi');

/**
 * Comprehensive Validation Schemas
 * All input validation schemas using Joi with strict mode
 */

const ValidationSchemas = {
  // Common validation patterns
  common: {
    id: Joi.number().integer().positive().required(),
    email: Joi.string().email().max(255).required(),
    phone: Joi.string().pattern(/^[+]?[0-9\s\-\(\)]{10,15}$/).required(),
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .message('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
      .required(),
    date: Joi.date().iso().required(),
    optionalDate: Joi.date().iso().allow(null),
    name: Joi.string().min(2).max(100).pattern(/^[a-zA-Z\s]+$/).required(),
    optionalName: Joi.string().min(2).max(100).pattern(/^[a-zA-Z\s]+$/).allow(null, ''),
    code: Joi.string().pattern(/^[A-Z0-9_]{3,20}$/).required(),
    status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE'),
    gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER').required(),
    url: Joi.string().uri().allow(null, ''),
    text: Joi.string().max(255),
    longText: Joi.string().max(2000),
    amount: Joi.number().precision(2).positive().required(),
    optionalAmount: Joi.number().precision(2).positive().allow(null),
    percentage: Joi.number().min(0).max(100).precision(2),
    academicYear: Joi.string().pattern(/^[0-9]{4}-[0-9]{2}$/).required(),
    postalCode: Joi.string().pattern(/^[0-9]{6}$/).required()
  },

  // System User Schemas
  systemUser: {
    create: Joi.object({
      username: Joi.string().alphanum().min(3).max(50).required(),
      email: Joi.string().email().max(255).required(),
      password: Joi.ref('common.password'),
      first_name: Joi.ref('common.name'),
      last_name: Joi.ref('common.name'),
      role: Joi.string().valid('SYSTEM_ADMIN', 'GROUP_ADMIN').required(),
      phone: Joi.ref('common.phone'),
      status: Joi.ref('common.status')
    }).strict(),

    update: Joi.object({
      id: Joi.ref('common.id'),
      username: Joi.string().alphanum().min(3).max(50),
      email: Joi.string().email().max(255),
      first_name: Joi.ref('common.name'),
      last_name: Joi.ref('common.name'),
      role: Joi.string().valid('SYSTEM_ADMIN', 'GROUP_ADMIN'),
      phone: Joi.ref('common.phone'),
      status: Joi.ref('common.status')
    }).strict().min(1),

    login: Joi.object({
      username: Joi.string().required(),
      password: Joi.string().required()
    }).strict()
  },

  // Trust Schemas
  trust: {
    create: Joi.object({
      trust_name: Joi.string().min(3).max(200).required(),
      trust_code: Joi.ref('common.code'),
      subdomain: Joi.string().pattern(/^[a-z0-9]{3,50}$/).required(),
      contact_email: Joi.ref('common.email'),
      contact_phone: Joi.ref('common.phone'),
      address: Joi.ref('common.longText'),
      city: Joi.string().max(100).required(),
      state: Joi.string().max(100).required(),
      postal_code: Joi.ref('common.postalCode'),
      country: Joi.string().max(100).default('India'),
      website: Joi.ref('common.url'),
      logo_url: Joi.ref('common.url'),
      theme_config: Joi.object().allow(null),
      status: Joi.ref('common.status')
    }).strict(),

    update: Joi.object({
      id: Joi.ref('common.id'),
      trust_name: Joi.string().min(3).max(200),
      contact_email: Joi.string().email().max(255),
      contact_phone: Joi.ref('common.phone'),
      address: Joi.ref('common.longText'),
      city: Joi.string().max(100),
      state: Joi.string().max(100),
      postal_code: Joi.ref('common.postalCode'),
      country: Joi.string().max(100),
      website: Joi.ref('common.url'),
      logo_url: Joi.ref('common.url'),
      theme_config: Joi.object(),
      status: Joi.ref('common.status')
    }).strict().min(1)
  },

  // School Schemas
  school: {
    create: Joi.object({
      school_name: Joi.string().min(3).max(200).required(),
      school_code: Joi.ref('common.code'),
      address: Joi.ref('common.longText'),
      city: Joi.string().max(100).required(),
      state: Joi.string().max(100).required(),
      postal_code: Joi.ref('common.postalCode'),
      phone: Joi.ref('common.phone'),
      email: Joi.ref('common.email'),
      website: Joi.ref('common.url'),
      principal_name: Joi.string().min(3).max(200),
      principal_email: Joi.string().email().max(255),
      principal_phone: Joi.ref('common.phone'),
      affiliation_number: Joi.string().max(100).allow(null, ''),
      board: Joi.string().valid('CBSE', 'ICSE', 'STATE', 'IB', 'IGCSE', 'OTHER').required(),
      logo_url: Joi.ref('common.url'),
      status: Joi.ref('common.status')
    }).strict(),

    update: Joi.object({
      id: Joi.ref('common.id'),
      school_name: Joi.string().min(3).max(200),
      address: Joi.ref('common.longText'),
      city: Joi.string().max(100),
      state: Joi.string().max(100),
      postal_code: Joi.ref('common.postalCode'),
      phone: Joi.ref('common.phone'),
      email: Joi.string().email().max(255),
      website: Joi.ref('common.url'),
      principal_name: Joi.string().min(3).max(200),
      principal_email: Joi.string().email().max(255),
      principal_phone: Joi.ref('common.phone'),
      affiliation_number: Joi.string().max(100),
      board: Joi.string().valid('CBSE', 'ICSE', 'STATE', 'IB', 'IGCSE', 'OTHER'),
      logo_url: Joi.ref('common.url'),
      status: Joi.ref('common.status')
    }).strict().min(1)
  },

  // Academic Year Schema
  academicYear: {
    create: Joi.object({
      year_name: Joi.ref('common.academicYear'),
      start_date: Joi.ref('common.date'),
      end_date: Joi.ref('common.date'),
      is_current: Joi.boolean().default(false),
      status: Joi.string().valid('ACTIVE', 'INACTIVE', 'COMPLETED').default('ACTIVE')
    }).strict(),

    update: Joi.object({
      id: Joi.ref('common.id'),
      year_name: Joi.ref('common.academicYear'),
      start_date: Joi.ref('common.date'),
      end_date: Joi.ref('common.date'),
      is_current: Joi.boolean(),
      status: Joi.string().valid('ACTIVE', 'INACTIVE', 'COMPLETED')
    }).strict().min(1)
  },

  // Class Schema
  class: {
    create: Joi.object({
      class_name: Joi.string().max(50).required(),
      class_order: Joi.number().integer().positive().required(),
      school_id: Joi.ref('common.id'),
      academic_year_id: Joi.ref('common.id'),
      status: Joi.ref('common.status')
    }).strict(),

    update: Joi.object({
      id: Joi.ref('common.id'),
      class_name: Joi.string().max(50),
      class_order: Joi.number().integer().positive(),
      school_id: Joi.ref('common.id'),
      academic_year_id: Joi.ref('common.id'),
      status: Joi.ref('common.status')
    }).strict().min(1)
  },

  // Section Schema
  section: {
    create: Joi.object({
      section_name: Joi.string().max(10).required(),
      class_id: Joi.ref('common.id'),
      capacity: Joi.number().integer().min(1).max(100).default(30),
      status: Joi.ref('common.status')
    }).strict(),

    update: Joi.object({
      id: Joi.ref('common.id'),
      section_name: Joi.string().max(10),
      class_id: Joi.ref('common.id'),
      capacity: Joi.number().integer().min(1).max(100),
      status: Joi.ref('common.status')
    }).strict().min(1)
  },

  // User Schema
  user: {
    create: Joi.object({
      employee_id: Joi.string().max(20).allow(null, ''),
      first_name: Joi.ref('common.name'),
      last_name: Joi.ref('common.name'),
      email: Joi.ref('common.email'),
      phone: Joi.ref('common.phone'),
      password: Joi.ref('common.password'),
      role: Joi.string().valid('TRUST_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'ACCOUNTANT', 'PARENT', 'STUDENT').required(),
      status: Joi.string().valid('ACTIVE', 'INACTIVE', 'LOCKED').default('ACTIVE'),
      school_id: Joi.number().integer().positive().allow(null),
      department: Joi.string().max(100).allow(null, ''),
      designation: Joi.string().max(100).allow(null, ''),
      date_of_joining: Joi.ref('common.optionalDate'),
      date_of_birth: Joi.ref('common.optionalDate'),
      gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER').allow(null),
      address: Joi.ref('common.longText'),
      city: Joi.string().max(100).allow(null, ''),
      state: Joi.string().max(100).allow(null, ''),
      postal_code: Joi.string().pattern(/^[0-9]{6}$/).allow(null, ''),
      emergency_contact_name: Joi.string().max(200).allow(null, ''),
      emergency_contact_phone: Joi.string().pattern(/^[+]?[0-9\s\-()]{10,15}$/).allow(null, '')
    }).strict(),

    update: Joi.object({
      id: Joi.ref('common.id'),
      employee_id: Joi.string().max(20),
      first_name: Joi.ref('common.name'),
      last_name: Joi.ref('common.name'),
      email: Joi.string().email().max(255),
      phone: Joi.ref('common.phone'),
      role: Joi.string().valid('TRUST_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'ACCOUNTANT', 'PARENT', 'STUDENT'),
      status: Joi.string().valid('ACTIVE', 'INACTIVE', 'LOCKED'),
      school_id: Joi.number().integer().positive(),
      department: Joi.string().max(100),
      designation: Joi.string().max(100),
      date_of_joining: Joi.ref('common.optionalDate'),
      date_of_birth: Joi.ref('common.optionalDate'),
      gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER'),
      address: Joi.ref('common.longText'),
      city: Joi.string().max(100),
      state: Joi.string().max(100),
      postal_code: Joi.string().pattern(/^[0-9]{6}$/),
      emergency_contact_name: Joi.string().max(200),
      emergency_contact_phone: Joi.ref('common.phone')
    }).strict().min(1),

    login: Joi.object({
      email: Joi.string().required(),
      password: Joi.string().required()
    }).strict(),

    passwordReset: Joi.object({
      email: Joi.ref('common.email')
    }).strict(),

    passwordChange: Joi.object({
      current_password: Joi.string().required(),
      new_password: Joi.ref('common.password'),
      confirm_password: Joi.string().valid(Joi.ref('new_password')).required()
    }).strict()
  },

  // Student Schema
  student: {
    create: Joi.object({
      admission_no: Joi.string().pattern(/^[A-Z0-9]{6,20}$/).required(),
      roll_no: Joi.string().max(20).allow(null, ''),
      first_name: Joi.ref('common.name'),
      last_name: Joi.ref('common.name'),
      date_of_birth: Joi.ref('common.date'),
      gender: Joi.ref('common.gender'),
      blood_group: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').allow(null, ''),
      religion: Joi.string().max(50).allow(null, ''),
      caste: Joi.string().max(50).allow(null, ''),
      category: Joi.string().valid('GENERAL', 'OBC', 'SC', 'ST', 'OTHER').default('GENERAL'),
      nationality: Joi.string().max(50).default('Indian'),
      mother_tongue: Joi.string().max(50).allow(null, ''),
      address: Joi.ref('common.longText'),
      city: Joi.string().max(100).required(),
      state: Joi.string().max(100).required(),
      postal_code: Joi.ref('common.postalCode'),
      class_id: Joi.ref('common.id'),
      section_id: Joi.ref('common.id'),
      school_id: Joi.ref('common.id'),
      academic_year_id: Joi.ref('common.id'),
      admission_date: Joi.ref('common.date'),
      previous_school: Joi.string().max(200).allow(null, ''),
      transport_required: Joi.boolean().default(false),
      bus_route: Joi.string().max(100).allow(null, ''),
      medical_conditions: Joi.ref('common.longText'),
      status: Joi.string().valid('ACTIVE', 'INACTIVE', 'TRANSFERRED', 'GRADUATED', 'WITHDRAWN').default('ACTIVE'),
      photo_url: Joi.ref('common.url')
    }).strict(),

    update: Joi.object({
      id: Joi.ref('common.id'),
      roll_no: Joi.string().max(20),
      first_name: Joi.ref('common.name'),
      last_name: Joi.ref('common.name'),
      blood_group: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
      religion: Joi.string().max(50),
      caste: Joi.string().max(50),
      category: Joi.string().valid('GENERAL', 'OBC', 'SC', 'ST', 'OTHER'),
      nationality: Joi.string().max(50),
      mother_tongue: Joi.string().max(50),
      address: Joi.ref('common.longText'),
      city: Joi.string().max(100),
      state: Joi.string().max(100),
      postal_code: Joi.ref('common.postalCode'),
      class_id: Joi.ref('common.id'),
      section_id: Joi.ref('common.id'),
      previous_school: Joi.string().max(200),
      transport_required: Joi.boolean(),
      bus_route: Joi.string().max(100),
      medical_conditions: Joi.ref('common.longText'),
      status: Joi.string().valid('ACTIVE', 'INACTIVE', 'TRANSFERRED', 'GRADUATED', 'WITHDRAWN'),
      photo_url: Joi.ref('common.url')
    }).strict().min(1)
  },

  // Fee Structure Schema
  feeStructure: {
    create: Joi.object({
      fee_head: Joi.string().max(100).required(),
      class_id: Joi.ref('common.id'),
      academic_year_id: Joi.ref('common.id'),
      amount: Joi.ref('common.amount'),
      due_date: Joi.ref('common.date'),
      is_mandatory: Joi.boolean().default(true),
      installments: Joi.number().integer().min(1).max(12).default(1),
      late_fee_amount: Joi.ref('common.optionalAmount'),
      late_fee_days: Joi.number().integer().min(0).max(365).default(7),
      description: Joi.ref('common.longText'),
      status: Joi.ref('common.status')
    }).strict(),

    update: Joi.object({
      id: Joi.ref('common.id'),
      fee_head: Joi.string().max(100),
      amount: Joi.ref('common.amount'),
      due_date: Joi.ref('common.date'),
      is_mandatory: Joi.boolean(),
      installments: Joi.number().integer().min(1).max(12),
      late_fee_amount: Joi.ref('common.optionalAmount'),
      late_fee_days: Joi.number().integer().min(0).max(365),
      description: Joi.ref('common.longText'),
      status: Joi.ref('common.status')
    }).strict().min(1)
  },

  // Fee Receipt Schema
  feeReceipt: {
    create: Joi.object({
      receipt_no: Joi.string().max(50).required(),
      student_id: Joi.ref('common.id'),
      amount_paid: Joi.ref('common.amount'),
      late_fee_paid: Joi.ref('common.optionalAmount'),
      total_paid: Joi.ref('common.amount'),
      payment_mode: Joi.string().valid('CASH', 'CHEQUE', 'BANK_TRANSFER', 'UPI', 'ONLINE', 'CARD').required(),
      payment_reference: Joi.string().max(100).allow(null, ''),
      bank_name: Joi.string().max(100).allow(null, ''),
      cheque_no: Joi.string().max(50).allow(null, ''),
      cheque_date: Joi.ref('common.optionalDate'),
      paid_date: Joi.ref('common.date'),
      academic_year_id: Joi.ref('common.id'),
      remarks: Joi.ref('common.longText'),
      collected_by: Joi.ref('common.id')
    }).strict()
  },

  // Attendance Schema
  attendance: {
    create: Joi.object({
      student_id: Joi.ref('common.id'),
      class_id: Joi.ref('common.id'),
      section_id: Joi.ref('common.id'),
      attendance_date: Joi.ref('common.date'),
      status: Joi.string().valid('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'SICK', 'HOLIDAY').required(),
      in_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).allow(null),
      out_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).allow(null),
      remarks: Joi.string().max(255).allow(null, ''),
      marked_by: Joi.ref('common.id')
    }).strict(),

    bulkCreate: Joi.object({
      class_id: Joi.ref('common.id'),
      section_id: Joi.ref('common.id'),
      attendance_date: Joi.ref('common.date'),
      marked_by: Joi.ref('common.id'),
      attendance_records: Joi.array().items(
        Joi.object({
          student_id: Joi.ref('common.id'),
          status: Joi.string().valid('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'SICK', 'HOLIDAY').required(),
          in_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).allow(null),
          out_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).allow(null),
          remarks: Joi.string().max(255).allow(null, '')
        }).strict()
      ).min(1).required()
    }).strict()
  },

  // Leave Application Schema
  leaveApplication: {
    create: Joi.object({
      student_id: Joi.ref('common.id'),
      leave_type: Joi.string().valid('SICK', 'CASUAL', 'EMERGENCY', 'VACATION', 'OTHER').required(),
      from_date: Joi.ref('common.date'),
      to_date: Joi.ref('common.date'),
      total_days: Joi.number().integer().min(1).max(365).required(),
      reason: Joi.string().min(10).max(2000).required(),
      applied_by: Joi.ref('common.id'),
      medical_certificate: Joi.ref('common.url')
    }).strict(),

    update: Joi.object({
      id: Joi.ref('common.id'),
      status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED').required(),
      approved_by: Joi.ref('common.id'),
      remarks: Joi.ref('common.longText')
    }).strict()
  },

  // Query Parameters
  query: {
    pagination: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(25),
      sort: Joi.string().valid('asc', 'desc').default('asc'),
      sortBy: Joi.string().max(50).default('id')
    }),

    dateRange: Joi.object({
      from_date: Joi.ref('common.date'),
      to_date: Joi.ref('common.date')
    }),

    search: Joi.object({
      q: Joi.string().min(1).max(100).required()
    })
  }
};

// Compile all schemas for performance
Object.keys(ValidationSchemas).forEach(category => {
  if (typeof ValidationSchemas[category] === 'object') {
    Object.keys(ValidationSchemas[category]).forEach(schema => {
      if (ValidationSchemas[category][schema].isJoi) {
        ValidationSchemas[category][schema] = ValidationSchemas[category][schema].compile();
      }
    });
  }
});

module.exports = ValidationSchemas;