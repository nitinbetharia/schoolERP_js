/**
 * Enhanced Teachers Management Service
 * Complete teacher lifecycle management with subject assignments and class relationships
 * Supports multi-tenant operations, qualification tracking, and performance analytics
 */

const { Op } = require('sequelize');
const { logError } = require('../utils/logger');
const csv = require('csv-parser');
const fs = require('fs').promises;
const bcrypt = require('bcrypt');

class TeachersService {
   constructor(models) {
      this.models = models;
   }

   /**
    * Get all teachers with advanced filtering and pagination
    * @param {Object} filters - Search and filter options
    * @param {Object} pagination - Page, limit, sort options
    * @param {string} tenantCode - Tenant identifier
    * @returns {Object} Teachers data with pagination info
    */
   async getAllTeachers(filters = {}, pagination = {}, tenantCode = null) {
      try {
         const {
            search = '',
            department = '',
            subject_id = '',
            employment_status = '',
            qualification_level = '',
         } = filters;

         const { page = 1, limit = 20, sortBy = 'first_name', sortOrder = 'ASC' } = pagination;

         const offset = (page - 1) * limit;

         // Build where conditions
         const whereConditions = {};

         if (tenantCode) {
            whereConditions.tenant_code = tenantCode;
         }

         if (search) {
            whereConditions[Op.or] = [
               { first_name: { [Op.like]: `%${search}%` } },
               { last_name: { [Op.like]: `%${search}%` } },
               { employee_code: { [Op.like]: `%${search}%` } },
               { email: { [Op.like]: `%${search}%` } },
               { phone: { [Op.like]: `%${search}%` } },
            ];
         }

         if (department) {
            whereConditions.department = department;
         }

         if (employment_status) {
            whereConditions.employment_status = employment_status;
         }

         // Include conditions
         const includeConditions = [];

         // Add subject filtering
         if (subject_id) {
            includeConditions.push({
               model: this.models.Subject,
               as: 'subjects',
               where: { id: subject_id },
               through: {
                  attributes: ['is_primary', 'assigned_at', 'qualification_level'],
                  as: 'assignment',
               },
               required: true,
            });
         } else {
            includeConditions.push({
               model: this.models.Subject,
               as: 'subjects',
               attributes: ['id', 'name', 'code', 'category'],
               through: {
                  attributes: ['is_primary', 'assigned_at', 'qualification_level'],
                  as: 'assignment',
               },
               required: false,
            });
         }

         // Add class assignments
         includeConditions.push({
            model: this.models.Class,
            as: 'classes',
            attributes: ['id', 'name', 'code'],
            through: {
               attributes: ['role', 'assigned_at'],
               as: 'assignment',
            },
            required: false,
         });

         // Add qualifications with filtering
         const qualificationInclude = {
            model: this.models.TeacherQualification,
            as: 'qualifications',
            attributes: ['id', 'degree', 'field', 'institution', 'year_completed', 'grade'],
            required: false,
         };

         if (qualification_level) {
            qualificationInclude.where = { level: qualification_level };
            qualificationInclude.required = true;
         }

         includeConditions.push(qualificationInclude);

         const { rows: teachers, count: totalRecords } = await this.models.Teacher.findAndCountAll({
            where: whereConditions,
            include: includeConditions,
            limit: parseInt(limit),
            offset: offset,
            order: [[sortBy, sortOrder.toUpperCase()]],
            distinct: true,
         });

         return {
            teachers,
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
            context: 'TeachersService.getAllTeachers',
            filters,
            pagination,
            tenantCode,
         });
         throw new Error('Failed to retrieve teachers');
      }
   }

   /**
    * Get teacher by ID with complete relationships
    * @param {number} teacherId - Teacher ID
    * @param {string} tenantCode - Tenant identifier
    * @returns {Object} Teacher with relationships
    */
   async getTeacherById(teacherId, tenantCode = null) {
      try {
         const whereConditions = { id: teacherId };
         if (tenantCode) {
            whereConditions.tenant_code = tenantCode;
         }

         const teacher = await this.models.Teacher.findOne({
            where: whereConditions,
            include: [
               {
                  model: this.models.Subject,
                  as: 'subjects',
                  attributes: ['id', 'name', 'code', 'category'],
                  through: {
                     attributes: ['is_primary', 'assigned_at', 'qualification_level'],
                     as: 'assignment',
                  },
               },
               {
                  model: this.models.Class,
                  as: 'classes',
                  attributes: ['id', 'name', 'code', 'level'],
                  through: {
                     attributes: ['role', 'assigned_at'],
                     as: 'assignment',
                  },
                  include: [
                     {
                        model: this.models.Section,
                        as: 'sections',
                        attributes: ['id', 'name', 'code'],
                     },
                  ],
               },
               {
                  model: this.models.TeacherQualification,
                  as: 'qualifications',
                  order: [['year_completed', 'DESC']],
               },
               {
                  model: this.models.TeacherExperience,
                  as: 'experiences',
                  order: [['start_date', 'DESC']],
               },
            ],
         });

         if (!teacher) {
            return null;
         }

         return teacher;
      } catch (error) {
         logError(error, {
            context: 'TeachersService.getTeacherById',
            teacherId,
            tenantCode,
         });
         throw new Error('Failed to retrieve teacher');
      }
   }

   /**
    * Create new teacher with validation
    * @param {Object} teacherData - Teacher creation data
    * @param {string} tenantCode - Tenant identifier
    * @returns {Object} Created teacher
    */
   async createTeacher(teacherData, tenantCode = null) {
      try {
         // Generate employee code if not provided
         if (!teacherData.employee_code) {
            teacherData.employee_code = await this.generateEmployeeCode(
               teacherData.first_name,
               teacherData.last_name,
               tenantCode
            );
         }

         // Validate unique employee code and email within tenant
         const existingTeacher = await this.models.Teacher.findOne({
            where: {
               [Op.or]: [{ employee_code: teacherData.employee_code }, { email: teacherData.email }],
               ...(tenantCode && { tenant_code: tenantCode }),
            },
         });

         if (existingTeacher) {
            const field =
               existingTeacher.employee_code === teacherData.employee_code ? 'Employee code' : 'Email address';
            throw new Error(`${field} already exists`);
         }

         // Hash password if provided
         if (teacherData.password) {
            teacherData.password = await bcrypt.hash(teacherData.password, 10);
         }

         const teacher = await this.models.Teacher.create({
            ...teacherData,
            tenant_code: tenantCode,
            is_active: teacherData.is_active !== false,
            hire_date: teacherData.hire_date || new Date(),
            employment_status: teacherData.employment_status || 'ACTIVE',
         });

         // Handle qualifications if provided
         if (teacherData.qualifications && teacherData.qualifications.length > 0) {
            await this.addTeacherQualifications(teacher.id, teacherData.qualifications);
         }

         // Handle subject assignments if provided
         if (teacherData.subject_assignments && teacherData.subject_assignments.length > 0) {
            await this.assignTeacherToSubjects(teacher.id, teacherData.subject_assignments);
         }

         return await this.getTeacherById(teacher.id, tenantCode);
      } catch (error) {
         logError(error, {
            context: 'TeachersService.createTeacher',
            teacherData: { ...teacherData, password: '[REDACTED]' },
            tenantCode,
         });

         if (error.message.includes('already exists')) {
            throw error;
         }
         throw new Error('Failed to create teacher');
      }
   }

   /**
    * Update teacher with validation
    * @param {number} teacherId - Teacher ID
    * @param {Object} updateData - Update data
    * @param {string} tenantCode - Tenant identifier
    * @returns {Object} Updated teacher
    */
   async updateTeacher(teacherId, updateData, tenantCode = null) {
      try {
         const whereConditions = { id: teacherId };
         if (tenantCode) {
            whereConditions.tenant_code = tenantCode;
         }

         const teacher = await this.models.Teacher.findOne({ where: whereConditions });
         if (!teacher) {
            throw new Error('Teacher not found');
         }

         // Validate unique employee code and email if being updated
         if (updateData.employee_code || updateData.email) {
            const checkConditions = [];

            if (updateData.employee_code && updateData.employee_code !== teacher.employee_code) {
               checkConditions.push({ employee_code: updateData.employee_code });
            }

            if (updateData.email && updateData.email !== teacher.email) {
               checkConditions.push({ email: updateData.email });
            }

            if (checkConditions.length > 0) {
               const existingTeacher = await this.models.Teacher.findOne({
                  where: {
                     [Op.or]: checkConditions,
                     id: { [Op.ne]: teacherId },
                     ...(tenantCode && { tenant_code: tenantCode }),
                  },
               });

               if (existingTeacher) {
                  const field =
                     existingTeacher.employee_code === updateData.employee_code ? 'Employee code' : 'Email address';
                  throw new Error(`${field} already exists`);
               }
            }
         }

         // Hash password if being updated
         if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
         }

         await teacher.update(updateData);

         // Handle qualifications update if provided
         if (updateData.qualifications) {
            await this.updateTeacherQualifications(teacherId, updateData.qualifications);
         }

         // Handle subject assignments update if provided
         if (updateData.subject_assignments) {
            await this.updateTeacherSubjectAssignments(teacherId, updateData.subject_assignments);
         }

         return await this.getTeacherById(teacherId, tenantCode);
      } catch (error) {
         logError(error, {
            context: 'TeachersService.updateTeacher',
            teacherId,
            updateData: { ...updateData, password: updateData.password ? '[REDACTED]' : undefined },
            tenantCode,
         });

         if (error.message.includes('not found') || error.message.includes('already exists')) {
            throw error;
         }
         throw new Error('Failed to update teacher');
      }
   }

   /**
    * Delete teacher with validation
    * @param {number} teacherId - Teacher ID
    * @param {string} tenantCode - Tenant identifier
    * @returns {boolean} Success status
    */
   async deleteTeacher(teacherId, tenantCode = null) {
      try {
         const whereConditions = { id: teacherId };
         if (tenantCode) {
            whereConditions.tenant_code = tenantCode;
         }

         const teacher = await this.models.Teacher.findOne({ where: whereConditions });
         if (!teacher) {
            throw new Error('Teacher not found');
         }

         // Check for dependencies (active classes, ongoing assessments, etc.)
         const dependencies = await this.checkTeacherDependencies(teacherId, tenantCode);
         if (dependencies.hasActiveClasses || dependencies.hasOngoingAssessments) {
            throw new Error('Cannot delete teacher with active assignments');
         }

         // Remove all assignments first
         await Promise.all([
            this.models.TeacherSubject.destroy({ where: { teacher_id: teacherId } }),
            this.models.TeacherClass.destroy({ where: { teacher_id: teacherId } }),
            this.models.TeacherSection.destroy({ where: { teacher_id: teacherId } }),
            this.models.TeacherQualification.destroy({ where: { teacher_id: teacherId } }),
            this.models.TeacherExperience.destroy({ where: { teacher_id: teacherId } }),
         ]);

         // Delete the teacher
         await teacher.destroy();

         return true;
      } catch (error) {
         logError(error, {
            context: 'TeachersService.deleteTeacher',
            teacherId,
            tenantCode,
         });

         if (error.message.includes('not found') || error.message.includes('Cannot delete')) {
            throw error;
         }
         throw new Error('Failed to delete teacher');
      }
   }

   /**
    * Assign teacher to subjects
    * @param {number} teacherId - Teacher ID
    * @param {Array} subjectAssignments - Subject assignment data
    * @returns {boolean} Success status
    */
   async assignTeacherToSubjects(teacherId, subjectAssignments) {
      try {
         const assignments = subjectAssignments.map((assignment) => ({
            teacher_id: teacherId,
            subject_id: assignment.subject_id,
            is_primary: assignment.is_primary || false,
            qualification_level: assignment.qualification_level || 'QUALIFIED',
            assigned_at: new Date(),
         }));

         await this.models.TeacherSubject.bulkCreate(assignments, {
            updateOnDuplicate: ['is_primary', 'qualification_level', 'assigned_at'],
         });

         return true;
      } catch (error) {
         logError(error, {
            context: 'TeachersService.assignTeacherToSubjects',
            teacherId,
            subjectAssignments,
         });
         throw new Error('Failed to assign teacher to subjects');
      }
   }

   /**
    * Update teacher subject assignments
    * @param {number} teacherId - Teacher ID
    * @param {Array} subjectAssignments - Updated assignments
    * @returns {boolean} Success status
    */
   async updateTeacherSubjectAssignments(teacherId, subjectAssignments) {
      try {
         // Remove existing assignments
         await this.models.TeacherSubject.destroy({
            where: { teacher_id: teacherId },
         });

         // Create new assignments
         if (subjectAssignments.length > 0) {
            await this.assignTeacherToSubjects(teacherId, subjectAssignments);
         }

         return true;
      } catch (error) {
         logError(error, {
            context: 'TeachersService.updateTeacherSubjectAssignments',
            teacherId,
            subjectAssignments,
         });
         throw new Error('Failed to update teacher subject assignments');
      }
   }

   /**
    * Add teacher qualifications
    * @param {number} teacherId - Teacher ID
    * @param {Array} qualifications - Qualification data
    * @returns {boolean} Success status
    */
   async addTeacherQualifications(teacherId, qualifications) {
      try {
         const qualificationRecords = qualifications.map((qual) => ({
            teacher_id: teacherId,
            degree: qual.degree,
            field: qual.field,
            institution: qual.institution,
            year_completed: qual.year_completed,
            grade: qual.grade,
            level: qual.level || 'UNDERGRADUATE',
         }));

         await this.models.TeacherQualification.bulkCreate(qualificationRecords);
         return true;
      } catch (error) {
         logError(error, {
            context: 'TeachersService.addTeacherQualifications',
            teacherId,
            qualifications,
         });
         throw new Error('Failed to add teacher qualifications');
      }
   }

   /**
    * Update teacher qualifications
    * @param {number} teacherId - Teacher ID
    * @param {Array} qualifications - Updated qualifications
    * @returns {boolean} Success status
    */
   async updateTeacherQualifications(teacherId, qualifications) {
      try {
         // Remove existing qualifications
         await this.models.TeacherQualification.destroy({
            where: { teacher_id: teacherId },
         });

         // Add new qualifications
         if (qualifications.length > 0) {
            await this.addTeacherQualifications(teacherId, qualifications);
         }

         return true;
      } catch (error) {
         logError(error, {
            context: 'TeachersService.updateTeacherQualifications',
            teacherId,
            qualifications,
         });
         throw new Error('Failed to update teacher qualifications');
      }
   }

   /**
    * Get teachers by subject ID
    * @param {number} subjectId - Subject ID
    * @param {string} tenantCode - Tenant identifier
    * @returns {Array} Teachers assigned to subject
    */
   async getTeachersBySubject(subjectId, tenantCode = null) {
      try {
         const whereConditions = { is_active: true };
         if (tenantCode) {
            whereConditions.tenant_code = tenantCode;
         }

         const teachers = await this.models.Teacher.findAll({
            where: whereConditions,
            include: [
               {
                  model: this.models.Subject,
                  as: 'subjects',
                  where: { id: subjectId },
                  through: {
                     attributes: ['is_primary', 'qualification_level', 'assigned_at'],
                     as: 'assignment',
                  },
               },
            ],
            order: [
               ['first_name', 'ASC'],
               ['last_name', 'ASC'],
            ],
         });

         return teachers;
      } catch (error) {
         logError(error, {
            context: 'TeachersService.getTeachersBySubject',
            subjectId,
            tenantCode,
         });
         throw new Error('Failed to retrieve teachers for subject');
      }
   }

   /**
    * Get teacher statistics
    * @param {string} tenantCode - Tenant identifier
    * @returns {Object} Teacher statistics
    */
   async getTeachersStatistics(tenantCode = null) {
      try {
         const whereConditions = {};
         if (tenantCode) {
            whereConditions.tenant_code = tenantCode;
         }

         const [totalTeachers, activeTeachers, departmentCounts, qualificationCounts, subjectAssignments] =
            await Promise.all([
               this.models.Teacher.count({ where: whereConditions }),
               this.models.Teacher.count({
                  where: { ...whereConditions, employment_status: 'ACTIVE' },
               }),
               this.models.Teacher.findAll({
                  where: whereConditions,
                  attributes: ['department', [this.models.sequelize.fn('COUNT', '*'), 'count']],
                  group: ['department'],
               }),
               this.models.TeacherQualification.findAll({
                  include: [
                     {
                        model: this.models.Teacher,
                        as: 'teacher',
                        where: whereConditions,
                        attributes: [],
                     },
                  ],
                  attributes: [
                     'level',
                     [this.models.sequelize.fn('COUNT', 'DISTINCT', this.models.sequelize.col('teacher_id')), 'count'],
                  ],
                  group: ['level'],
               }),
               this.models.TeacherSubject.findAll({
                  include: [
                     {
                        model: this.models.Teacher,
                        as: 'teacher',
                        where: whereConditions,
                        attributes: [],
                     },
                  ],
                  attributes: [
                     [this.models.sequelize.fn('COUNT', '*'), 'total_assignments'],
                     [
                        this.models.sequelize.fn(
                           'COUNT',
                           this.models.sequelize.where(this.models.sequelize.col('is_primary'), true)
                        ),
                        'primary_assignments',
                     ],
                  ],
               }),
            ]);

         return {
            totalTeachers,
            activeTeachers,
            inactiveTeachers: totalTeachers - activeTeachers,
            departmentDistribution: departmentCounts.reduce((acc, item) => {
               const dept = item.department || 'UNASSIGNED';
               acc[dept] = parseInt(item.get('count'));
               return acc;
            }, {}),
            qualificationDistribution: qualificationCounts.reduce((acc, item) => {
               acc[item.level] = parseInt(item.get('count'));
               return acc;
            }, {}),
            assignmentStats: subjectAssignments[0]
               ? {
                    totalAssignments: parseInt(subjectAssignments[0].get('total_assignments')) || 0,
                    primaryAssignments: parseInt(subjectAssignments[0].get('primary_assignments')) || 0,
                 }
               : { totalAssignments: 0, primaryAssignments: 0 },
         };
      } catch (error) {
         logError(error, {
            context: 'TeachersService.getTeachersStatistics',
            tenantCode,
         });
         throw new Error('Failed to retrieve teacher statistics');
      }
   }

   /**
    * Generate unique employee code
    * @param {string} firstName - First name
    * @param {string} lastName - Last name
    * @param {string} tenantCode - Tenant identifier
    * @returns {string} Generated code
    */
   async generateEmployeeCode(firstName, lastName, tenantCode = null) {
      try {
         const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
         const year = new Date().getFullYear().toString().substring(2);
         const baseCode = `T${initials}${year}`;

         let code = baseCode;
         let counter = 1;

         while (true) {
            const existing = await this.models.Teacher.findOne({
               where: {
                  employee_code: code,
                  ...(tenantCode && { tenant_code: tenantCode }),
               },
            });

            if (!existing) {
               break;
            }

            code = `${baseCode}${counter.toString().padStart(2, '0')}`;
            counter++;

            if (counter > 99) {
               code = `T${Date.now().toString().substring(-6)}`;
               break;
            }
         }

         return code;
      } catch (error) {
         logError(error, {
            context: 'TeachersService.generateEmployeeCode',
            firstName,
            lastName,
            tenantCode,
         });
         throw new Error('Failed to generate employee code');
      }
   }

   /**
    * Check teacher dependencies before deletion
    * @param {number} teacherId - Teacher ID
    * @param {string} tenantCode - Tenant identifier
    * @returns {Object} Dependencies status
    */
   async checkTeacherDependencies(teacherId, tenantCode = null) {
      try {
         const dependencies = {
            hasActiveClasses: false,
            hasOngoingAssessments: false,
            hasStudentRecords: false,
         };

         // Check active class assignments
         const classCount = await this.models.TeacherClass.count({
            where: { teacher_id: teacherId },
         });
         dependencies.hasActiveClasses = classCount > 0;

         // Additional dependency checks will be added when assessment
         // and attendance modules are implemented

         return dependencies;
      } catch (error) {
         logError(error, {
            context: 'TeachersService.checkTeacherDependencies',
            teacherId,
            tenantCode,
         });
         return {
            hasActiveClasses: false,
            hasOngoingAssessments: false,
            hasStudentRecords: false,
         };
      }
   }

   /**
    * Bulk import teachers from CSV
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
         const teachers = [];

         return new Promise((resolve) => {
            const stream = require('stream').Readable.from([fileContent]);

            stream
               .pipe(csv())
               .on('data', (row) => {
                  results.total++;
                  teachers.push(row);
               })
               .on('end', async () => {
                  for (const teacherData of teachers) {
                     try {
                        const requiredFields = ['first_name', 'last_name', 'email'];
                        const hasRequired = requiredFields.every((field) => teacherData[field]);

                        if (!hasRequired) {
                           results.errors++;
                           results.errorDetails.push({
                              row: results.imported + results.errors,
                              error: 'Missing required fields: first_name, last_name, email',
                           });
                           continue;
                        }

                        // Create teacher
                        await this.createTeacher(
                           {
                              first_name: teacherData.first_name.trim(),
                              last_name: teacherData.last_name.trim(),
                              email: teacherData.email.trim().toLowerCase(),
                              phone: teacherData.phone?.trim() || null,
                              employee_code: teacherData.employee_code?.trim() || null,
                              department: teacherData.department?.trim() || 'GENERAL',
                              specialization: teacherData.specialization?.trim() || null,
                              hire_date: teacherData.hire_date ? new Date(teacherData.hire_date) : new Date(),
                              employment_status: teacherData.employment_status?.trim().toUpperCase() || 'ACTIVE',
                              is_active: teacherData.is_active !== 'false',
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
            context: 'TeachersService.bulkImportFromCSV',
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
    * Export teachers to CSV
    * @param {Object} filters - Export filters
    * @param {string} tenantCode - Tenant identifier
    * @returns {string} CSV data
    */
   async exportToCSV(filters = {}, tenantCode = null) {
      try {
         const { teachers } = await this.getAllTeachers(filters, { page: 1, limit: 10000 }, tenantCode);

         const csvHeaders = [
            'ID',
            'Employee Code',
            'First Name',
            'Last Name',
            'Email',
            'Phone',
            'Department',
            'Specialization',
            'Employment Status',
            'Hire Date',
            'Subjects Assigned',
            'Classes Assigned',
            'Is Active',
         ];

         const csvRows = teachers.map((teacher) => [
            teacher.id,
            teacher.employee_code,
            `"${teacher.first_name}"`,
            `"${teacher.last_name}"`,
            teacher.email,
            teacher.phone || '',
            teacher.department || '',
            `"${teacher.specialization || ''}"`,
            teacher.employment_status,
            teacher.hire_date ? teacher.hire_date.toISOString().split('T')[0] : '',
            teacher.subjects ? teacher.subjects.length : 0,
            teacher.classes ? teacher.classes.length : 0,
            teacher.is_active ? 'Yes' : 'No',
         ]);

         const csvContent = [csvHeaders.join(','), ...csvRows.map((row) => row.join(','))].join('\n');

         return csvContent;
      } catch (error) {
         logError(error, {
            context: 'TeachersService.exportToCSV',
            filters,
            tenantCode,
         });
         throw new Error('Failed to export teachers to CSV');
      }
   }
}

module.exports = TeachersService;
