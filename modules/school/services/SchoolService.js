const logger = require('../../../utils/logger');
const { ValidationError, NotFoundError, DuplicateError } = require('../../../utils/errors');

/**
 * School Service
 * Handles school management operations within a tenant
 */
class SchoolService {
   constructor() {
      this.validSchoolTypes = ['PRIMARY', 'SECONDARY', 'HIGHER_SECONDARY', 'NURSERY', 'MIXED'];
      this.validAffiliationBoards = ['CBSE', 'ICSE', 'STATE_BOARD', 'IB', 'CAMBRIDGE', 'OTHER'];
   }

   /**
    * Create a new school
    */
   async createSchool(tenantCode, schoolData, createdBy) {
      try {
         const { getTenantModels } = require('../../../models');
         const tenantModels = await getTenantModels(tenantCode);
         const { School } = tenantModels;

         // Validate required fields
         if (!schoolData.name) {
            throw new ValidationError('School name is required');
         }

         if (!schoolData.code) {
            throw new ValidationError('School code is required');
         }

         // Check if school code already exists
         const existingSchool = await School.findOne({
            where: { code: schoolData.code },
         });

         if (existingSchool) {
            throw new DuplicateError('School code already exists');
         }

         // Validate school type
         if (schoolData.type && !this.validSchoolTypes.includes(schoolData.type)) {
            throw new ValidationError(`Invalid school type. Must be one of: ${this.validSchoolTypes.join(', ')}`);
         }

         // Create school
         const school = await School.create({
            name: schoolData.name,
            code: schoolData.code,
            type: schoolData.type || 'MIXED',
            address: schoolData.address,
            city: schoolData.city,
            state: schoolData.state,
            postal_code: schoolData.postal_code,
            phone: schoolData.phone,
            email: schoolData.email,
            website: schoolData.website,
            principal_name: schoolData.principal_name,
            principal_phone: schoolData.principal_phone,
            principal_email: schoolData.principal_email,
            established_year: schoolData.established_year,
            affiliation_board: schoolData.affiliation_board,
            affiliation_number: schoolData.affiliation_number,
            registration_number: schoolData.registration_number,
            capacity: schoolData.capacity,
            current_strength: schoolData.current_strength || 0,
            status: schoolData.status || 'ACTIVE',
            settings: schoolData.settings || {},
            created_by: createdBy,
         });

         logger.info('School Service Event', {
            service: 'school-service',
            category: 'SCHOOL',
            event: 'School created successfully',
            tenant_code: tenantCode,
            school_id: school.id,
            school_code: school.code,
            created_by: createdBy,
         });

         return {
            school: {
               id: school.id,
               name: school.name,
               code: school.code,
               type: school.type,
               address: school.address,
               city: school.city,
               state: school.state,
               phone: school.phone,
               email: school.email,
               principal_name: school.principal_name,
               status: school.status,
               created_at: school.createdAt,
            },
         };
      } catch (error) {
         logger.error('School Service Error', {
            service: 'school-service',
            category: 'SCHOOL',
            event: 'School creation failed',
            tenant_code: tenantCode,
            error: error.message,
            created_by: createdBy,
         });
         throw error;
      }
   }

