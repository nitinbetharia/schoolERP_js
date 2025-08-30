const { DataTypes } = require('sequelize');

/**
 * Academic Year Model
 * Manages academic years for schools within a trust
 */
const defineAcademicYear = (sequelize) => {
   const AcademicYear = sequelize.define(
      'AcademicYear',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
         },
         year_name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: 'Academic year name like "2024-25"',
         },
         start_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: 'Academic year start date',
         },
         end_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: 'Academic year end date',
         },
         school_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
               model: 'schools',
               key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            comment: 'NULL means trust-wide, specific ID means school-specific',
         },
         is_current: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Whether this is the currently active academic year',
         },
         status: {
            type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED'),
            defaultValue: 'ACTIVE',
         },
         description: {
            type: DataTypes.TEXT,
            allowNull: true,
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
         tableName: 'academic_years',
         timestamps: true,
         createdAt: 'created_at',
         updatedAt: 'updated_at',
         indexes: [
            {
               name: 'academic_year_current_idx',
               fields: ['is_current'],
            },
            {
               name: 'academic_year_school_idx',
               fields: ['school_id'],
            },
            {
               name: 'academic_year_dates_idx',
               fields: ['start_date', 'end_date'],
            },
            {
               name: 'academic_year_name_school_idx',
               fields: ['year_name', 'school_id'],
               unique: true,
            },
         ],
      },
   );

   return AcademicYear;
};

module.exports = { defineAcademicYear };
