const { DataTypes } = require('sequelize');

/**
 * School Model
 * Manages individual schools within a trust
 *
 * Consolidated: All school field definitions integrated directly
 */

// School field definitions
const getSchoolFields = () => ({
   id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
   },
   name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
         notEmpty: true,
         len: [2, 255],
      },
   },
   code: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false,
      validate: {
         notEmpty: true,
         len: [2, 50],
      },
   },
   type: {
      type: DataTypes.ENUM('PRIMARY', 'SECONDARY', 'HIGHER_SECONDARY', 'COMPOSITE'),
      allowNull: false,
   },
   board: {
      type: DataTypes.ENUM('CBSE', 'CISCE', 'STATE', 'INTERNATIONAL', 'OTHERS'),
      allowNull: false,
   },
   status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'PENDING'),
      defaultValue: 'ACTIVE',
   },
   address: {
      type: DataTypes.TEXT,
      allowNull: true,
   },
   contact_info: {
      type: DataTypes.JSON,
      allowNull: true,
   },
   principal_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
   },
   established_year: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
         min: 1800,
         max: new Date().getFullYear(),
      },
   },
});

// Table options
const getSchoolTableOptions = () => ({
   tableName: 'schools',
   timestamps: true,
   paranoid: true,
   indexes: [
      { fields: ['code'] },
      { fields: ['name'] },
      { fields: ['type'] },
      { fields: ['board'] },
      { fields: ['status'] },
   ],
});

// Instance methods
const applySchoolInstanceMethods = (School) => {
   School.prototype.getFullDetails = function () {
      return {
         id: this.id,
         name: this.name,
         code: this.code,
         type: this.type,
         board: this.board,
         status: this.status,
         address: this.address,
         contact_info: this.contact_info,
         principal_name: this.principal_name,
         established_year: this.established_year,
      };
   };
};

// Association setup
const setupSchoolAssociations = (models, School) => {
   // Define associations when needed
   if (models.Class) {
      School.hasMany(models.Class, { foreignKey: 'school_id', as: 'classes' });
   }
   if (models.Student) {
      School.hasMany(models.Student, { foreignKey: 'school_id', as: 'students' });
   }
};

// Validation schemas
const getSchoolValidationSchemas = () => ({
   create: require('joi').object({
      name: require('joi').string().min(2).max(255).required(),
      code: require('joi').string().min(2).max(50).required(),
      type: require('joi').string().valid('PRIMARY', 'SECONDARY', 'HIGHER_SECONDARY', 'COMPOSITE').required(),
      board: require('joi').string().valid('CBSE', 'CISCE', 'STATE', 'INTERNATIONAL', 'OTHERS').required(),
      address: require('joi').string().optional(),
      contact_info: require('joi').object().optional(),
      principal_name: require('joi').string().max(255).optional(),
      established_year: require('joi').number().integer().min(1800).max(new Date().getFullYear()).optional(),
   }),
   update: require('joi').object({
      name: require('joi').string().min(2).max(255).optional(),
      type: require('joi').string().valid('PRIMARY', 'SECONDARY', 'HIGHER_SECONDARY', 'COMPOSITE').optional(),
      board: require('joi').string().valid('CBSE', 'CISCE', 'STATE', 'INTERNATIONAL', 'OTHERS').optional(),
      status: require('joi').string().valid('ACTIVE', 'INACTIVE', 'PENDING').optional(),
      address: require('joi').string().optional(),
      contact_info: require('joi').object().optional(),
      principal_name: require('joi').string().max(255).optional(),
      established_year: require('joi').number().integer().min(1800).max(new Date().getFullYear()).optional(),
   }),
});

const defineSchool = (sequelize) => {
   const School = sequelize.define('School', getSchoolFields(), getSchoolTableOptions());

   // Apply instance methods
   applySchoolInstanceMethods(School);

   // Define associations
   School.associate = function (models) {
      setupSchoolAssociations(models, School);
   };

   return School;
};

// Export both model definition and validation schemas
module.exports = {
   defineSchool,
   schoolValidationSchemas: getSchoolValidationSchemas(),
};
