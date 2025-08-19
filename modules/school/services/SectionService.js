const logger = require('../../../utils/logger');
const { ValidationError, NotFoundError, DuplicateError } = require('../../../utils/errors');

/**
 * Section Service
 * Handles section management operations within a class
 */
class SectionService {
   constructor() {
      this.defaultSectionNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
   }

   /**
    * Create a new section
    */
   async createSection(tenantCode, sectionData, createdBy) {
      try {
         const { getTenantModels } = require('../../../models');
         const tenantModels = await getTenantModels(tenantCode);
         const { Section, Class } = tenantModels;

         // Validate required fields
         if (!sectionData.name) {
            throw new ValidationError('Section name is required');
         }

         if (!sectionData.class_id) {
            throw new ValidationError('Class ID is required');
         }

         // Check if class exists
         const classInstance = await Class.findByPk(sectionData.class_id);
         if (!classInstance) {
            throw new NotFoundError('Class not found');
         }

         // Check if section already exists in the class
         const existingSection = await Section.findOne({
            where: {
               class_id: sectionData.class_id,
               name: sectionData.name,
            },
         });

         if (existingSection) {
            throw new DuplicateError('Section name already exists in this class');
         }

         // Create section
         const section = await Section.create({
            class_id: sectionData.class_id,
            name: sectionData.name,
            description: sectionData.description,
            section_teacher_id: sectionData.section_teacher_id,
            capacity: sectionData.capacity || 40,
            current_strength: sectionData.current_strength || 0,
            status: sectionData.status || 'ACTIVE',
            created_by: createdBy,
         });

         logger.info('Section Service Event', {
            service: 'section-service',
            category: 'SECTION',
            event: 'Section created successfully',
            tenant_code: tenantCode,
            section_id: section.id,
            class_id: sectionData.class_id,
            created_by: createdBy,
         });

         return {
            section: {
               id: section.id,
               class_id: section.class_id,
               name: section.name,
               description: section.description,
               section_teacher_id: section.section_teacher_id,
               capacity: section.capacity,
               current_strength: section.current_strength,
               status: section.status,
               created_at: section.createdAt,
            },
         };
      } catch (error) {
         logger.error('Section Service Error', {
            service: 'section-service',
            category: 'SECTION',
            event: 'Section creation failed',
            tenant_code: tenantCode,
            error: error.message,
            created_by: createdBy,
         });
         throw error;
      }
   }

