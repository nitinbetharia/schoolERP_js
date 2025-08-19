const { DataTypes } = require('sequelize');

/**
 * Section Model
 * Manages sections within a class
 */
const defineSection = (sequelize) => {
   const Section = sequelize.define(
      'Section',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
         },
         class_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'classes',
               key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
         },
         name: {
            type: DataTypes.STRING(10),
            allowNull: false,
            comment: 'Section name like "A", "B", "C", etc.',
         },
         capacity: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Maximum students per section',
         },
         current_strength: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
         },
         section_teacher_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Reference to user id of section teacher',
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
         tableName: 'sections',
         timestamps: true,
         createdAt: 'created_at',
         updatedAt: 'updated_at',
         indexes: [
            {
               name: 'section_class_id_idx',
               fields: ['class_id'],
            },
            {
               name: 'section_class_name_idx',
               fields: ['class_id', 'name'],
               unique: true,
            },
            {
               name: 'section_teacher_idx',
               fields: ['section_teacher_id'],
            },
            {
               name: 'section_active_idx',
               fields: ['is_active'],
            },
         ],
      }
   );

   return Section;
};

module.exports = { defineSection };
