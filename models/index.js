const { dbManager } = require('./database');
const { defineTrustModel } = require('./Trust');
const { defineSystemUserModel, defineSystemAuditLogModel } = require('./SystemUser');
const { defineSetupConfiguration } = require('../modules/setup/models/SetupConfiguration');
const { defineUserProfile } = require('../modules/user/models/UserProfile');
const { defineSchool } = require('../modules/school/models/School');
const { defineClass } = require('../modules/school/models/Class');
const { defineSection } = require('../modules/school/models/Section');
const { defineStudent } = require('./Student');
const { defineAcademicYear } = require('./AcademicYear');
const { defineStudentEnrollment } = require('./StudentEnrollment');
const { defineStudentDocument } = require('./StudentDocument');
const { logger, logSystem, logError } = require('../utils/logger');

/**
 * Model registry for system and tenant databases
 * Manages model definitions and associations
 */
class ModelRegistry {
   constructor() {
      this.systemModels = {};
      this.tenantModels = new Map();
      this.initialized = false;
   }

   /**
    * Initialize system models
    */
   async initializeSystemModels() {
      try {
         if (this.initialized) {
            return this.systemModels;
         }

         logSystem('Initializing system models');

         // Get system database connection
         const systemDB = await dbManager.initializeSystemDB();

         // Define system models
         this.systemModels.Trust = defineTrustModel(systemDB);
         this.systemModels.SystemUser = defineSystemUserModel(systemDB);
         this.systemModels.SystemAuditLog = defineSystemAuditLogModel(systemDB);
         this.systemModels.SetupConfiguration = defineSetupConfiguration(systemDB);

         // Set up associations
         this.setupSystemAssociations();

         // Sync database schema in development
         if (process.env.NODE_ENV === 'development') {
            await systemDB.sync({ alter: true });
            logSystem('System database schema synchronized');
         }

         this.initialized = true;
         logSystem('System models initialized successfully');

         return this.systemModels;
      } catch (error) {
         logError(error, { context: 'initializeSystemModels' });
         throw error;
      }
   }

   /**
    * Setup system model associations
    */
   setupSystemAssociations() {
      const { Trust, SystemUser, SystemAuditLog } = this.systemModels;

      // SystemUser associations
      if (SystemUser.associate) {
         SystemUser.associate(this.systemModels);
      }

      // SystemAuditLog associations
      if (SystemAuditLog.associate) {
         SystemAuditLog.associate(this.systemModels);
      }

      logSystem('System model associations configured');
   }

   /**
    * Get system models
    */
   getSystemModels() {
      if (!this.initialized) {
         throw new Error('System models not initialized');
      }
      return this.systemModels;
   }

   /**
    * Initialize tenant models for a specific tenant
    */
   async initializeTenantModels(tenantCode) {
      try {
         logSystem(`Initializing tenant models for: ${tenantCode}`);

         // Get tenant database connection
         const tenantDB = await dbManager.getTenantDB(tenantCode);

         // Define tenant models (complete academic system)
         const tenantModels = {
            // User model (tenant-specific users)
            User: this.defineTenantUserModel(tenantDB),

            // User profile model
            UserProfile: defineUserProfile(tenantDB),

            // School management models
            School: defineSchool(tenantDB),
            Class: defineClass(tenantDB),
            Section: defineSection(tenantDB),

            // Academic year management
            AcademicYear: defineAcademicYear(tenantDB),

            // Student lifecycle models
            Student: defineStudent(tenantDB),
            StudentEnrollment: defineStudentEnrollment(tenantDB),
            StudentDocument: defineStudentDocument(tenantDB),

            // Audit log for tenant operations
            AuditLog: this.defineTenantAuditLogModel(tenantDB),
         };

         // Set up tenant associations
         this.setupTenantAssociations(tenantModels);

         // Sync database schema in development
         if (process.env.NODE_ENV === 'development') {
            await tenantDB.sync({ alter: true });
            logSystem(`Tenant database schema synchronized for: ${tenantCode}`);
         }

         // Store tenant models
         this.tenantModels.set(tenantCode, tenantModels);

         logSystem(`Tenant models initialized successfully for: ${tenantCode}`);
         return tenantModels;
      } catch (error) {
         logError(error, { context: 'initializeTenantModels', tenantCode });
         throw error;
      }
   }