   /**
    * Get sections by class ID
    */
   async getSectionsByClass(tenantCode, classId, options = {}) {
      try {
         const { getTenantModels } = require('../../../models');
         const tenantModels = await getTenantModels(tenantCode);
         const { Section } = tenantModels;

         const { status } = options;
         const whereConditions = { class_id: classId };

         if (status) {
            whereConditions.status = status;
         }

         const sections = await Section.findAll({
            where: whereConditions,
            order: [['name', 'ASC']],
         });

         logger.info('Section Service Event', {
            service: 'section-service',
            category: 'SECTION',
            event: 'Sections retrieved successfully',
            tenant_code: tenantCode,
            class_id: classId,
            count: sections.length,
         });

         return {
            sections: sections.map((section) => ({
               id: section.id,
               class_id: section.class_id,
               name: section.name,
               description: section.description,
               section_teacher_id: section.section_teacher_id,
               capacity: section.capacity,
               current_strength: section.current_strength,
               utilization_percentage: section.capacity
                  ? Math.round((section.current_strength / section.capacity) * 100)
                  : 0,
               status: section.status,
               created_at: section.createdAt,
               updated_at: section.updatedAt,
            })),
         };
      } catch (error) {
         logger.error('Section Service Error', {
            service: 'section-service',
            category: 'SECTION',
            event: 'Sections retrieval failed',
            tenant_code: tenantCode,
            class_id: classId,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Get section by ID
    */
   async getSectionById(tenantCode, sectionId) {
      try {
         const { getTenantModels } = require('../../../models');
         const tenantModels = await getTenantModels(tenantCode);
         const { Section, Class, School } = tenantModels;

         const section = await Section.findOne({
            where: { id: sectionId },
            include: [
               {
                  model: Class,
                  as: 'class',
                  attributes: ['id', 'name', 'standard'],
                  include: [
                     {
                        model: School,
                        as: 'school',
                        attributes: ['id', 'name', 'code'],
                     },
                  ],
               },
            ],
         });

         if (!section) {
            throw new NotFoundError('Section not found');
         }

         logger.info('Section Service Event', {
            service: 'section-service',
            category: 'SECTION',
            event: 'Section retrieved successfully',
            tenant_code: tenantCode,
            section_id: sectionId,
         });

         return {
            section: {
               id: section.id,
               class_id: section.class_id,
               class: section.class,
               name: section.name,
               description: section.description,
               section_teacher_id: section.section_teacher_id,
               capacity: section.capacity,
               current_strength: section.current_strength,
               utilization_percentage: section.capacity
                  ? Math.round((section.current_strength / section.capacity) * 100)
                  : 0,
               status: section.status,
               created_at: section.createdAt,
               updated_at: section.updatedAt,
            },
         };
      } catch (error) {
         logger.error('Section Service Error', {
            service: 'section-service',
            category: 'SECTION',
            event: 'Section retrieval failed',
            tenant_code: tenantCode,
            section_id: sectionId,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Update section
    */
   async updateSection(tenantCode, sectionId, sectionData, updatedBy) {
      try {
         const { getTenantModels } = require('../../../models');
         const tenantModels = await getTenantModels(tenantCode);
         const { Section } = tenantModels;

         const section = await Section.findOne({
            where: { id: sectionId },
         });

         if (!section) {
            throw new NotFoundError('Section not found');
         }

         // Check if name is being changed and if it conflicts
         if (sectionData.name && sectionData.name !== section.name) {
            const existingSection = await Section.findOne({
               where: {
                  class_id: section.class_id,
                  name: sectionData.name,
                  id: { [require('sequelize').Op.ne]: sectionId },
               },
            });

            if (existingSection) {
               throw new DuplicateError('Section name already exists in this class');
            }
         }

         // Validate current_strength doesn't exceed capacity
         if (sectionData.current_strength && sectionData.capacity) {
            if (sectionData.current_strength > sectionData.capacity) {
               throw new ValidationError('Current strength cannot exceed capacity');
            }
         } else if (sectionData.current_strength && section.capacity) {
            if (sectionData.current_strength > section.capacity) {
               throw new ValidationError('Current strength cannot exceed capacity');
            }
         }

         // Update section
         await section.update({
            ...sectionData,
            updated_by: updatedBy,
         });

         logger.info('Section Service Event', {
            service: 'section-service',
            category: 'SECTION',
            event: 'Section updated successfully',
            tenant_code: tenantCode,
            section_id: sectionId,
            updated_by: updatedBy,
         });

         return {
            section: {
               id: section.id,
               class_id: section.class_id,
               name: section.name,
               description: section.description,
               section_teacher_id: section.section_teacher_id,
               capacity: section.capacity,
               current_strength: section.current_strength,
               utilization_percentage: section.capacity
                  ? Math.round((section.current_strength / section.capacity) * 100)
                  : 0,
               status: section.status,
               updated_at: section.updatedAt,
            },
         };
      } catch (error) {
         logger.error('Section Service Error', {
            service: 'section-service',
            category: 'SECTION',
            event: 'Section update failed',
            tenant_code: tenantCode,
            section_id: sectionId,
            error: error.message,
            updated_by: updatedBy,
         });
         throw error;
      }
   }

   /**
    * Delete section (soft delete)
    */
   async deleteSection(tenantCode, sectionId, deletedBy) {
      try {
         const { getTenantModels } = require('../../../models');
         const tenantModels = await getTenantModels(tenantCode);
         const { Section } = tenantModels;

         const section = await Section.findOne({
            where: { id: sectionId },
         });

         if (!section) {
            throw new NotFoundError('Section not found');
         }

         // Check if section has students
         if (section.current_strength > 0) {
            throw new ValidationError(
               'Cannot delete section with students. Please transfer students to another section first.'
            );
         }

         // Soft delete
         await section.update({
            status: 'DELETED',
            deleted_by: deletedBy,
            deleted_at: new Date(),
         });

         logger.info('Section Service Event', {
            service: 'section-service',
            category: 'SECTION',
            event: 'Section deleted successfully',
            tenant_code: tenantCode,
            section_id: sectionId,
            deleted_by: deletedBy,
         });

         return {
            success: true,
            message: 'Section deleted successfully',
         };
      } catch (error) {
         logger.error('Section Service Error', {
            service: 'section-service',
            category: 'SECTION',
            event: 'Section deletion failed',
            tenant_code: tenantCode,
            section_id: sectionId,
            error: error.message,
            deleted_by: deletedBy,
         });
         throw error;
      }
   }

   /**
    * Bulk create sections for a class
    */
   async bulkCreateSections(tenantCode, classId, sectionNames, createdBy) {
      try {
         const { getTenantModels } = require('../../../models');
         const tenantModels = await getTenantModels(tenantCode);
         const { Section, Class } = tenantModels;

         // Check if class exists
         const classInstance = await Class.findByPk(classId);
         if (!classInstance) {
            throw new NotFoundError('Class not found');
         }

         // Validate section names
         if (!Array.isArray(sectionNames) || sectionNames.length === 0) {
            throw new ValidationError('Section names array is required');
         }

         // Check for existing sections
         const existingSections = await Section.findAll({
            where: {
               class_id: classId,
               name: sectionNames,
            },
         });

         if (existingSections.length > 0) {
            const existingNames = existingSections.map((s) => s.name);
            throw new DuplicateError(`Sections already exist: ${existingNames.join(', ')}`);
         }

         // Create sections
         const sectionsToCreate = sectionNames.map((name) => ({
            class_id: classId,
            name: name,
            capacity: 40, // Default capacity
            current_strength: 0,
            status: 'ACTIVE',
            created_by: createdBy,
         }));

         const createdSections = await Section.bulkCreate(sectionsToCreate);

         logger.info('Section Service Event', {
            service: 'section-service',
            category: 'SECTION',
            event: 'Sections bulk created successfully',
            tenant_code: tenantCode,
            class_id: classId,
            count: createdSections.length,
            created_by: createdBy,
         });

         return {
            sections: createdSections.map((section) => ({
               id: section.id,
               class_id: section.class_id,
               name: section.name,
               capacity: section.capacity,
               current_strength: section.current_strength,
               status: section.status,
               created_at: section.createdAt,
            })),
         };
      } catch (error) {
         logger.error('Section Service Error', {
            service: 'section-service',
            category: 'SECTION',
            event: 'Sections bulk creation failed',
            tenant_code: tenantCode,
            class_id: classId,
            error: error.message,
            created_by: createdBy,
         });
         throw error;
      }
   }
}

module.exports = SectionService;
