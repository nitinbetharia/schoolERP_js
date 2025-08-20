const Joi = require('joi');
const { dbManager } = require('./database');
const { defineTrustModel } = require('./Trust');
const { defineSystemUserModel, defineSystemAuditLogModel } = require('./SystemUser');
const { defineSetupConfiguration } = require('../modules/setup/models/SetupConfiguration');
const { defineUserProfile } = require('../modules/user/models/UserProfile');
const { defineSchool } = require('../modules/school/models/School');
const { defineClass } = require('../modules/school/models/Class');
const { defineSection } = require('../modules/school/models/Section');
const { defineBoardCompliance } = require('../modules/school/models/BoardCompliance');
const { defineCBSECompliance } = require('../modules/school/models/CBSECompliance');
const { defineCISCECompliance } = require('../modules/school/models/CISCECompliance');
const { defineStateBoardCompliance } = require('../modules/school/models/StateBoardCompliance');
const { defineInternationalBoardCompliance } = require('../modules/school/models/InternationalBoardCompliance');
const { defineNEPCompliance } = require('../modules/school/models/NEPCompliance');
const { defineUDISESchool } = require('../modules/school/models/UDISESchool');
const { defineUDISEClassInfrastructure } = require('../modules/school/models/UDISEClassInfrastructure');
const { defineUDISEFacilities } = require('../modules/school/models/UDISEFacilities');
const { defineUDISEStudent } = require('../modules/school/models/UDISEStudent');
const { defineStudent } = require('./Student');
const { defineAcademicYear } = require('./AcademicYear');
const { defineStudentEnrollment } = require('./StudentEnrollment');
const { defineStudentDocument } = require('./StudentDocument');
const { logger, logSystem, logError } = require('../utils/logger');

// Fee Management Models
const { defineFeeStructure } = require('../modules/fee/models/FeeStructure');
const { defineStudentFee } = require('../modules/fee/models/StudentFee');
const { defineFeeCollection } = require('../modules/fee/models/FeeCollection');
const { defineFeeInstallment } = require('../modules/fee/models/FeeInstallment');
const { defineFeeDiscount } = require('../modules/fee/models/FeeDiscount');
const { defineStudentFeeDiscount } = require('../modules/fee/models/StudentFeeDiscount');

// UDISE+ Registration System Models
const UdiseSchoolRegistrationModel = require('./UdiseSchoolRegistration');
const UdiseCensusDataModel = require('./UdiseCensusData');
const UdiseComplianceRecordModel = require('./UdiseComplianceRecord');
const UdiseIntegrationLogModel = require('./UdiseIntegrationLog');

/**
 * Model registry for system and tenant databases
 * Manages model definitions and associations
 */
