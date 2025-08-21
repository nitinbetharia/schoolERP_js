const { DataTypes } = require('sequelize');

/**
 * School Model
 * Manages individual schools within a trust
 */
const defineSchool = (sequelize) => {
   const School = sequelize.define(
      'School',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
         },
         trust_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Reference to system trust table',
         },
         name: {
            type: DataTypes.STRING(200),
            allowNull: false,
         },
         code: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true,
            comment: 'Unique school code',
         },
         type: {
            type: DataTypes.ENUM('PRIMARY', 'SECONDARY', 'HIGHER_SECONDARY', 'NURSERY', 'MIXED'),
            allowNull: false,
            defaultValue: 'MIXED',
         },
         address: {
            type: DataTypes.TEXT,
            allowNull: true,
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
         },
         email: {
            type: DataTypes.STRING(255),
            allowNull: true,
            validate: { isEmail: true },
         },
         website: {
            type: DataTypes.STRING(500),
            allowNull: true,
         },
         principal_name: {
            type: DataTypes.STRING(200),
            allowNull: true,
         },
         principal_phone: {
            type: DataTypes.STRING(15),
            allowNull: true,
         },
         principal_email: {
            type: DataTypes.STRING(255),
            allowNull: true,
            validate: { isEmail: true },
         },
         established_year: {
            type: DataTypes.INTEGER,
            allowNull: true,
         },
         affiliation_board: {
            type: DataTypes.ENUM('CBSE', 'CISCE', 'STATE_BOARD', 'INTERNATIONAL', 'UNAFFILIATED'),
            allowNull: false,
            defaultValue: 'UNAFFILIATED',
            comment: 'Primary board affiliation',
         },
         board_affiliation_details: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Board-specific details like affiliation codes, registration numbers',
         },
         affiliation_number: {
            type: DataTypes.STRING(50),
            allowNull: true,
         },
         registration_number: {
            type: DataTypes.STRING(50),
            allowNull: true,
         },
         capacity: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Total student capacity',
         },
         current_strength: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
         },
         logo_url: {
            type: DataTypes.STRING(500),
            allowNull: true,
         },
         is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
         },
         academic_session_start_month: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 4,
            comment: 'Month when academic session starts (1-12)',
         },
         working_days: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Array of working days [1,2,3,4,5,6] where 1=Monday',
         },
         school_timings: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'School start and end times',
         },
         facilities: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Available facilities like library, lab, playground etc.',
         },
         contact_person: {
            type: DataTypes.STRING(200),
            allowNull: true,
         },
         contact_person_phone: {
            type: DataTypes.STRING(15),
            allowNull: true,
         },
         additional_info: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {
               nep_2020_adoption: {
                  enabled: null, // null = inherit from trust, true/false = override
                  adoption_date: null,
                  policy: null, // null = inherit, 'TRADITIONAL', 'NEP_2020', 'HYBRID'
                  academic_year_from: null,
                  override_trust_policy: false,
               },
               udise_compliance: {
                  udise_code: null,
                  registration_status: 'PENDING', // 'PENDING', 'REGISTERED', 'VERIFIED'
                  last_updated: null,
               },
            },
            comment: 'Additional flexible information including NEP adoption and UDISE compliance',
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
         tableName: 'schools',
         timestamps: true,
         createdAt: 'created_at',
         updatedAt: 'updated_at',
         indexes: [
            {
               name: 'school_trust_id_idx',
               fields: ['trust_id'],
            },
            {
               name: 'school_code_idx',
               fields: ['code'],
               unique: true,
            },
            {
               name: 'school_name_idx',
               fields: ['name'],
            },
            {
               name: 'school_type_idx',
               fields: ['type'],
            },
            {
               name: 'school_active_idx',
               fields: ['is_active'],
            },
         ],
      }
   );

   return School;
};

/**
 * School Validation Schemas
 * Following Q59-ENFORCED pattern - reusable across API and web routes
 */
const Joi = require('joi');

