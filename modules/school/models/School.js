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
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'CBSE, ICSE, State Board, etc.',
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

module.exports = { defineSchool };
