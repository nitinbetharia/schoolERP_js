/**
 * Central Model Loader & Associations (Q13 Compliance)
 *
 * This file centralizes all model loading and association setup
 * following the HYBRID ARCHITECTURE pattern and Q13 requirements.
 *
 * Q13: Associations defined using Model.associate = (models) => {...}
 * Q1: Uses Sequelize ORM only
 * Q5: Multi-tenant database support
 */

const path = require('path');
const { Sequelize } = require('sequelize');

/**
 * Central Model Registration and Association Setup
 * @param {Sequelize} sequelize - Tenant-specific sequelize instance
 * @returns {Object} - All loaded models with associations
 */
function loadModels(sequelize) {
  const models = {};

  // ==========================================
  // CORE MODELS (Root level - Shared entities)
  // ==========================================

  // Load core models from root models/ directory
  models.User = require('./User')(sequelize);
  models.Student = require('./Student')(sequelize);
  models.School = require('./School')(sequelize);
  // models.Class = require('./Class')(sequelize);
  // models.Section = require('./Section')(sequelize);
  // models.Subject = require('./Subject')(sequelize);
  // models.AcademicYear = require('./AcademicYear')(sequelize);

  // ==========================================
  // MODULE-SPECIFIC MODELS (Domain entities)
  // ==========================================

  // Fee Management Models
  models.FeeStructure = require('../modules/fees/models/FeeStructure')(sequelize);
  models.FeeTransaction = require('../modules/fees/models/FeeTransaction')(sequelize);

  // Attendance Models
  models.AttendanceRecord = require('../modules/attendance/models/AttendanceRecord')(sequelize);
  models.AttendanceConfig = require('../modules/attendance/models/AttendanceConfig')(sequelize);

  // Communication Models
  models.MessageTemplate = require('../modules/communication/models/MessageTemplate')(sequelize);
  models.Message = require('../modules/communication/models/Message')(sequelize);
  models.CommunicationLog = require('../modules/communication/models/CommunicationLog')(sequelize);

  // Audit Models
  models.AuditLog = require('../modules/audit/models/AuditLog')(sequelize);

  // ==========================================
  // Q13 COMPLIANCE: SETUP ALL ASSOCIATIONS
  // ==========================================

  Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) {
      models[modelName].associate(models);
    }
  });

  return models;
}

/**
 * Initialize models for a specific tenant database
 * @param {string} trustCode - Trust code for database identification
 * @returns {Object} - Initialized models with associations
 */
async function initializeTenantModels(trustCode) {
  const config = require('../config');
  const dbConfig = config.get('database');

  // Create tenant-specific Sequelize instance
  const sequelize = new Sequelize({
    dialect: 'mysql',
    host: dbConfig.connection.host,
    port: dbConfig.connection.port,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: `${dbConfig.tenant.prefix}${trustCode}`,
    pool: dbConfig.pool,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    timezone: '+05:30', // Indian timezone
    define: {
      underscored: true, // Q16: Snake_case in DB
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  });

  // Load all models with associations
  const models = loadModels(sequelize);

  // Attach sequelize instance to models object for easy access
  models.sequelize = sequelize;
  models.Sequelize = Sequelize;

  return models;
}

/**
 * Initialize system database models (for system-level operations)
 * @returns {Object} - System models (Trust, SystemUser, SystemAuditLog)
 */
async function initializeSystemModels() {
  const config = require('../config');
  const dbConfig = config.get('database');

  // Create system database Sequelize instance
  const sequelize = new Sequelize({
    dialect: 'mysql',
    host: dbConfig.connection.host,
    port: dbConfig.connection.port,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: dbConfig.system.name, // Q1 Decision: Standardized name
    pool: dbConfig.pool,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    timezone: '+05:30',
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  });

  const models = {};

  // System-level models
  models.Trust = require('../modules/system/models/Trust')(sequelize);
  models.SystemUser = require('../modules/system/models/SystemUser')(sequelize);
  models.SystemAuditLog = require('../modules/system/models/SystemAuditLog')(sequelize);

  // Setup associations for system models
  Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) {
      models[modelName].associate(models);
    }
  });

  models.sequelize = sequelize;
  models.Sequelize = Sequelize;

  return models;
}

/**
 * Sync all models with database (create tables if not exist)
 * @param {Object} models - Models object with sequelize instance
 * @param {Object} options - Sync options
 */
async function syncModels(models, options = {}) {
  try {
    await models.sequelize.sync({
      force: options.force || false,
      alter: options.alter || false,
      logging: options.logging !== false
    });
    console.log('✅ Database models synchronized successfully');
  } catch (error) {
    console.error('❌ Model synchronization failed:', error.message);
    throw error;
  }
}

module.exports = {
  loadModels,
  initializeTenantModels,
  initializeSystemModels,
  syncModels
};