function createModelRegistry() {
   let systemModels = {};
   const tenantModels = new Map();
   let initialized = false;

   /**
    * Initialize system-wide models (Trust, SystemUser, etc.)
    */
   async function initializeSystemModels() {
      try {
         if (initialized) {
            return systemModels;
         }

         logSystem('Initializing system models...');

         const systemDB = await dbManager.getSystemDB();

         // Define system models
         systemModels.Trust = defineTrustModel(systemDB);
         systemModels.SystemUser = defineSystemUserModel(systemDB);
         systemModels.SystemAuditLog = defineSystemAuditLogModel(systemDB);

         // Setup system associations
         await setupSystemAssociations();

         // Sync system database with safer options
         // Note: Using { alter: false } to prevent index duplication issues
         // If schema changes are needed, use migrations instead of alter: true
         await systemDB.sync({
            alter: false, // Prevents duplicate index creation
            force: false, // Never drop existing tables
         });

         initialized = true;
         logSystem('System models initialized successfully');

         return systemModels;
      } catch (error) {
         logError(error, { context: 'initializeSystemModels' });
         throw error;
      }
   }

   /**
    * Setup associations for system models
    */
   async function setupSystemAssociations() {
      const { Trust, SystemUser, SystemAuditLog } = systemModels;

      // Trust-SystemUser associations
      if (Trust && SystemUser && SystemUser.associate) {
         SystemUser.associate(systemModels);
      }

      if (SystemAuditLog && SystemAuditLog.associate) {
         SystemAuditLog.associate(systemModels);
      }
   }

   /**
    * Get system models
    */
   async function getSystemModels() {
      if (!initialized) {
         throw new Error('System models not initialized');
      }
      return systemModels;
   }

   /**
    * Initialize tenant-specific models
    */
   async function initializeTenantModels(tenantCode) {
      try {
         logSystem(`Initializing tenant models for: ${tenantCode}`);

         if (tenantModels.has(tenantCode)) {
            return tenantModels.get(tenantCode);
         }

         const tenantDB = await dbManager.getTenantDB(tenantCode);

         // Define tenant models
         const models = {};

         // User management models
         models.User = defineTenantUserModel(tenantDB);
         models.UserProfile = defineUserProfile(tenantDB);

         // School management models
         models.School = defineSchool(tenantDB);
         models.Class = defineClass(tenantDB);
         models.Section = defineSection(tenantDB);

         // Academic models
         models.AcademicYear = defineAcademicYear(tenantDB);

         // Student models
         models.Student = defineStudent(tenantDB);
         models.StudentEnrollment = defineStudentEnrollment(tenantDB);
         models.StudentDocument = defineStudentDocument(tenantDB);

         // Compliance models
         models.BoardCompliance = defineBoardCompliance(tenantDB);
         models.CBSECompliance = defineCBSECompliance(tenantDB);
         models.CISCECompliance = defineCISCECompliance(tenantDB);
         models.StateBoardCompliance = defineStateBoardCompliance(tenantDB);
         models.InternationalBoardCompliance = defineInternationalBoardCompliance(tenantDB);
         models.NEPCompliance = defineNEPCompliance(tenantDB);

         // UDISE models
         models.UDISESchool = defineUDISESchool(tenantDB);
         models.UDISEClassInfrastructure = defineUDISEClassInfrastructure(tenantDB);
         models.UDISEFacilities = defineUDISEFacilities(tenantDB);
         models.UDISEStudent = defineUDISEStudent(tenantDB);

         // Fee management models
         models.FeeStructure = defineFeeStructure(tenantDB);
         models.StudentFee = defineStudentFee(tenantDB);
         models.FeeCollection = defineFeeCollection(tenantDB);
         models.FeeInstallment = defineFeeInstallment(tenantDB);
         models.FeeDiscount = defineFeeDiscount(tenantDB);
         models.StudentFeeDiscount = defineStudentFeeDiscount(tenantDB);

         // UDISE+ Registration System models
         models.UdiseSchoolRegistration = UdiseSchoolRegistrationModel(tenantDB);
         models.UdiseCensusData = UdiseCensusDataModel(tenantDB);
         models.UdiseComplianceRecord = UdiseComplianceRecordModel(tenantDB);
         models.UdiseIntegrationLog = UdiseIntegrationLogModel(tenantDB);

         // Setup and audit models
         models.SetupConfiguration = defineSetupConfiguration(tenantDB);
         models.AuditLog = defineTenantAuditLogModel(tenantDB);

         // Setup associations
         await setupTenantAssociations(models);

         // Sync tenant database with safer options
         // Note: Using { alter: false } to prevent index duplication issues
         await tenantDB.sync({
            alter: false, // Prevents duplicate index creation
            force: false, // Never drop existing tables
         });

         tenantModels.set(tenantCode, models);
         logSystem(`Tenant models initialized successfully for: ${tenantCode}`);

         return models;
      } catch (error) {
         logError(error, { context: 'initializeTenantModels', tenantCode });
         throw error;
      }
   }

   /**
    * Define tenant User model
    */
   function defineTenantUserModel(sequelize) {
      const { DataTypes } = require('sequelize');

      const User = sequelize.define(
         'User',
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
            },
            username: {
               type: DataTypes.STRING(100),
               allowNull: false,
               unique: true,
            },
            email: {
               type: DataTypes.STRING(255),
               allowNull: false,
               unique: true,
               validate: { isEmail: true },
            },
            password_hash: {
               type: DataTypes.STRING(255),
               allowNull: false,
            },
            role: {
               type: DataTypes.ENUM('admin', 'teacher', 'student', 'parent'),
               allowNull: false,
            },
            is_active: {
               type: DataTypes.BOOLEAN,
               defaultValue: true,
            },
            last_login_at: {
               type: DataTypes.DATE,
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
         },
         {
            tableName: 'users',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            indexes: [
               {
                  name: 'user_school_id_idx',
                  fields: ['school_id'],
               },
               {
                  name: 'user_role_idx',
                  fields: ['role'],
               },
            ],
         }
      );

      return User;
   }

   /**
    * Define tenant AuditLog model
    */
   function defineTenantAuditLogModel(sequelize) {
      const { DataTypes } = require('sequelize');

      const AuditLog = sequelize.define(
         'AuditLog',
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
            },
            user_id: {
               type: DataTypes.INTEGER,
               allowNull: true,
            },
            action: {
               type: DataTypes.STRING(100),
               allowNull: false,
            },
            entity_type: {
               type: DataTypes.STRING(100),
               allowNull: false,
            },
            entity_id: {
               type: DataTypes.INTEGER,
               allowNull: true,
            },
            old_values: {
               type: DataTypes.JSON,
               allowNull: true,
            },
            new_values: {
               type: DataTypes.JSON,
               allowNull: true,
            },
            ip_address: {
               type: DataTypes.STRING(45),
               allowNull: true,
            },
            user_agent: {
               type: DataTypes.TEXT,
               allowNull: true,
            },
         },
         {
            tableName: 'audit_logs',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
         }
      );

      return AuditLog;
   }

   /**
    * Setup associations for tenant models
    */
   async function setupTenantAssociations(models) {
      const {
         User,
         UserProfile,
         School,
         Class,
         Section,
         AcademicYear,
         Student,
         StudentEnrollment,
         StudentDocument,
         BoardCompliance,
         CBSECompliance,
         CISCECompliance,
         StateBoardCompliance,
         InternationalBoardCompliance,
         NEPCompliance,
         UDISESchool,
         UDISEClassInfrastructure,
         UDISEFacilities,
         UDISEStudent,
         FeeStructure,
         StudentFee,
         FeeCollection,
         FeeInstallment,
         FeeDiscount,
         StudentFeeDiscount,
         AuditLog,
      } = models;

      // Setup all model associations here
      // Each model's associate method should be called if it exists
      Object.values(models).forEach((model) => {
         if (model.associate && typeof model.associate === 'function') {
            model.associate(models);
         }
      });
   }

   /**
    * Get tenant models
    */
   async function getTenantModels(tenantCode) {
      if (!tenantModels.has(tenantCode)) {
         throw new Error(`Tenant models not initialized for: ${tenantCode}`);
      }
      return tenantModels.get(tenantCode);
   }

   /**
    * Health check for model registry
    */
   async function healthCheck() {
      const health = {
         systemModels: Object.keys(systemModels).length,
         tenantModels: tenantModels.size,
         initialized: initialized,
         activeTenants: Array.from(tenantModels.keys()),
      };

      return health;
   }

   return {
      initializeSystemModels,
      setupSystemAssociations,
      getSystemModels,
      initializeTenantModels,
      defineTenantUserModel,
      defineTenantAuditLogModel,
      setupTenantAssociations,
      getTenantModels,
      healthCheck,
   };
}

