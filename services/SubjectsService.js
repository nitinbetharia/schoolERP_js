/**
 * Enhanced Subjects Management Service
 * Complete subject lifecycle management with academic integration
 * Supports multi-tenant operations, class assignments, and teacher relationships
 */

const { Op } = require('sequelize');
const { logError } = require('../utils/logger');
const csv = require('csv-parser');
const fs = require('fs').promises;
const path = require('path');

class SubjectsService {
   constructor(models) {
      this.models = models;
   }

   /**
    * Get all subjects with advanced filtering and pagination
    * @param {Object} filters - Search and filter options
    * @param {Object} pagination - Page, limit, sort options
    * @param {string} tenantCode - Tenant identifier
    * @returns {Object} Subjects data with pagination info
    */
   async getAllSubjects(filters = {}, pagination = {}, tenantCode = null) {
      try {
         const { search = '', category = '', class_id = '', is_active = '' } = filters;
         const { page = 1, limit = 20, sortBy = 'name', sortOrder = 'ASC' } = pagination;

         const offset = (page - 1) * limit;

         // Build where conditions
         const whereConditions = {};

         if (tenantCode) {
            whereConditions.tenant_code = tenantCode;
         }

         if (search) {
            whereConditions[Op.or] = [
               { name: { [Op.like]: `%${search}%` } },
               { code: { [Op.like]: `%${search}%` } },
               { description: { [Op.like]: `%${search}%` } },
            ];
         }

         if (category) {
            whereConditions.category = category;
         }

         if (is_active !== '') {
            whereConditions.is_active = is_active === 'true';
         }

         // Include conditions for class filtering
         const includeConditions = [];

         if (class_id) {
            includeConditions.push({
               model: this.models.Class,
               as: 'classes',
               where: { id: class_id },
               through: { attributes: [] },
               required: true,
            });
         } else {
            includeConditions.push({
               model: this.models.Class,
               as: 'classes',
               through: {
                  attributes: ['is_mandatory', 'hours_per_week', 'credits'],
                  as: 'assignment',
               },
               required: false,
            });
         }

         // Add teacher relationships
         includeConditions.push({
            model: this.models.Teacher,
            as: 'teachers',
            attributes: ['id', 'first_name', 'last_name', 'employee_code'],
            through: {
               attributes: ['is_primary', 'assigned_at'],
               as: 'assignment',
            },
            required: false,
         });

         const { rows: subjects, count: totalRecords } = await this.models.Subject.findAndCountAll({
            where: whereConditions,
            include: includeConditions,
            limit: parseInt(limit),
            offset: offset,
            order: [[sortBy, sortOrder.toUpperCase()]],
            distinct: true,
         });

         return {
            subjects,
            pagination: {
               currentPage: parseInt(page),
               totalPages: Math.ceil(totalRecords / limit),
               pageSize: parseInt(limit),
               totalRecords,
               hasNextPage: page < Math.ceil(totalRecords / limit),
               hasPreviousPage: page > 1,
            },
         };
      } catch (error) {
         logError(error, {
            context: 'SubjectsService.getAllSubjects',
            filters,
            pagination,
            tenantCode,
         });
         throw new Error('Failed to retrieve subjects');
      }
   }

   /**
    * Get subject by ID with complete relationships
    * @param {number} subjectId - Subject ID
    * @param {string} tenantCode - Tenant identifier
    * @returns {Object} Subject with relationships
    */
   async getSubjectById(subjectId, tenantCode = null) {
      try {
         const whereConditions = { id: subjectId };
         if (tenantCode) {
            whereConditions.tenant_code = tenantCode;
         }

         const subject = await this.models.Subject.findOne({
            where: whereConditions,
            include: [
               {
                  model: this.models.Class,
                  as: 'classes',
                  through: {
                     attributes: ['is_mandatory', 'hours_per_week', 'credits'],
                     as: 'assignment',
                  },
               },
               {
                  model: this.models.Teacher,
                  as: 'teachers',
                  attributes: ['id', 'first_name', 'last_name', 'employee_code', 'specialization'],
                  through: {
                     attributes: ['is_primary', 'assigned_at'],
                     as: 'assignment',
                  },
               },
               {
                  model: this.models.SubjectPrerequisite,
                  as: 'prerequisites',
                  include: [
                     {
                        model: this.models.Subject,
                        as: 'prerequisite_subject',
                        attributes: ['id', 'name', 'code'],
                     },
                  ],
               },
            ],
         });

         if (!subject) {
            return null;
         }

         return subject;
      } catch (error) {
         logError(error, {
            context: 'SubjectsService.getSubjectById',
            subjectId,
            tenantCode,
         });
         throw new Error('Failed to retrieve subject');
      }
   }