   /**
    * Get all schools for a tenant
    */
   async getSchools(tenantCode, options = {}) {
      try {
         const { getTenantModels } = require('../../../models');
         const tenantModels = await getTenantModels(tenantCode);
         const { School } = tenantModels;

         const { page = 1, limit = 50, status, type } = options;
         const offset = (page - 1) * limit;

         const whereConditions = {};

         if (status) {
            whereConditions.status = status;
         }

         if (type) {
            whereConditions.type = type;
         }

         const schools = await School.findAndCountAll({
            where: whereConditions,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['name', 'ASC']],
            attributes: [
               'id',
               'name',
               'code',
               'type',
               'address',
               'city',
               'state',
               'phone',
               'email',
               'principal_name',
               'status',
               'capacity',
               'current_strength',
               'created_at',
               'updated_at',
            ],
         });

         logger.info('School Service Event', {
            service: 'school-service',
            category: 'SCHOOL',
            event: 'Schools retrieved successfully',
            tenant_code: tenantCode,
            count: schools.count,
            page,
            limit,
         });

         return {
            schools: schools.rows,
            pagination: {
               total: schools.count,
               page: parseInt(page),
               limit: parseInt(limit),
               pages: Math.ceil(schools.count / limit),
            },
         };
      } catch (error) {
         logger.error('School Service Error', {
            service: 'school-service',
            category: 'SCHOOL',
            event: 'Schools retrieval failed',
            tenant_code: tenantCode,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Get school by ID
    */
   async getSchoolById(tenantCode, schoolId) {
      try {
         const { getTenantModels } = require('../../../models');
         const tenantModels = await getTenantModels(tenantCode);
         const { School, Class } = tenantModels;

         const school = await School.findOne({
            where: { id: schoolId },
            include: [
               {
                  model: Class,
                  as: 'classes',
                  attributes: ['id', 'name', 'standard', 'status'],
                  required: false,
               },
            ],
         });

         if (!school) {
            throw new NotFoundError('School not found');
         }

         logger.info('School Service Event', {
            service: 'school-service',
            category: 'SCHOOL',
            event: 'School retrieved successfully',
            tenant_code: tenantCode,
            school_id: schoolId,
         });

         return {
            school: {
               id: school.id,
               name: school.name,
               code: school.code,
               type: school.type,
               address: school.address,
               city: school.city,
               state: school.state,
               postal_code: school.postal_code,
               phone: school.phone,
               email: school.email,
               website: school.website,
               principal_name: school.principal_name,
               principal_phone: school.principal_phone,
               principal_email: school.principal_email,
               established_year: school.established_year,
               affiliation_board: school.affiliation_board,
               affiliation_number: school.affiliation_number,
               registration_number: school.registration_number,
               capacity: school.capacity,
               current_strength: school.current_strength,
               status: school.status,
               settings: school.settings,
               classes: school.classes,
               created_at: school.createdAt,
               updated_at: school.updatedAt,
            },
         };
      } catch (error) {
         logger.error('School Service Error', {
            service: 'school-service',
            category: 'SCHOOL',
            event: 'School retrieval failed',
            tenant_code: tenantCode,
            school_id: schoolId,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Update school
    */
   async updateSchool(tenantCode, schoolId, schoolData, updatedBy) {
      try {
         const { getTenantModels } = require('../../../models');
         const tenantModels = await getTenantModels(tenantCode);
         const { School } = tenantModels;

         const school = await School.findOne({
            where: { id: schoolId },
         });

         if (!school) {
            throw new NotFoundError('School not found');
         }

         // Check if code is being changed and if it conflicts
         if (schoolData.code && schoolData.code !== school.code) {
            const existingSchool = await School.findOne({
               where: { code: schoolData.code },
            });

            if (existingSchool) {
               throw new DuplicateError('School code already exists');
            }
         }

         // Validate school type
         if (schoolData.type && !this.validSchoolTypes.includes(schoolData.type)) {
            throw new ValidationError(`Invalid school type. Must be one of: ${this.validSchoolTypes.join(', ')}`);
         }

         // Update school
         await school.update({
            ...schoolData,
            updated_by: updatedBy,
         });

         logger.info('School Service Event', {
            service: 'school-service',
            category: 'SCHOOL',
            event: 'School updated successfully',
            tenant_code: tenantCode,
            school_id: schoolId,
            updated_by: updatedBy,
         });

         return {
            school: {
               id: school.id,
               name: school.name,
               code: school.code,
               type: school.type,
               address: school.address,
               city: school.city,
               state: school.state,
               phone: school.phone,
               email: school.email,
               principal_name: school.principal_name,
               status: school.status,
               updated_at: school.updatedAt,
            },
         };
      } catch (error) {
         logger.error('School Service Error', {
            service: 'school-service',
            category: 'SCHOOL',
            event: 'School update failed',
            tenant_code: tenantCode,
            school_id: schoolId,
            error: error.message,
            updated_by: updatedBy,
         });
         throw error;
      }
   }

   /**
    * Delete school (soft delete)
    */
   async deleteSchool(tenantCode, schoolId, deletedBy) {
      try {
         const { getTenantModels } = require('../../../models');
         const tenantModels = await getTenantModels(tenantCode);
         const { School, Class } = tenantModels;

         const school = await School.findOne({
            where: { id: schoolId },
            include: [
               {
                  model: Class,
                  as: 'classes',
                  required: false,
               },
            ],
         });

         if (!school) {
            throw new NotFoundError('School not found');
         }

         // Check if school has active classes
         if (school.classes && school.classes.length > 0) {
            const activeClasses = school.classes.filter((cls) => cls.status === 'ACTIVE');
            if (activeClasses.length > 0) {
               throw new ValidationError(
                  'Cannot delete school with active classes. Please remove or deactivate all classes first.'
               );
            }
         }

         // Soft delete
         await school.update({
            status: 'DELETED',
            deleted_by: deletedBy,
            deleted_at: new Date(),
         });

         logger.info('School Service Event', {
            service: 'school-service',
            category: 'SCHOOL',
            event: 'School deleted successfully',
            tenant_code: tenantCode,
            school_id: schoolId,
            deleted_by: deletedBy,
         });

         return {
            success: true,
            message: 'School deleted successfully',
         };
      } catch (error) {
         logger.error('School Service Error', {
            service: 'school-service',
            category: 'SCHOOL',
            event: 'School deletion failed',
            tenant_code: tenantCode,
            school_id: schoolId,
            error: error.message,
            deleted_by: deletedBy,
         });
         throw error;
      }
   }

   /**
    * Get school statistics
    */
   async getSchoolStats(tenantCode, schoolId) {
      try {
         const { getTenantModels } = require('../../../models');
         const tenantModels = await getTenantModels(tenantCode);
         const { School, Class, Section } = tenantModels;

         const school = await School.findOne({
            where: { id: schoolId },
            include: [
               {
                  model: Class,
                  as: 'classes',
                  include: [
                     {
                        model: Section,
                        as: 'sections',
                        required: false,
                     },
                  ],
                  required: false,
               },
            ],
         });

         if (!school) {
            throw new NotFoundError('School not found');
         }

         const stats = {
            school_id: school.id,
            school_name: school.name,
            total_classes: school.classes ? school.classes.length : 0,
            active_classes: school.classes ? school.classes.filter((cls) => cls.status === 'ACTIVE').length : 0,
            total_sections: 0,
            capacity: school.capacity || 0,
            current_strength: school.current_strength || 0,
            utilization_percentage: school.capacity ? Math.round((school.current_strength / school.capacity) * 100) : 0,
         };

         // Count total sections
         if (school.classes) {
            stats.total_sections = school.classes.reduce((total, cls) => {
               return total + (cls.sections ? cls.sections.length : 0);
            }, 0);
         }

         logger.info('School Service Event', {
            service: 'school-service',
            category: 'SCHOOL',
            event: 'School statistics retrieved successfully',
            tenant_code: tenantCode,
            school_id: schoolId,
         });

         return { stats };
      } catch (error) {
         logger.error('School Service Error', {
            service: 'school-service',
            category: 'SCHOOL',
            event: 'School statistics retrieval failed',
            tenant_code: tenantCode,
            school_id: schoolId,
            error: error.message,
         });
         throw error;
      }
   }
}

module.exports = SchoolService;
