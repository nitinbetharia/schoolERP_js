const { logSystem, logError } = require('../utils/logger');
const { createNotFoundError, createConflictError, createInternalError } = require('../utils/errorHelpers');

// Helper function to get Trust model
async function getTrustModel() {
   const { dbManager } = require('../models/system/database');
   const { defineTrustModel } = require('../models/tenant/Trust');
   const systemDB = await dbManager.getSystemDB();
   const Trust = defineTrustModel(systemDB);
   return Trust;
}

/**
 * Trust Service
 * Handles trust management operations
 */
function createTrustService() {
   /**
    * Create new trust
    */
   async function createTrust(trustData) {
      try {
         // Get trust model using helper function
         const Trust = await getTrustModel();

         // Check if trust code already exists
         const existingTrustCode = await Trust.findOne({
            where: { trust_code: trustData.trust_code.toLowerCase() },
         });

         if (existingTrustCode) {
            throw createConflictError('Trust code already exists');
         }

         // Check if subdomain already exists
         const existingSubdomain = await Trust.findOne({
            where: { subdomain: trustData.subdomain.toLowerCase() },
         });

         if (existingSubdomain) {
            throw createConflictError('Subdomain already exists');
         }

         // Create trust
         const trust = await Trust.create({
            trust_name: trustData.trust_name,
            trust_code: trustData.trust_code.toLowerCase(),
            subdomain: trustData.subdomain.toLowerCase(),
            database_name: `school_erp_trust_${trustData.trust_code.toLowerCase()}`,
            contact_email: trustData.contact_email.toLowerCase(),
            contact_phone: trustData.contact_phone,
            address: trustData.address,
            tenant_config: trustData.tenant_config || {},
            status: 'SETUP_PENDING',
         });

         logSystem(`Trust created: ${trust.trust_name}`, {
            trustId: trust.id,
            trustCode: trust.trust_code,
         });

         return trust;
      } catch (error) {
         if (error.isOperational) {
            throw error;
         }
         throw createInternalError('Failed to create trust', 'TRUST_CREATION_ERROR', {
            originalError: error.message,
         });
      }
   }

   /**
    * Get trust by ID or code
    */
   async function getTrust(identifier, field = 'id') {
      try {
         const Trust = await getTrustModel();

         const whereClause = {};
         whereClause[field] = field === 'trust_code' || field === 'subdomain' ? identifier.toLowerCase() : identifier;

         const trust = await Trust.findOne({
            where: whereClause,
         });

         if (!trust) {
            throw createNotFoundError(`Trust not found with ${field}: ${identifier}`);
         }

         return trust;
      } catch (error) {
         if (error.isOperational) {
            throw error;
         }
         throw createInternalError('Failed to get trust', 'TRUST_GET_ERROR', {
            originalError: error.message,
         });
      }
   }

   /**
    * Update trust
    */
   async function updateTrust(trustId, updateData) {
      try {
         const Trust = await getTrustModel();

         // Check for unique constraint violations if updating trust_code or subdomain
         if (updateData.trust_code) {
            const existingTrustCode = await Trust.findOne({
               where: {
                  trust_code: updateData.trust_code.toLowerCase(),
                  id: { [require('sequelize').Op.ne]: trustId },
               },
            });

            if (existingTrustCode) {
               throw createConflictError('Trust code already exists');
            }
            updateData.trust_code = updateData.trust_code.toLowerCase();
         }

         if (updateData.subdomain) {
            const existingSubdomain = await Trust.findOne({
               where: {
                  subdomain: updateData.subdomain.toLowerCase(),
                  id: { [require('sequelize').Op.ne]: trustId },
               },
            });

            if (existingSubdomain) {
               throw createConflictError('Subdomain already exists');
            }
            updateData.subdomain = updateData.subdomain.toLowerCase();
         }

         if (updateData.contact_email) {
            updateData.contact_email = updateData.contact_email.toLowerCase();
         }

         const [updatedCount] = await Trust.update(updateData, {
            where: { id: trustId },
         });

         if (updatedCount === 0) {
            throw createNotFoundError('Trust not found');
         }

         const updatedTrust = await Trust.findByPk(trustId);

         logSystem(`Trust updated: ${updatedTrust.trust_name}`, {
            trustId: updatedTrust.id,
            updatedFields: Object.keys(updateData),
         });

         return updatedTrust;
      } catch (error) {
         if (error.isOperational) {
            throw error;
         }
         throw createInternalError('Failed to update trust', 'TRUST_UPDATE_ERROR', {
            originalError: error.message,
         });
      }
   }

   /**
    * List all trusts with filtering and pagination
    */
   async function listTrusts(options = {}) {
      try {
         const Trust = await getTrustModel();

         const { page = 1, limit = 20, status = null, search = null } = options;

         const whereClause = {};

         if (status) {
            whereClause.status = status;
         }

         if (search) {
            whereClause[require('sequelize').Op.or] = [
               { trust_name: { [require('sequelize').Op.iLike]: `%${search}%` } },
               { trust_code: { [require('sequelize').Op.iLike]: `%${search}%` } },
               { contact_email: { [require('sequelize').Op.iLike]: `%${search}%` } },
            ];
         }

         const offset = (page - 1) * limit;

         const { rows: trusts, count: total } = await Trust.findAndCountAll({
            where: whereClause,
            order: [['created_at', 'DESC']],
            limit,
            offset,
         });

         return {
            trusts,
            pagination: {
               total,
               page: parseInt(page),
               limit: parseInt(limit),
               totalPages: Math.ceil(total / limit),
            },
         };
      } catch (error) {
         logError(error, { context: 'listTrusts', options });
         throw createInternalError('Failed to list trusts', 'TRUST_LIST_ERROR', {
            originalError: error.message,
         });
      }
   }

   /**
    * Complete trust setup
    */
   async function completeSetup(trustId, setupData = {}) {
      try {
         const Trust = await getTrustModel();

         const trust = await Trust.findByPk(trustId);
         if (!trust) {
            throw createNotFoundError('Trust not found');
         }

         // Update trust status and setup completion data
         const updateData = {
            status: 'ACTIVE',
            setup_completed_at: new Date(),
            ...setupData,
         };

         await trust.update(updateData);

         logSystem(`Trust setup completed: ${trust.trust_name}`, {
            trustId: trust.id,
            trustCode: trust.trust_code,
         });

         return trust;
      } catch (error) {
         if (error.isOperational) {
            throw error;
         }
         throw createInternalError('Failed to complete trust setup', 'TRUST_SETUP_ERROR', {
            originalError: error.message,
         });
      }
   }

   /**
    * Get system statistics for trusts
    */
   async function getSystemStats() {
      try {
         const { dbManager } = require('../models/system/database');

         const Trust = await getTrustModel();

         // Helper function to get system models
         async function getSystemModels() {
            const { defineSystemUserModel } = require('../models/system/SystemUser');
            const systemDB = await dbManager.getSystemDB();
            const SystemUser = defineSystemUserModel(systemDB);
            return { SystemUser };
         }

         const { SystemUser } = await getSystemModels();

         // Get trust statistics
         const totalTrusts = await Trust.count();
         const activeTrusts = await Trust.count({ where: { status: 'ACTIVE' } });
         const pendingTrusts = await Trust.count({ where: { status: 'SETUP_PENDING' } });
         const suspendedTrusts = await Trust.count({ where: { status: 'SUSPENDED' } });
         const inactiveTrusts = await Trust.count({ where: { status: 'INACTIVE' } });

         // New trusts created in last 7 days
         const { Op } = require('sequelize');
         const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
         const newTrusts7d = await Trust.count({
            where: { created_at: { [Op.gte]: sevenDaysAgo } },
         });

         // Get system user count
         const totalSystemUsers = await SystemUser.count();
         const activeSystemUsers = await SystemUser.count({ where: { status: 'ACTIVE' } });

         // Get database health
         const dbHealth = await dbManager.healthCheck();

         return {
            totalTrusts,
            activeTrusts,
            pendingTrusts,
            suspendedTrusts,
            inactiveTrusts,
            newTrusts7d,
            totalSystemUsers,
            activeUsers: activeSystemUsers,
            systemHealth: dbHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
            databaseStatus: dbHealth.database ? 'connected' : 'disconnected',
            lastUpdated: new Date().toISOString(),
         };
      } catch (error) {
         logError(error, { context: 'getSystemStats' });

         // Return safe defaults on error
         return {
            totalTrusts: 0,
            activeTrusts: 0,
            pendingTrusts: 0,
            totalSystemUsers: 0,
            activeUsers: 0,
            systemHealth: 'unhealthy',
            databaseStatus: 'disconnected',
            lastUpdated: new Date().toISOString(),
            error: 'Unable to retrieve system statistics',
         };
      }
   }

   /**
    * Get recent system activity for dashboard
    * Combines recent trusts and system users changes
    */
   async function getRecentActivity(limit = 5) {
      try {
         const Trust = await getTrustModel();
         const { dbManager } = require('../models/system/database');
         const { defineSystemUserModel } = require('../models/system/SystemUser');
         const systemDB = await dbManager.getSystemDB();
         const SystemUser = defineSystemUserModel(systemDB);

         const recentTrusts = await Trust.findAll({
            order: [['updated_at', 'DESC']],
            limit,
            attributes: ['id', 'trust_name', 'trust_code', 'status', 'updated_at', 'created_at'],
         });

         const recentSysUsers = await SystemUser.findAll({
            order: [['created_at', 'DESC']],
            limit,
            attributes: ['id', 'username', 'email', 'status', 'created_at'],
         });

         const trustEvents = recentTrusts.map((t) => ({
            type: 'TRUST',
            time: t.updated_at || t.created_at,
            title: t.trust_name,
            code: t.trust_code,
            action: 'Trust updated',
            status: t.status,
         }));

         const userEvents = recentSysUsers.map((u) => ({
            type: 'SYSTEM_USER',
            time: u.created_at,
            title: u.username,
            code: u.email,
            action: 'System user created',
            status: u.status,
         }));

         const combined = [...trustEvents, ...userEvents].sort((a, b) => new Date(b.time) - new Date(a.time));

         return combined.slice(0, limit);
      } catch (error) {
         logError(error, { context: 'getRecentActivity' });
         return [];
      }
   }

   return {
      createTrust,
      getTrust,
      updateTrust,
      listTrusts,
      completeSetup,
      getSystemStats,
      getRecentActivity,
   };
}

// Export the service factory
module.exports = { createTrustService };