   /**
    * Create new subject with validation
    * @param {Object} subjectData - Subject creation data
    * @param {string} tenantCode - Tenant identifier
    * @returns {Object} Created subject
    */
   async createSubject(subjectData, tenantCode = null) {
      try {
         // Generate subject code if not provided
         if (!subjectData.code) {
            subjectData.code = await this.generateSubjectCode(subjectData.name, tenantCode);
         }

         // Validate unique code within tenant
         const existingSubject = await this.models.Subject.findOne({
            where: {
               code: subjectData.code,
               ...(tenantCode && { tenant_code: tenantCode }),
            },
         });

         if (existingSubject) {
            throw new Error(`Subject code '${subjectData.code}' already exists`);
         }

         const subject = await this.models.Subject.create({
            ...subjectData,
            tenant_code: tenantCode,
            is_active: subjectData.is_active !== false,
         });

         // Handle class assignments if provided
         if (subjectData.class_assignments && subjectData.class_assignments.length > 0) {
            await this.assignSubjectToClasses(subject.id, subjectData.class_assignments, tenantCode);
         }

         return await this.getSubjectById(subject.id, tenantCode);
      } catch (error) {
         logError(error, {
            context: 'SubjectsService.createSubject',
            subjectData,
            tenantCode,
         });

         if (error.message.includes('already exists')) {
            throw error;
         }
         throw new Error('Failed to create subject');
      }
   }

   /**
    * Update subject with validation
    * @param {number} subjectId - Subject ID
    * @param {Object} updateData - Update data
    * @param {string} tenantCode - Tenant identifier
    * @returns {Object} Updated subject
    */
   async updateSubject(subjectId, updateData, tenantCode = null) {
      try {
         const whereConditions = { id: subjectId };
         if (tenantCode) {
            whereConditions.tenant_code = tenantCode;
         }

         const subject = await this.models.Subject.findOne({ where: whereConditions });
         if (!subject) {
            throw new Error('Subject not found');
         }

         // Validate unique code if being updated
         if (updateData.code && updateData.code !== subject.code) {
            const existingSubject = await this.models.Subject.findOne({
               where: {
                  code: updateData.code,
                  id: { [Op.ne]: subjectId },
                  ...(tenantCode && { tenant_code: tenantCode }),
               },
            });

            if (existingSubject) {
               throw new Error(`Subject code '${updateData.code}' already exists`);
            }
         }

         await subject.update(updateData);

         // Handle class assignments update if provided
         if (updateData.class_assignments) {
            await this.updateSubjectClassAssignments(subjectId, updateData.class_assignments, tenantCode);
         }

         return await this.getSubjectById(subjectId, tenantCode);
      } catch (error) {
         logError(error, {
            context: 'SubjectsService.updateSubject',
            subjectId,
            updateData,
            tenantCode,
         });

         if (error.message.includes('not found') || error.message.includes('already exists')) {
            throw error;
         }
         throw new Error('Failed to update subject');
      }
   }

