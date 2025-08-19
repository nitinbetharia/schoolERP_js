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
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Numeric level for ordering (1, 2, 3, etc.)',
         },
         category: {
            type: DataTypes.ENUM('NURSERY', 'PRIMARY', 'SECONDARY', 'HIGHER_SECONDARY'),
            allowNull: false,
            defaultValue: 'PRIMARY',
         },
         capacity: {
            type: DataTypes.INTEGER,
            allowNull: true,
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
            {
               name: 'class_category_idx',
               fields: ['category'],
            },
            {
               name: 'class_teacher_idx',
               fields: ['class_teacher_id'],
            },
            {
               name: 'class_active_idx',
               fields: ['is_active'],
            },
            {
               name: 'class_academic_year_idx',
               fields: ['academic_year'],
            },
         ],
      }
   );

   return Class;
};

module.exports = { defineClass };
