const logger = require('../../../utils/logger');
const models = require('../../../models/system/database');

/**
 * SchoolService
 * Handles business logic for school management
 * Uses centralized error handling - just throw regular Error objects
 */
class SchoolService {
   constructor() {
      // Initialize service
   }

   /**
    * Create a new school
    */
   async createSchool(trustId, schoolData) {
      try {
         logger.info('Creating school', {
            service: 'schoolservice',
            trust_id: trustId,
            school_name: schoolData.name,
         });

         // Get tenant models for the trust
         const tenantModels = await models.getTenantModels(trustId);
         if (!tenantModels || !tenantModels.School) {
            const err = new Error('Tenant models not initialized');
            err.statusCode = 500;
            throw err;
         }

         const school = await tenantModels.School.create({
            ...schoolData,
            trust_id: trustId,
            created_at: new Date(),
            updated_at: new Date(),
         });

         return school;
      } catch (error) {
         logger.error('SchoolService createSchool Error', {
            service: 'schoolservice',
            trust_id: trustId,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Get schools for a trust
    */
   async getSchools(trustId, _filters = {}) {
      try {
         logger.info('Getting schools', {
            service: 'schoolservice',
            trust_id: trustId,
         });

         const tenantModels = await models.getTenantModels(trustId);
         if (!tenantModels || !tenantModels.School) {
            const err = new Error('Tenant models not initialized');
            err.statusCode = 400;
            throw err;
         }

         const schools = await tenantModels.School.findAll({
            where: { trust_id: trustId },
            order: [['created_at', 'DESC']],
         });

         return schools;
      } catch (error) {
         logger.error('SchoolService getSchools Error', {
            service: 'schoolservice',
            trust_id: trustId,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Get school by ID
    */
   async getSchoolById(trustId, schoolId) {
      try {
         logger.info('Getting school by ID', {
            service: 'schoolservice',
            trust_id: trustId,
            school_id: schoolId,
         });

         const tenantModels = await models.getTenantModels(trustId);
         if (!tenantModels || !tenantModels.School) {
            const err = new Error('Tenant models not initialized');
            err.statusCode = 400;
            throw err;
         }

         const school = await tenantModels.School.findOne({
            where: {
               id: schoolId,
               trust_id: trustId,
            },
         });

         if (!school) {
            const err = new Error('School not found');
            err.statusCode = 400;
            throw err;
         }

         return school;
      } catch (error) {
         logger.error('SchoolService getSchoolById Error', {
            service: 'schoolservice',
            trust_id: trustId,
            school_id: schoolId,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Update school
    */
   async updateSchool(trustId, schoolId, updateData) {
      try {
         logger.info('Updating school', {
            service: 'schoolservice',
            trust_id: trustId,
            school_id: schoolId,
         });

         const tenantModels = await models.getTenantModels(trustId);
         if (!tenantModels || !tenantModels.School) {
            const err = new Error('Tenant models not initialized');
            err.statusCode = 400;
            throw err;
         }

         const [updatedRowsCount] = await tenantModels.School.update(
            { ...updateData, updated_at: new Date() },
            {
               where: {
                  id: schoolId,
                  trust_id: trustId,
               },
            }
         );

         if (updatedRowsCount === 0) {
            const err = new Error('School not found or no changes made');
            err.statusCode = 400;
            throw err;
         }

         return await this.getSchoolById(trustId, schoolId);
      } catch (error) {
         logger.error('SchoolService updateSchool Error', {
            service: 'schoolservice',
            trust_id: trustId,
            school_id: schoolId,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Delete school (soft delete)
    */
   async deleteSchool(trustId, schoolId) {
      try {
         logger.info('Deleting school', {
            service: 'schoolservice',
            trust_id: trustId,
            school_id: schoolId,
         });

         const tenantModels = await models.getTenantModels(trustId);
         if (!tenantModels || !tenantModels.School) {
            const err = new Error('Tenant models not initialized');
            err.statusCode = 400;
            throw err;
         }

         const [updatedRowsCount] = await tenantModels.School.update(
            {
               status: 'INACTIVE',
               deleted_at: new Date(),
               updated_at: new Date(),
            },
            {
               where: {
                  id: schoolId,
                  trust_id: trustId,
               },
            }
         );

         if (updatedRowsCount === 0) {
            const err = new Error('School not found');
            err.statusCode = 400;
            throw err;
         }

         return { success: true };
      } catch (error) {
         logger.error('SchoolService deleteSchool Error', {
            service: 'schoolservice',
            trust_id: trustId,
            school_id: schoolId,
            error: error.message,
         });
         throw error;
      }
   }
}

module.exports = SchoolService;
