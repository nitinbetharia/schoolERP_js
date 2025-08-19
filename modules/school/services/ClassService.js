const logger = require('../../../utils/logger');
const { ValidationError, NotFoundError, DuplicateError } = require('../../../utils/errors');

/**
 * Class Service
 * Handles class management operations within a school
 */
class ClassService {
   constructor() {
      this.validStandards = [
         'NURSERY',
         'LKG',
         'UKG',
         'I',
         'II',
         'III',
         'IV',
         'V',
         'VI',
         'VII',
         'VIII',
         'IX',
         'X',
         'XI',
         'XII',
      ];
   }

   /**
    * Create a new class
    */
   async createClass(tenantCode, classData, createdBy) {
      try {
         const { getTenantModels } = require('../../../models');
         const tenantModels = await getTenantModels(tenantCode);
         const { Class, School } = tenantModels;

         // Validate required fields
         if (!classData.name) {
            throw new ValidationError('Class name is required');
         }

         if (!classData.school_id) {
            throw new ValidationError('School ID is required');
         }

         if (!classData.standard) {
            throw new ValidationError('Class standard is required');
         }

         // Check if school exists
         const school = await School.findByPk(classData.school_id);
         if (!school) {
            throw new NotFoundError('School not found');
         }

         // Check if class already exists in the school
         const existingClass = await Class.findOne({
            where: {
               school_id: classData.school_id,
               name: classData.name,
            },
         });

         if (existingClass) {
            throw new DuplicateError('Class name already exists in this school');
         }

         // Validate standard
         if (!this.validStandards.includes(classData.standard)) {
            throw new ValidationError(`Invalid standard. Must be one of: ${this.validStandards.join(', ')}`);
         }

         // Create class
         const classInstance = await Class.create({
            school_id: classData.school_id,
            name: classData.name,
            standard: classData.standard,
            description: classData.description,
            class_teacher_id: classData.class_teacher_id,
            capacity: classData.capacity || 40,
            status: classData.status || 'ACTIVE',
            created_by: createdBy,
         });

         logger.info('Class Service Event', {
            service: 'class-service',
            category: 'CLASS',
            event: 'Class created successfully',
            tenant_code: tenantCode,
            class_id: classInstance.id,
            school_id: classData.school_id,
            created_by: createdBy,
         });

         return {
            class: {
               id: classInstance.id,
               school_id: classInstance.school_id,
               name: classInstance.name,
               standard: classInstance.standard,
               description: classInstance.description,
               class_teacher_id: classInstance.class_teacher_id,
               capacity: classInstance.capacity,
               status: classInstance.status,
               created_at: classInstance.createdAt,
            },
         };
      } catch (error) {
         logger.error('Class Service Error', {
            service: 'class-service',
            category: 'CLASS',
            event: 'Class creation failed',
            tenant_code: tenantCode,
            error: error.message,
            created_by: createdBy,
         });
         throw error;
      }
   }