// Create singleton instance
const modelRegistry = new createModelRegistry();

// For UDISE and other services that need to initialize models directly
function createTenantModels(tenantDB) {
   const models = {};

   // User management models
   models.User = modelRegistry.defineTenantUserModel(tenantDB);
   models.UserProfile = defineUserProfile(tenantDB);

   // School management models
   models.School = defineSchool(tenantDB);
   models.Class = defineClass(tenantDB);
   models.Section = defineSection(tenantDB);

   // Academic models
   models.AcademicYear = defineAcademicYear(tenantDB);

   // Student models
   models.Student = defineStudent(tenantDB);
   models.StudentEnrollment = defineStudentEnrollment(tenantDB);
   models.StudentDocument = defineStudentDocument(tenantDB);

   // Compliance models
   models.BoardCompliance = defineBoardCompliance(tenantDB);
   models.CBSECompliance = defineCBSECompliance(tenantDB);
   models.CISCECompliance = defineCISCECompliance(tenantDB);
   models.StateBoardCompliance = defineStateBoardCompliance(tenantDB);
   models.InternationalBoardCompliance = defineInternationalBoardCompliance(tenantDB);
   models.NEPCompliance = defineNEPCompliance(tenantDB);

   // UDISE models (old)
   models.UDISESchool = defineUDISESchool(tenantDB);
   models.UDISEClassInfrastructure = defineUDISEClassInfrastructure(tenantDB);
   models.UDISEFacilities = defineUDISEFacilities(tenantDB);
   models.UDISEStudent = defineUDISEStudent(tenantDB);

   // Fee management models
   models.FeeStructure = defineFeeStructure(tenantDB);
   models.StudentFee = defineStudentFee(tenantDB);
   models.FeeCollection = defineFeeCollection(tenantDB);
   models.FeeInstallment = defineFeeInstallment(tenantDB);
   models.FeeDiscount = defineFeeDiscount(tenantDB);
   models.StudentFeeDiscount = defineStudentFeeDiscount(tenantDB);

   // UDISE+ Registration System models
   models.UdiseSchoolRegistration = UdiseSchoolRegistrationModel(tenantDB);
   models.UdiseCensusData = UdiseCensusDataModel(tenantDB);
   models.UdiseComplianceRecord = UdiseComplianceRecordModel(tenantDB);
   models.UdiseIntegrationLog = UdiseIntegrationLogModel(tenantDB);

   // Setup and audit models
   models.SetupConfiguration = defineSetupConfiguration(tenantDB);
   models.AuditLog = modelRegistry.defineTenantAuditLogModel(tenantDB);

   // Setup associations
   Object.values(models).forEach((model) => {
      if (model.associate && typeof model.associate === 'function') {
         model.associate(models);
      }
   });

   return models;
}

