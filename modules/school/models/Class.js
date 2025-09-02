const { DataTypes } = require('sequelize');

/**
 * Class Model
 * Manages academic classes within a school
 */
const defineClass = (sequelize) => {
   const Class = sequelize.define(
      'Class',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
         },
         school_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'schools',
               key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
         },
         name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: 'Class name like "Class 1", "Nursery", "Pre-KG", etc.',
         },
         code: {
            type: DataTypes.STRING(20),
            allowNull: false,
            comment: 'Class code like "C1", "NUR", "PKG", etc.',
         },
         level: {
            type: DataTypes.ENUM('NURSERY', 'PRIMARY', 'SECONDARY', 'HIGHER_SECONDARY'),
            allowNull: false,
            comment: 'Education level category',
         },
         class_order: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Numeric order for sorting classes (1, 2, 3, etc.)',
         },
         max_students: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 40,
            comment: 'Maximum students per class',
         },
         current_strength: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
         },
         subjects: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Array of subjects taught in this class',
         },
         class_teacher_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Reference to user id of class teacher',
         },
         room_number: {
            type: DataTypes.STRING(50),
            allowNull: true,
         },
         description: {
            type: DataTypes.TEXT,
            allowNull: true,
         },
         is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
         },
         academic_year: {
            type: DataTypes.STRING(20),
            allowNull: false,
            comment: 'Academic year like "2024-25"',
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
         tableName: 'classes',
         timestamps: true,
         createdAt: 'created_at',
         updatedAt: 'updated_at',
         indexes: [
            {
               name: 'class_school_id_idx',
               fields: ['school_id'],
            },
            {
               name: 'class_school_code_idx',
               fields: ['school_id', 'code'],
               unique: true,
            },
            {
               name: 'class_level_idx',
               fields: ['school_id', 'level'],
            },
         ],
      }
   );

   return Class;
};

/**
 * Class Validation Schemas
 * Following Q59-ENFORCED pattern - reusable across API and web routes
 */
const Joi = require('joi');

const classValidationSchemas = {
   create: Joi.object({
      // Required fields
      school_id: Joi.number().integer().positive().required().messages({
         'number.base': 'School ID must be a number',
         'number.positive': 'School ID must be positive',
         'any.required': 'School ID is required',
      }),

      name: Joi.string().trim().min(1).max(50).required().messages({
         'string.empty': 'Class name is required',
         'string.min': 'Class name must be at least 1 character',
         'string.max': 'Class name cannot exceed 50 characters',
      }),

      code: Joi.string().trim().uppercase().min(1).max(20).required().messages({
         'string.empty': 'Class code is required',
         'string.min': 'Class code must be at least 1 character',
         'string.max': 'Class code cannot exceed 20 characters',
      }),

      level: Joi.number().integer().min(0).max(20).required().messages({
         'number.base': 'Level must be a number',
         'number.min': 'Level cannot be negative',
         'number.max': 'Level cannot exceed 20',
         'any.required': 'Level is required',
      }),

      category: Joi.string().valid('NURSERY', 'PRIMARY', 'SECONDARY', 'HIGHER_SECONDARY').required().messages({
         'any.only': 'Category must be NURSERY, PRIMARY, SECONDARY, or HIGHER_SECONDARY',
         'any.required': 'Category is required',
      }),

      academic_year: Joi.string()
         .trim()
         .pattern(/^\d{4}-\d{2}$/)
         .required()
         .messages({
            'string.pattern.base': 'Academic year must be in format YYYY-YY (e.g., 2024-25)',
            'any.required': 'Academic year is required',
         }),

      // Optional fields
      capacity: Joi.number().integer().positive().allow(null).optional().messages({
         'number.positive': 'Capacity must be positive',
      }),

      subjects: Joi.array().items(Joi.string().trim().min(1).max(100)).allow(null).optional(),

      class_teacher_id: Joi.number().integer().positive().allow(null).optional().messages({
         'number.positive': 'Class teacher ID must be positive',
      }),

      room_number: Joi.string().trim().max(50).allow(null, '').optional(),
      description: Joi.string().trim().max(1000).allow(null, '').optional(),
      is_active: Joi.boolean().optional(),
      additional_info: Joi.object().allow(null).optional(),
   }),

   update: Joi.object({
      // Prevent updating core identity fields
      id: Joi.forbidden().messages({
         'any.unknown': 'Class ID cannot be updated',
      }),
      school_id: Joi.forbidden().messages({
         'any.unknown': 'School ID cannot be updated after creation',
      }),
      code: Joi.forbidden().messages({
         'any.unknown': 'Class code cannot be updated after creation',
      }),

      // Allow updating other fields
      name: Joi.string().trim().min(1).max(50).optional(),
      level: Joi.number().integer().min(0).max(20).optional(),
      category: Joi.string().valid('NURSERY', 'PRIMARY', 'SECONDARY', 'HIGHER_SECONDARY').optional(),
      academic_year: Joi.string()
         .trim()
         .pattern(/^\d{4}-\d{2}$/)
         .optional(),

      capacity: Joi.number().integer().positive().allow(null).optional(),
      subjects: Joi.array().items(Joi.string().trim().min(1).max(100)).allow(null).optional(),
      class_teacher_id: Joi.number().integer().positive().allow(null).optional(),
      room_number: Joi.string().trim().max(50).allow(null, '').optional(),
      description: Joi.string().trim().max(1000).allow(null, '').optional(),
      is_active: Joi.boolean().optional(),
      additional_info: Joi.object().allow(null).optional(),
   }),

   bulkCreate: Joi.object({
      school_id: Joi.number().integer().positive().required(),
      academic_year: Joi.string()
         .trim()
         .pattern(/^\d{4}-\d{2}$/)
         .required(),

      classes: Joi.array()
         .items(
            Joi.object({
               name: Joi.string().trim().min(1).max(50).required(),
               code: Joi.string().trim().uppercase().min(1).max(20).required(),
               level: Joi.number().integer().min(0).max(20).required(),
               category: Joi.string().valid('NURSERY', 'PRIMARY', 'SECONDARY', 'HIGHER_SECONDARY').required(),
               capacity: Joi.number().integer().positive().allow(null).optional(),
               subjects: Joi.array().items(Joi.string().trim()).allow(null).optional(),
               room_number: Joi.string().trim().max(50).allow(null, '').optional(),
               description: Joi.string().trim().max(1000).allow(null, '').optional(),
            })
         )
         .min(1)
         .max(50)
         .required()
         .messages({
            'array.min': 'At least one class is required',
            'array.max': 'Cannot create more than 50 classes at once',
         }),
   }),

   assignTeacher: Joi.object({
      class_teacher_id: Joi.number().integer().positive().required().messages({
         'number.positive': 'Teacher ID must be positive',
         'any.required': 'Teacher ID is required',
      }),
   }),
};

module.exports = { defineClass, classValidationSchemas };
