const { Op } = require('sequelize');
const { logError } = require('../utils/logger');

/**
 * Sections Service
 * Handles all section-related database operations
 * Phase 2 Implementation - Database Integration
 */

class SectionsService {
   constructor(models) {
      this.Section = models.Section;
      this.Class = models.Class;
      this.User = models.User; // For section teachers
      this.Student = models.Student; // For current strength calculation
   }

   /**
    * Get all sections with class and teacher information
    * @param {Object} filters - Search and filter criteria
    * @param {Object} pagination - Pagination parameters
    * @param {string} tenantCode - Tenant code for multi-tenant support
    * @returns {Promise<Object>} Sections with metadata
    */
   async getAllSections(filters = {}, pagination = {}, tenantCode = null) {
      try {
         const { search, class_id, is_active, teacher_id } = filters;
         const { page = 1, limit = 20 } = pagination;
         const offset = (page - 1) * limit;

         // Build where conditions
         const whereConditions = {};
         const classWhereConditions = {};

         // Search across section name, class name, and room number
         if (search) {
            whereConditions[Op.or] = [
               { name: { [Op.like]: `%${search}%` } },
               { room_number: { [Op.like]: `%${search}%` } },
               { '$Class.name$': { [Op.like]: `%${search}%` } },
               { '$Class.code$': { [Op.like]: `%${search}%` } },
            ];
         }

         // Filter by class
         if (class_id) {
            whereConditions.class_id = class_id;
         }

         // Filter by active status
         if (is_active !== undefined && is_active !== '') {
            whereConditions.is_active = is_active === 'true';
         }

         // Filter by teacher
         if (teacher_id) {
            whereConditions.section_teacher_id = teacher_id;
         }

         // Multi-tenant filtering (if applicable)
         if (tenantCode) {
            // Assuming sections are filtered through their class's school
            classWhereConditions.tenant_code = tenantCode;
         }

         const { count, rows } = await this.Section.findAndCountAll({
            where: whereConditions,
            include: [
               {
                  model: this.Class,
                  as: 'class',
                  required: true,
                  where: classWhereConditions,
                  attributes: ['id', 'name', 'code', 'level', 'school_id'],
               },
               {
                  model: this.User,
                  as: 'sectionTeacher',
                  required: false,
                  attributes: ['id', 'first_name', 'last_name', 'email'],
               },
            ],
            order: [
               ['class_id', 'ASC'],
               ['name', 'ASC'],
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            distinct: true,
         });

         // Calculate current strength for each section (student count)
         const sectionsWithStrength = await Promise.all(
            rows.map(async (section) => {
               const currentStrength = await this.Student.count({
                  where: {
                     section_id: section.id,
                     is_active: true,
                  },
               });

               return {
                  ...section.get({ plain: true }),
                  current_strength: currentStrength,
                  section_teacher_name: section.sectionTeacher
                     ? `${section.sectionTeacher.first_name} ${section.sectionTeacher.last_name}`
                     : null,
               };
            })
         );

         return {
            sections: sectionsWithStrength,
            pagination: {
               currentPage: parseInt(page),
               totalPages: Math.ceil(count / limit),
               pageSize: parseInt(limit),
               totalRecords: count,
            },
         };
      } catch (error) {
         logError(error, { context: 'SectionsService.getAllSections', tenantCode });
         throw new Error('Failed to retrieve sections');
      }
   }

   /**
    * Get section by ID with full details
    * @param {number} sectionId - Section ID
    * @param {string} tenantCode - Tenant code
    * @returns {Promise<Object>} Section details
    */
   async getSectionById(sectionId, tenantCode = null) {
      try {
         const classWhereConditions = tenantCode ? { tenant_code: tenantCode } : {};

         const section = await this.Section.findOne({
            where: { id: sectionId },
            include: [
               {
                  model: this.Class,
                  as: 'class',
                  required: true,
                  where: classWhereConditions,
                  attributes: ['id', 'name', 'code', 'level', 'school_id'],
               },
               {
                  model: this.User,
                  as: 'sectionTeacher',
                  required: false,
                  attributes: ['id', 'first_name', 'last_name', 'email'],
               },
            ],
         });

         if (!section) {
            throw new Error('Section not found');
         }

         // Get current student strength
         const currentStrength = await this.Student.count({
            where: {
               section_id: sectionId,
               is_active: true,
            },
         });

         return {
            ...section.get({ plain: true }),
            current_strength: currentStrength,
            section_teacher_name: section.sectionTeacher
               ? `${section.sectionTeacher.first_name} ${section.sectionTeacher.last_name}`
               : null,
         };
      } catch (error) {
         logError(error, { context: 'SectionsService.getSectionById', sectionId, tenantCode });
         throw error;
      }
   }

   /**
    * Create new section
    * @param {Object} sectionData - Section data
    * @param {string} tenantCode - Tenant code
    * @returns {Promise<Object>} Created section
    */
   async createSection(sectionData, tenantCode = null) {
      try {
         // Verify the class exists and belongs to the tenant
         const classWhereConditions = { id: sectionData.class_id };
         if (tenantCode) {
            classWhereConditions.tenant_code = tenantCode;
         }

         const classExists = await this.Class.findOne({
            where: classWhereConditions,
         });

         if (!classExists) {
            throw new Error('Class not found or access denied');
         }

         // Check if section name already exists for this class
         const existingSection = await this.Section.findOne({
            where: {
               class_id: sectionData.class_id,
               name: sectionData.name,
            },
         });

         if (existingSection) {
            throw new Error(`Section "${sectionData.name}" already exists for this class`);
         }

         // Verify teacher exists if provided
         if (sectionData.section_teacher_id) {
            const teacher = await this.User.findOne({
               where: { id: sectionData.section_teacher_id },
            });

            if (!teacher) {
               throw new Error('Selected teacher not found');
            }
         }

         const newSection = await this.Section.create({
            ...sectionData,
            current_strength: 0,
            is_active: sectionData.is_active !== undefined ? sectionData.is_active : true,
         });

         return await this.getSectionById(newSection.id, tenantCode);
      } catch (error) {
         logError(error, { context: 'SectionsService.createSection', sectionData, tenantCode });
         throw error;
      }
   }

   /**
    * Update existing section
    * @param {number} sectionId - Section ID
    * @param {Object} updateData - Updated section data
    * @param {string} tenantCode - Tenant code
    * @returns {Promise<Object>} Updated section
    */
   async updateSection(sectionId, updateData, tenantCode = null) {
      try {
         // Verify section exists and belongs to tenant
         const existingSection = await this.getSectionById(sectionId, tenantCode);

         // If class_id is being updated, verify the new class
         if (updateData.class_id && updateData.class_id !== existingSection.class_id) {
            const classWhereConditions = { id: updateData.class_id };
            if (tenantCode) {
               classWhereConditions.tenant_code = tenantCode;
            }

            const classExists = await this.Class.findOne({
               where: classWhereConditions,
            });

            if (!classExists) {
               throw new Error('New class not found or access denied');
            }
         }

         // Check if new section name conflicts with existing sections
         if (updateData.name && updateData.name !== existingSection.name) {
            const conflictingSection = await this.Section.findOne({
               where: {
                  class_id: updateData.class_id || existingSection.class_id,
                  name: updateData.name,
                  id: { [Op.ne]: sectionId },
               },
            });

            if (conflictingSection) {
               throw new Error(`Section "${updateData.name}" already exists for this class`);
            }
         }

         // Verify teacher exists if being updated
         if (updateData.section_teacher_id) {
            const teacher = await this.User.findOne({
               where: { id: updateData.section_teacher_id },
            });

            if (!teacher) {
               throw new Error('Selected teacher not found');
            }
         }

         await this.Section.update(updateData, {
            where: { id: sectionId },
         });

         return await this.getSectionById(sectionId, tenantCode);
      } catch (error) {
         logError(error, { context: 'SectionsService.updateSection', sectionId, updateData, tenantCode });
         throw error;
      }
   }

   /**
    * Delete section (soft delete)
    * @param {number} sectionId - Section ID
    * @param {string} tenantCode - Tenant code
    * @returns {Promise<boolean>} Success status
    */
   async deleteSection(sectionId, tenantCode = null) {
      try {
         // Verify section exists and belongs to tenant
         const section = await this.getSectionById(sectionId, tenantCode);

         // Check if section has students
         const studentCount = await this.Student.count({
            where: {
               section_id: sectionId,
               is_active: true,
            },
         });

         if (studentCount > 0) {
            throw new Error(
               `Cannot delete section with ${studentCount} active students. Please transfer students first.`
            );
         }

         // Soft delete by marking as inactive
         await this.Section.update({ is_active: false }, { where: { id: sectionId } });

         return true;
      } catch (error) {
         logError(error, { context: 'SectionsService.deleteSection', sectionId, tenantCode });
         throw error;
      }
   }

   /**
    * Get sections statistics
    * @param {string} tenantCode - Tenant code
    * @returns {Promise<Object>} Statistics
    */
   async getSectionsStatistics(tenantCode = null) {
      try {
         const classWhereConditions = tenantCode ? { tenant_code: tenantCode } : {};

         const [totalSections, activeSections, totalCapacity, totalStudents] = await Promise.all([
            this.Section.count({
               include: [
                  {
                     model: this.Class,
                     as: 'class',
                     required: true,
                     where: classWhereConditions,
                  },
               ],
            }),
            this.Section.count({
               where: { is_active: true },
               include: [
                  {
                     model: this.Class,
                     as: 'class',
                     required: true,
                     where: classWhereConditions,
                  },
               ],
            }),
            this.Section.sum('capacity', {
               include: [
                  {
                     model: this.Class,
                     as: 'class',
                     required: true,
                     where: classWhereConditions,
                  },
               ],
            }),
            this.Student.count({
               where: { is_active: true },
               include: [
                  {
                     model: this.Section,
                     as: 'section',
                     required: true,
                     include: [
                        {
                           model: this.Class,
                           as: 'class',
                           required: true,
                           where: classWhereConditions,
                        },
                     ],
                  },
               ],
            }),
         ]);

         return {
            totalSections,
            activeSections,
            inactiveSections: totalSections - activeSections,
            totalCapacity: totalCapacity || 0,
            totalStudents: totalStudents || 0,
            averageCapacity: totalSections > 0 ? Math.round((totalCapacity || 0) / totalSections) : 0,
            capacityUtilization: totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0,
         };
      } catch (error) {
         logError(error, { context: 'SectionsService.getSectionsStatistics', tenantCode });
         throw new Error('Failed to retrieve sections statistics');
      }
   }

   /**
    * Get available teachers for section assignment
    * @param {string} tenantCode - Tenant code
    * @returns {Promise<Array>} Available teachers
    */
   async getAvailableTeachers(tenantCode = null) {
      try {
         const whereConditions = {
            role: 'TEACHER',
            is_active: true,
         };

         if (tenantCode) {
            whereConditions.tenant_code = tenantCode;
         }

         const teachers = await this.User.findAll({
            where: whereConditions,
            attributes: ['id', 'first_name', 'last_name', 'email'],
            order: [
               ['first_name', 'ASC'],
               ['last_name', 'ASC'],
            ],
         });

         return teachers.map((teacher) => ({
            id: teacher.id,
            name: `${teacher.first_name} ${teacher.last_name}`,
            email: teacher.email,
         }));
      } catch (error) {
         logError(error, { context: 'SectionsService.getAvailableTeachers', tenantCode });
         throw new Error('Failed to retrieve available teachers');
      }
   }
}

module.exports = SectionsService;