/**
 * Validation schemas for tenant User model
 */
const { commonSchemas } = require('../utils/errors');

const userValidationSchemas = {
   create: Joi.object({
      username: Joi.string()
         .trim()
         .lowercase()
         .min(3)
         .max(100)
         .pattern(/^[a-z0-9_-]+$/)
         .required()
         .messages({
            'string.empty': 'Username is required',
            'string.pattern.base': 'Username can only contain lowercase letters, numbers, hyphens and underscores',
            'string.min': 'Username must be at least 3 characters',
            'string.max': 'Username cannot exceed 100 characters',
         }),

      email: commonSchemas.email,

      password: commonSchemas.password,

      role: Joi.string().valid('admin', 'teacher', 'student', 'parent').required().messages({
         'any.only': 'Role must be one of: admin, teacher, student, parent',
      }),

      school_id: Joi.number().integer().positive().required(),
   }),

   update: Joi.object({
      username: Joi.string()
         .trim()
         .lowercase()
         .min(3)
         .max(100)
         .pattern(/^[a-z0-9_-]+$/)
         .optional(),

      email: Joi.string().email().max(255).optional(),

      role: Joi.string().valid('admin', 'teacher', 'student', 'parent').optional(),

      is_active: Joi.boolean().optional(),
   }),

   login: Joi.object({
      username: Joi.string().trim().required(),
      password: Joi.string().required(),
   }),

   changePassword: Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: commonSchemas.password,
      confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
         'any.only': 'Password confirmation does not match',
      }),
   }),
};

// Export convenience functions
module.exports = createTenantModels;

module.exports.ModelRegistry = createModelRegistry;
module.exports.modelRegistry = modelRegistry;

// System model getters
module.exports.getSystemModels = () => modelRegistry.getSystemModels();
module.exports.getTrustModel = () => modelRegistry.getSystemModels().Trust;
module.exports.getSystemUserModel = () => modelRegistry.getSystemModels().SystemUser;
module.exports.getSystemAuditLogModel = () => modelRegistry.getSystemModels().SystemAuditLog;

// Tenant model getters
module.exports.getTenantModels = (tenantCode) => modelRegistry.getTenantModels(tenantCode);

// Validation schemas
module.exports.userValidationSchemas = userValidationSchemas;

// Initialize functions
module.exports.initializeSystemModels = () => modelRegistry.initializeSystemModels();
module.exports.initializeTenantModels = (tenantCode) => modelRegistry.initializeTenantModels(tenantCode);