   /**
    * Delete subject with validation
    * @param {number} subjectId - Subject ID
    * @param {string} tenantCode - Tenant identifier
    * @returns {boolean} Success status
    */
   async deleteSubject(subjectId, tenantCode = null) {
      try {
         const whereConditions = { id: subjectId };
         if (tenantCode) {
            whereConditions.tenant_code = tenantCode;
         }

         const subject = await this.models.Subject.findOne({ where: whereConditions });
         if (!subject) {
            throw new Error('Subject not found');
         }

         // Check for dependencies (students, assessments, timetables, etc.)
         const dependencies = await this.checkSubjectDependencies(subjectId, tenantCode);
         if (dependencies.hasStudents || dependencies.hasAssessments || dependencies.hasTimetables) {
            throw new Error('Cannot delete subject with existing assignments or data');
         }

         // Remove all class assignments first
         await this.models.ClassSubject.destroy({
            where: { subject_id: subjectId },
         });

         // Remove teacher assignments
         await this.models.TeacherSubject.destroy({
            where: { subject_id: subjectId },
         });

         // Remove prerequisites
         await this.models.SubjectPrerequisite.destroy({
            where: {
               [Op.or]: [{ subject_id: subjectId }, { prerequisite_subject_id: subjectId }],
            },
         });

         // Delete the subject
         await subject.destroy();

         return true;
      } catch (error) {
         logError(error, {
            context: 'SubjectsService.deleteSubject',
            subjectId,
            tenantCode,
         });

         if (error.message.includes('not found') || error.message.includes('Cannot delete')) {
            throw error;
         }
         throw new Error('Failed to delete subject');
      }
   }

   /**
    * Assign subject to multiple classes
    * @param {number} subjectId - Subject ID
    * @param {Array} classAssignments - Class assignment data
    * @param {string} tenantCode - Tenant identifier
    * @returns {boolean} Success status
    */
   async assignSubjectToClasses(subjectId, classAssignments, tenantCode = null) {
      try {
         const assignments = classAssignments.map((assignment) => ({
            subject_id: subjectId,
            class_id: assignment.class_id,
            is_mandatory: assignment.is_mandatory || false,
            hours_per_week: assignment.hours_per_week || 0,
            credits: assignment.credits || 0,
            created_at: new Date(),
            updated_at: new Date(),
         }));

         await this.models.ClassSubject.bulkCreate(assignments, {
            updateOnDuplicate: ['is_mandatory', 'hours_per_week', 'credits', 'updated_at'],
         });

         return true;
      } catch (error) {
         logError(error, {
            context: 'SubjectsService.assignSubjectToClasses',
            subjectId,
            classAssignments,
            tenantCode,
         });
         throw new Error('Failed to assign subject to classes');
      }
   }

   /**
    * Update subject-class assignments
    * @param {number} subjectId - Subject ID
    * @param {Array} classAssignments - Updated assignments
    * @param {string} tenantCode - Tenant identifier
    * @returns {boolean} Success status
    */
   async updateSubjectClassAssignments(subjectId, classAssignments, tenantCode = null) {
      try {
         // Remove existing assignments
         await this.models.ClassSubject.destroy({
            where: { subject_id: subjectId },
         });

         // Create new assignments
         if (classAssignments.length > 0) {
            await this.assignSubjectToClasses(subjectId, classAssignments, tenantCode);
         }

         return true;
      } catch (error) {
         logError(error, {
            context: 'SubjectsService.updateSubjectClassAssignments',
            subjectId,
            classAssignments,
            tenantCode,
         });
         throw new Error('Failed to update subject class assignments');
      }
   }

   /**
    * Get subjects by class ID
    * @param {number} classId - Class ID
    * @param {string} tenantCode - Tenant identifier
    * @returns {Array} Subjects assigned to class
    */
   async getSubjectsByClass(classId, tenantCode = null) {
      try {
         const whereConditions = { is_active: true };
         if (tenantCode) {
            whereConditions.tenant_code = tenantCode;
         }

         const subjects = await this.models.Subject.findAll({
            where: whereConditions,
            include: [
               {
                  model: this.models.Class,
                  as: 'classes',
                  where: { id: classId },
                  through: {
                     attributes: ['is_mandatory', 'hours_per_week', 'credits'],
                     as: 'assignment',
                  },
               },
            ],
            order: [['name', 'ASC']],
         });

         return subjects;
      } catch (error) {
         logError(error, {
            context: 'SubjectsService.getSubjectsByClass',
            classId,
            tenantCode,
         });
         throw new Error('Failed to retrieve subjects for class');
      }
   }