const schoolValidationSchemas = {
   create: Joi.object({
      // Required fields
      trust_id: Joi.number().integer().positive().required().messages({
         'number.base': 'Trust ID must be a number',
         'number.positive': 'Trust ID must be positive',
         'any.required': 'Trust ID is required',
      }),

      name: Joi.string().trim().min(2).max(200).required().messages({
         'string.empty': 'School name is required',
         'string.min': 'School name must be at least 2 characters',
         'string.max': 'School name cannot exceed 200 characters',
      }),

      code: Joi.string().trim().uppercase().min(2).max(20).required().messages({
         'string.empty': 'School code is required',
         'string.min': 'School code must be at least 2 characters',
         'string.max': 'School code cannot exceed 20 characters',
      }),

      type: Joi.string().valid('PRIMARY', 'SECONDARY', 'HIGHER_SECONDARY', 'NURSERY', 'MIXED').required().messages({
         'any.only': 'School type must be PRIMARY, SECONDARY, HIGHER_SECONDARY, NURSERY, or MIXED',
         'any.required': 'School type is required',
      }),

      affiliation_board: Joi.string().valid('CBSE', 'CISCE', 'STATE_BOARD', 'INTERNATIONAL', 'UNAFFILIATED').required().messages({
         'any.only': 'Affiliation board must be CBSE, CISCE, STATE_BOARD, INTERNATIONAL, or UNAFFILIATED',
         'any.required': 'Affiliation board is required',
      }),

      // Optional contact information
      address: Joi.string().trim().max(1000).allow(null, '').optional(),
      city: Joi.string().trim().max(100).allow(null, '').optional(),
      state: Joi.string().trim().max(100).allow(null, '').optional(),
      postal_code: Joi.string().trim().pattern(/^\d{5,10}$/).allow(null, '').optional().messages({
         'string.pattern.base': 'Postal code must be 5-10 digits',
      }),

      phone: Joi.string().pattern(/^\d{10,15}$/).allow(null, '').optional().messages({
         'string.pattern.base': 'Phone number must be 10-15 digits',
      }),

      email: Joi.string().email().max(255).allow(null, '').optional(),
      website: Joi.string().uri().max(500).allow(null, '').optional(),

      // Principal information
      principal_name: Joi.string().trim().max(200).allow(null, '').optional(),
      principal_phone: Joi.string().pattern(/^\d{10,15}$/).allow(null, '').optional(),
      principal_email: Joi.string().email().max(255).allow(null, '').optional(),

      // School details
      established_year: Joi.number().integer().min(1800).max(new Date().getFullYear()).allow(null).optional(),
      affiliation_number: Joi.string().trim().max(50).allow(null, '').optional(),
      registration_number: Joi.string().trim().max(50).allow(null, '').optional(),
      capacity: Joi.number().integer().positive().allow(null).optional(),

      // Configuration
      academic_session_start_month: Joi.number().integer().min(1).max(12).optional(),
      working_days: Joi.array().items(Joi.number().integer().min(1).max(7)).allow(null).optional(),
      
      // JSON fields
      school_timings: Joi.object({
         start_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
         end_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      }).allow(null).optional(),

      facilities: Joi.array().items(Joi.string().trim()).allow(null).optional(),
      board_affiliation_details: Joi.object().allow(null).optional(),

      // Contact person
      contact_person: Joi.string().trim().max(200).allow(null, '').optional(),
      contact_person_phone: Joi.string().pattern(/^\d{10,15}$/).allow(null, '').optional(),

      // Status
      is_active: Joi.boolean().optional(),
   }),

   update: Joi.object({
      // Prevent updating core identity fields
      id: Joi.forbidden().messages({
         'any.unknown': 'School ID cannot be updated',
      }),
      trust_id: Joi.forbidden().messages({
         'any.unknown': 'Trust ID cannot be updated',
      }),
      code: Joi.forbidden().messages({
         'any.unknown': 'School code cannot be updated after creation',
      }),

      // Allow updating other fields
      name: Joi.string().trim().min(2).max(200).optional(),
      type: Joi.string().valid('PRIMARY', 'SECONDARY', 'HIGHER_SECONDARY', 'NURSERY', 'MIXED').optional(),
      affiliation_board: Joi.string().valid('CBSE', 'CISCE', 'STATE_BOARD', 'INTERNATIONAL', 'UNAFFILIATED').optional(),

      // Contact updates
      address: Joi.string().trim().max(1000).allow(null, '').optional(),
      city: Joi.string().trim().max(100).allow(null, '').optional(),
      state: Joi.string().trim().max(100).allow(null, '').optional(),
      postal_code: Joi.string().trim().pattern(/^\d{5,10}$/).allow(null, '').optional(),
      phone: Joi.string().pattern(/^\d{10,15}$/).allow(null, '').optional(),
      email: Joi.string().email().max(255).allow(null, '').optional(),
      website: Joi.string().uri().max(500).allow(null, '').optional(),

      // Principal updates
      principal_name: Joi.string().trim().max(200).allow(null, '').optional(),
      principal_phone: Joi.string().pattern(/^\d{10,15}$/).allow(null, '').optional(),
      principal_email: Joi.string().email().max(255).allow(null, '').optional(),

      // Configuration updates
      capacity: Joi.number().integer().positive().allow(null).optional(),
      academic_session_start_month: Joi.number().integer().min(1).max(12).optional(),
      working_days: Joi.array().items(Joi.number().integer().min(1).max(7)).allow(null).optional(),
      
      // Status updates
      is_active: Joi.boolean().optional(),
   }),

   statusUpdate: Joi.object({
      is_active: Joi.boolean().required().messages({
         'any.required': 'Active status is required',
      }),
      status_reason: Joi.string().trim().min(5).max(200).optional(),
   }),

   compliance: Joi.object({
      affiliation_board: Joi.string().valid('CBSE', 'CISCE', 'STATE_BOARD', 'INTERNATIONAL', 'UNAFFILIATED').required(),
      affiliation_number: Joi.string().trim().max(50).allow(null, '').optional(),
      registration_number: Joi.string().trim().max(50).allow(null, '').optional(),
      board_affiliation_details: Joi.object().allow(null).optional(),
      
      // NEP 2020 compliance
      nep_adoption: Joi.object({
         enabled: Joi.boolean().allow(null).optional(),
         adoption_date: Joi.date().allow(null).optional(),
         policy: Joi.string().valid('TRADITIONAL', 'NEP_2020', 'HYBRID').allow(null).optional(),
         academic_year_from: Joi.string().pattern(/^\d{4}-\d{2}$/).allow(null).optional(),
         override_trust_policy: Joi.boolean().optional(),
      }).allow(null).optional(),

      // UDISE compliance
      udise_compliance: Joi.object({
         udise_code: Joi.string().trim().max(50).allow(null, '').optional(),
         registration_status: Joi.string().valid('PENDING', 'REGISTERED', 'VERIFIED').optional(),
      }).allow(null).optional(),
   }),
};

module.exports = { defineSchool, schoolValidationSchemas };