   /**
    * Define tenant user model (Phase 2B expansion)
    */
   defineTenantUserModel(sequelize) {
      const { DataTypes } = require('sequelize');
      const { USER_ROLES, USER_STATUS } = require('../config/business-constants');

      return sequelize.define(
         'User',
         {
            id: {
               type: DataTypes.INTEGER,
               primaryKey: true,
               autoIncrement: true,
            },
            username: {
               type: DataTypes.STRING(100),
               allowNull: false,
               unique: true,
            },
            email: {
               type: DataTypes.STRING(255),
               allowNull: true,
               unique: true,
               validate: { isEmail: true },
            },
            password: {
               type: DataTypes.STRING(255),
               allowNull: false,
            },
            role: {
               type: DataTypes.STRING(50),
               allowNull: false,
               defaultValue: 'STUDENT',
               validate: {
                  isIn: [['STUDENT', 'TEACHER', 'STAFF', 'PRINCIPAL', 'ADMIN', 'TRUST_ADMIN']],
               },
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
         }
      );
   }

   /**
    * Define tenant audit log model
    */
   defineTenantAuditLogModel(sequelize) {
      const { DataTypes } = require('sequelize');

      return sequelize.define(
         'AuditLog',
         {
            id: {
               type: DataTypes.INTEGER,
               primaryKey: true,
               autoIncrement: true,
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
               type: DataTypes.STRING(50),
               allowNull: true,
            },
            changes: {
               type: DataTypes.JSON,
               allowNull: true,
            },
            ip_address: {
               type: DataTypes.STRING(45),
               allowNull: true,
            },
            metadata: {
               type: DataTypes.JSON,
               allowNull: true,
            },
         },
         {
            tableName: 'audit_logs',
            timestamps: false,
            createdAt: 'created_at',
         }
      );
   }

   /**
    * Setup tenant model associations
    */
   setupTenantAssociations(tenantModels) {
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
         AuditLog,
      } = tenantModels;

      // User associations
      User.hasOne(UserProfile, {
         foreignKey: 'user_id',
         as: 'profile',
      });

      UserProfile.belongsTo(User, {
         foreignKey: 'user_id',
         as: 'user',
      });

      User.hasOne(Student, {
         foreignKey: 'user_id',
         as: 'studentProfile',
      });

      // School associations
      School.hasMany(Class, {
         foreignKey: 'school_id',
         as: 'classes',
      });

      School.hasMany(Student, {
         foreignKey: 'school_id',
         as: 'students',
      });

      School.hasMany(AcademicYear, {
         foreignKey: 'school_id',
         as: 'academicYears',
      });

      // Class associations
      Class.belongsTo(School, {
         foreignKey: 'school_id',
         as: 'school',
      });

      Class.hasMany(Section, {
         foreignKey: 'class_id',
         as: 'sections',
      });

      Class.hasMany(Student, {
         foreignKey: 'class_id',
         as: 'students',
      });

      Class.hasMany(StudentEnrollment, {
         foreignKey: 'class_id',
         as: 'enrollments',
      });

      // Section associations
      Section.belongsTo(Class, {
         foreignKey: 'class_id',
         as: 'class',
      });

      Section.hasMany(Student, {
         foreignKey: 'section_id',
         as: 'students',
      });

      Section.hasMany(StudentEnrollment, {
         foreignKey: 'section_id',
         as: 'enrollments',
      });

      // Academic Year associations
      AcademicYear.belongsTo(School, {
         foreignKey: 'school_id',
         as: 'school',
      });

      // Student associations
      Student.belongsTo(User, {
         foreignKey: 'user_id',
         as: 'user',
      });

      Student.belongsTo(School, {
         foreignKey: 'school_id',
         as: 'school',
      });

      Student.belongsTo(Class, {
         foreignKey: 'class_id',
         as: 'class',
      });

      Student.belongsTo(Section, {
         foreignKey: 'section_id',
         as: 'section',
      });

      Student.hasMany(StudentEnrollment, {
         foreignKey: 'student_id',
         as: 'enrollments',
      });

      Student.hasMany(StudentDocument, {
         foreignKey: 'student_id',
         as: 'documents',
      });

      // Student Enrollment associations
      StudentEnrollment.belongsTo(Student, {
         foreignKey: 'student_id',
         as: 'student',
      });

      StudentEnrollment.belongsTo(School, {
         foreignKey: 'school_id',
         as: 'school',
      });

      StudentEnrollment.belongsTo(Class, {
         foreignKey: 'class_id',
         as: 'class',
      });

      StudentEnrollment.belongsTo(Section, {
         foreignKey: 'section_id',
         as: 'section',
      });

      // Student Document associations
      StudentDocument.belongsTo(Student, {
         foreignKey: 'student_id',
         as: 'student',
      });

      // Audit Log associations
      AuditLog.belongsTo(User, {
         foreignKey: 'user_id',
         as: 'user',
      });

      User.hasMany(AuditLog, {
         foreignKey: 'user_id',
         as: 'auditLogs',
      });
   }

   /**
    * Get tenant models for a specific tenant
    */
   getTenantModels(tenantCode) {
      if (!this.tenantModels.has(tenantCode)) {
         throw new Error(`Tenant models not initialized for: ${tenantCode}`);
      }
      return this.tenantModels.get(tenantCode);
   }

   /**
    * Health check for model registry
    */
   async healthCheck() {
      const health = {
         systemModels: Object.keys(this.systemModels).length,
         tenantModels: this.tenantModels.size,
         initialized: this.initialized,
         activeTenants: Array.from(this.tenantModels.keys()),
      };

      return health;
   }
}

// Create singleton instance
const modelRegistry = new ModelRegistry();

// Export convenience functions
module.exports = {
   ModelRegistry,
   modelRegistry,

   // System model getters
   getSystemModels: () => modelRegistry.getSystemModels(),
   getTrustModel: () => modelRegistry.getSystemModels().Trust,
   getSystemUserModel: () => modelRegistry.getSystemModels().SystemUser,
   getSystemAuditLogModel: () => modelRegistry.getSystemModels().SystemAuditLog,

   // Tenant model getters
   getTenantModels: (tenantCode) => modelRegistry.getTenantModels(tenantCode),

   // Initialize functions
   initializeSystemModels: () => modelRegistry.initializeSystemModels(),
   initializeTenantModels: (tenantCode) => modelRegistry.initializeTenantModels(tenantCode),
};