   /**
    * Get subject statistics
    * @param {string} tenantCode - Tenant identifier
    * @returns {Object} Subject statistics
    */
   async getSubjectsStatistics(tenantCode = null) {
      try {
         const whereConditions = {};
         if (tenantCode) {
            whereConditions.tenant_code = tenantCode;
         }

         const [totalSubjects, activeSubjects, categoryCounts, classAssignments] = await Promise.all([
            this.models.Subject.count({ where: whereConditions }),
            this.models.Subject.count({
               where: { ...whereConditions, is_active: true },
            }),
            this.models.Subject.findAll({
               where: whereConditions,
               attributes: ['category', [this.models.sequelize.fn('COUNT', '*'), 'count']],
               group: ['category'],
            }),
            this.models.ClassSubject.findAll({
               include: [
                  {
                     model: this.models.Subject,
                     as: 'subject',
                     where: whereConditions,
                     attributes: [],
                  },
               ],
               attributes: [
                  [this.models.sequelize.fn('COUNT', '*'), 'total_assignments'],
                  [
                     this.models.sequelize.fn(
                        'COUNT',
                        this.models.sequelize.where(this.models.sequelize.col('is_mandatory'), true)
                     ),
                     'mandatory_assignments',
                  ],
               ],
            }),
         ]);

         return {
            totalSubjects,
            activeSubjects,
            inactiveSubjects: totalSubjects - activeSubjects,
            categoryDistribution: categoryCounts.reduce((acc, item) => {
               acc[item.category] = parseInt(item.get('count'));
               return acc;
            }, {}),
            assignmentStats: classAssignments[0]
               ? {
                    totalAssignments: parseInt(classAssignments[0].get('total_assignments')) || 0,
                    mandatoryAssignments: parseInt(classAssignments[0].get('mandatory_assignments')) || 0,
                 }
               : { totalAssignments: 0, mandatoryAssignments: 0 },
         };
      } catch (error) {
         logError(error, {
            context: 'SubjectsService.getSubjectsStatistics',
            tenantCode,
         });
         throw new Error('Failed to retrieve subject statistics');
      }
   }