   /**
    * Get classes by school ID
    */
   async getClassesBySchool(tenantCode, schoolId, options = {}) {
      try {
         const { getTenantModels } = require('../../../models');
         const tenantModels = await getTenantModels(tenantCode);
         const { Class, Section } = tenantModels;

         const { status } = options;
         const whereConditions = { school_id: schoolId };

         if (status) {
            whereConditions.status = status;
         }

         const classes = await Class.findAll({
            where: whereConditions,
            include: [
               {
                  model: Section,
                  as: 'sections',
                  attributes: ['id', 'name', 'capacity', 'current_strength', 'status'],
                  required: false,
               },
            ],
            order: [
               ['standard', 'ASC'],
               ['name', 'ASC'],
            ],
         });

         logger.info('Class Service Event', {
            service: 'class-service',
            category: 'CLASS',
            event: 'Classes retrieved successfully',
            tenant_code: tenantCode,
            school_id: schoolId,
            count: classes.length,
         });

         return {
            classes: classes.map((cls) => ({
               id: cls.id,
               school_id: cls.school_id,
               name: cls.name,
               standard: cls.standard,
               description: cls.description,
               class_teacher_id: cls.class_teacher_id,
               capacity: cls.capacity,
               status: cls.status,
               sections: cls.sections,
               created_at: cls.createdAt,
               updated_at: cls.updatedAt,
            })),
         };
      } catch (error) {
         logger.error('Class Service Error', {
            service: 'class-service',
            category: 'CLASS',
            event: 'Classes retrieval failed',
            tenant_code: tenantCode,
            school_id: schoolId,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Get class by ID
    */
   async getClassById(tenantCode, classId) {
      try {
         const { getTenantModels } = require('../../../models');
         const tenantModels = await getTenantModels(tenantCode);
         const { Class, Section, School } = tenantModels;

         const classInstance = await Class.findOne({
            where: { id: classId },
            include: [
               {
                  model: School,
                  as: 'school',
                  attributes: ['id', 'name', 'code'],
               },
               {
                  model: Section,
                  as: 'sections',
                  attributes: ['id', 'name', 'capacity', 'current_strength', 'status'],
                  required: false,
               },
            ],
         });

         if (!classInstance) {
            throw new NotFoundError('Class not found');
         }

         logger.info('Class Service Event', {
            service: 'class-service',
            category: 'CLASS',
            event: 'Class retrieved successfully',
            tenant_code: tenantCode,
            class_id: classId,
         });

         return {
            class: {
               id: classInstance.id,
               school_id: classInstance.school_id,
               school: classInstance.school,
               name: classInstance.name,
               standard: classInstance.standard,
               description: classInstance.description,
               class_teacher_id: classInstance.class_teacher_id,
               capacity: classInstance.capacity,
               status: classInstance.status,
               sections: classInstance.sections,
               created_at: classInstance.createdAt,
               updated_at: classInstance.updatedAt,
            },
         };
      } catch (error) {
         logger.error('Class Service Error', {
            service: 'class-service',
            category: 'CLASS',
            event: 'Class retrieval failed',
            tenant_code: tenantCode,
            class_id: classId,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Update class
    */
   async updateClass(tenantCode, classId, classData, updatedBy) {
      try {
         const { getTenantModels } = require('../../../models');
         const tenantModels = await getTenantModels(tenantCode);
         const { Class } = tenantModels;

         const classInstance = await Class.findOne({
            where: { id: classId },
         });

         if (!classInstance) {
            throw new NotFoundError('Class not found');
         }

         // Check if name is being changed and if it conflicts
         if (classData.name && classData.name !== classInstance.name) {
            const existingClass = await Class.findOne({
               where: {
                  school_id: classInstance.school_id,
                  name: classData.name,
                  id: { [require('sequelize').Op.ne]: classId },
               },
            });

            if (existingClass) {
               throw new DuplicateError('Class name already exists in this school');
            }
         }

         // Validate standard if provided
         if (classData.standard && !this.validStandards.includes(classData.standard)) {
            throw new ValidationError(`Invalid standard. Must be one of: ${this.validStandards.join(', ')}`);
         }

         // Update class
         await classInstance.update({
            ...classData,
            updated_by: updatedBy,
         });

         logger.info('Class Service Event', {
            service: 'class-service',
            category: 'CLASS',
            event: 'Class updated successfully',
            tenant_code: tenantCode,
            class_id: classId,
            updated_by: updatedBy,
         });

         return {
            class: {
               id: classInstance.id,
               school_id: classInstance.school_id,
               name: classInstance.name,
               standard: classInstance.standard,
               description: classInstance.description,
               class_teacher_id: classInstance.class_teacher_id,
               capacity: classInstance.capacity,
               status: classInstance.status,
               updated_at: classInstance.updatedAt,
            },
         };
      } catch (error) {
         logger.error('Class Service Error', {
            service: 'class-service',
            category: 'CLASS',
            event: 'Class update failed',
            tenant_code: tenantCode,
            class_id: classId,
            error: error.message,
            updated_by: updatedBy,
         });
         throw error;
      }
   }

   /**
    * Delete class (soft delete)
    */
   async deleteClass(tenantCode, classId, deletedBy) {
      try {
         const { getTenantModels } = require('../../../models');
         const tenantModels = await getTenantModels(tenantCode);
         const { Class, Section } = tenantModels;

         const classInstance = await Class.findOne({
            where: { id: classId },
            include: [
               {
                  model: Section,
                  as: 'sections',
                  required: false,
               },
            ],
         });

         if (!classInstance) {
            throw new NotFoundError('Class not found');
         }

         // Check if class has active sections
         if (classInstance.sections && classInstance.sections.length > 0) {
            const activeSections = classInstance.sections.filter((section) => section.status === 'ACTIVE');
            if (activeSections.length > 0) {
               throw new ValidationError(
                  'Cannot delete class with active sections. Please remove or deactivate all sections first.'
               );
            }
         }

         // Soft delete
         await classInstance.update({
            status: 'DELETED',
            deleted_by: deletedBy,
            deleted_at: new Date(),
         });

         logger.info('Class Service Event', {
            service: 'class-service',
            category: 'CLASS',
            event: 'Class deleted successfully',
            tenant_code: tenantCode,
            class_id: classId,
            deleted_by: deletedBy,
         });

         return {
            success: true,
            message: 'Class deleted successfully',
         };
      } catch (error) {
         logger.error('Class Service Error', {
            service: 'class-service',
            category: 'CLASS',
            event: 'Class deletion failed',
            tenant_code: tenantCode,
            class_id: classId,
            error: error.message,
            deleted_by: deletedBy,
         });
         throw error;
      }
   }
}

module.exports = ClassService;