   /**
    * Generate unique subject code
    * @param {string} name - Subject name
    * @param {string} tenantCode - Tenant identifier
    * @returns {string} Generated code
    */
   async generateSubjectCode(name, tenantCode = null) {
      try {
         const baseCode = name
            .replace(/[^a-zA-Z\s]/g, '')
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase())
            .join('')
            .substring(0, 6);

         let code = baseCode;
         let counter = 1;

         while (true) {
            const existing = await this.models.Subject.findOne({
               where: {
                  code: code,
                  ...(tenantCode && { tenant_code: tenantCode }),
               },
            });

            if (!existing) {
               break;
            }

            code = `${baseCode}${counter}`;
            counter++;

            if (counter > 999) {
               code = `SUB${Date.now().toString().substring(-6)}`;
               break;
            }
         }

         return code;
      } catch (error) {
         logError(error, {
            context: 'SubjectsService.generateSubjectCode',
            name,
            tenantCode,
         });
         throw new Error('Failed to generate subject code');
      }
   }

   /**
    * Check subject dependencies before deletion
    * @param {number} subjectId - Subject ID
    * @param {string} tenantCode - Tenant identifier
    * @returns {Object} Dependencies status
    */
   async checkSubjectDependencies(subjectId, tenantCode = null) {
      try {
         // This will be enhanced when student subjects, assessments, and timetables are implemented
         const dependencies = {
            hasStudents: false,
            hasAssessments: false,
            hasTimetables: false,
            hasTeacherAssignments: false,
         };

         // Check teacher assignments
         const teacherCount = await this.models.TeacherSubject.count({
            where: { subject_id: subjectId },
         });
         dependencies.hasTeacherAssignments = teacherCount > 0;

         return dependencies;
      } catch (error) {
         logError(error, {
            context: 'SubjectsService.checkSubjectDependencies',
            subjectId,
            tenantCode,
         });
         return {
            hasStudents: false,
            hasAssessments: false,
            hasTimetables: false,
            hasTeacherAssignments: false,
         };
      }
   }

   /**
    * Bulk import subjects from CSV
    * @param {string} csvFilePath - Path to CSV file
    * @param {string} tenantCode - Tenant identifier
    * @param {number} userId - User ID for audit
    * @returns {Object} Import results
    */
   async bulkImportFromCSV(csvFilePath, tenantCode = null, userId = null) {
      try {
         const results = {
            total: 0,
            imported: 0,
            errors: 0,
            errorDetails: [],
         };

         const fileContent = await fs.readFile(csvFilePath, 'utf8');
         const subjects = [];

         return new Promise((resolve) => {
            const stream = require('stream').Readable.from([fileContent]);

            stream
               .pipe(csv())
               .on('data', (row) => {
                  results.total++;
                  subjects.push(row);
               })
               .on('end', async () => {
                  for (const subjectData of subjects) {
                     try {
                        // Validate required fields
                        if (!subjectData.name || !subjectData.category) {
                           results.errors++;
                           results.errorDetails.push({
                              row: results.imported + results.errors,
                              error: 'Missing required fields: name, category',
                           });
                           continue;
                        }

                        // Create subject
                        const subject = await this.createSubject(
                           {
                              name: subjectData.name.trim(),
                              code: subjectData.code?.trim() || null,
                              description: subjectData.description?.trim() || null,
                              category: subjectData.category.trim().toUpperCase(),
                              credits: parseInt(subjectData.credits) || 0,
                              is_active: subjectData.is_active !== 'false',
                           },
                           tenantCode
                        );

                        results.imported++;
                     } catch (error) {
                        results.errors++;
                        results.errorDetails.push({
                           row: results.imported + results.errors,
                           error: error.message,
                        });
                     }
                  }

                  // Clean up uploaded file
                  try {
                     await fs.unlink(csvFilePath);
                  } catch (cleanupError) {
                     logError(cleanupError, { context: 'CSV cleanup' });
                  }

                  resolve({
                     success: true,
                     ...results,
                  });
               });
         });
      } catch (error) {
         logError(error, {
            context: 'SubjectsService.bulkImportFromCSV',
            csvFilePath,
            tenantCode,
            userId,
         });

         // Clean up file on error
         try {
            await fs.unlink(csvFilePath);
         } catch (cleanupError) {
            logError(cleanupError, { context: 'CSV cleanup on error' });
         }

         throw new Error('Failed to process CSV import');
      }
   }

   /**
    * Export subjects to CSV
    * @param {Object} filters - Export filters
    * @param {string} tenantCode - Tenant identifier
    * @returns {string} CSV data
    */
   async exportToCSV(filters = {}, tenantCode = null) {
      try {
         const { subjects } = await this.getAllSubjects(filters, { page: 1, limit: 10000 }, tenantCode);

         const csvHeaders = [
            'ID',
            'Name',
            'Code',
            'Description',
            'Category',
            'Credits',
            'Is Active',
            'Classes Assigned',
            'Teachers Assigned',
            'Created Date',
         ];

         const csvRows = subjects.map((subject) => [
            subject.id,
            `"${subject.name}"`,
            subject.code,
            `"${subject.description || ''}"`,
            subject.category,
            subject.credits || 0,
            subject.is_active ? 'Yes' : 'No',
            subject.classes ? subject.classes.length : 0,
            subject.teachers ? subject.teachers.length : 0,
            subject.created_at.toISOString().split('T')[0],
         ]);

         const csvContent = [csvHeaders.join(','), ...csvRows.map((row) => row.join(','))].join('\n');

         return csvContent;
      } catch (error) {
         logError(error, {
            context: 'SubjectsService.exportToCSV',
            filters,
            tenantCode,
         });
         throw new Error('Failed to export subjects to CSV');
      }
   }
}

module.exports = SubjectsService;
