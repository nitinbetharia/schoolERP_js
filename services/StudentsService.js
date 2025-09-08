const { Op } = require('sequelize');
const { logError } = require('../utils/logger');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

/**
 * Enhanced Students Service
 * Complete student lifecycle management with bulk operations
 * Phase 3 Implementation - Enhanced Students Management System
 */

class StudentsService {
   constructor(models) {
      this.Student = models.Student;
      this.Section = models.Section;
      this.Class = models.Class;
      this.School = models.School;
      this.User = models.User;
      this.StudentParent = models.StudentParent; // Junction table for parent relationships
      this.StudentMedical = models.StudentMedical;
      this.StudentAcademic = models.StudentAcademic;
   }

   /**
    * Get all students with advanced filtering and search
    * @param {Object} filters - Search and filter criteria
    * @param {Object} pagination - Pagination parameters
    * @param {string} tenantCode - Tenant code for multi-tenant support
    * @returns {Promise<Object>} Students with metadata
    */
   async getAllStudents(filters = {}, pagination = {}, tenantCode = null) {
      try {
         const { search, class_id, section_id, admission_status, academic_year, gender } = filters;
         const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC' } = pagination;
         const offset = (page - 1) * limit;

         // Build complex where conditions
         const whereConditions = {};
         const includeConditions = [];

         // Multi-tenant filtering
         if (tenantCode) {
            whereConditions.tenant_code = tenantCode;
         }

         // Advanced search across multiple fields
         if (search) {
            whereConditions[Op.or] = [
               { first_name: { [Op.like]: `%${search}%` } },
               { last_name: { [Op.like]: `%${search}%` } },
               { admission_number: { [Op.like]: `%${search}%` } },
               { email: { [Op.like]: `%${search}%` } },
               { phone: { [Op.like]: `%${search}%` } },
               { '$Section.name$': { [Op.like]: `%${search}%` } },
               { '$Section.Class.name$': { [Op.like]: `%${search}%` } },
            ];
         }

         // Filter by class
         if (class_id) {
            includeConditions.push({
               model: this.Section,
               as: 'section',
               where: { class_id },
               required: true,
               include: [
                  {
                     model: this.Class,
                     as: 'class',
                  },
               ],
            });
         } else {
            includeConditions.push({
               model: this.Section,
               as: 'section',
               required: false,
               include: [
                  {
                     model: this.Class,
                     as: 'class',
                  },
               ],
            });
         }

         // Filter by section
         if (section_id) {
            whereConditions.section_id = section_id;
         }

         // Filter by admission status
         if (admission_status) {
            whereConditions.admission_status = admission_status;
         }

         // Filter by academic year
         if (academic_year) {
            whereConditions.academic_year = academic_year;
         }

         // Filter by gender
         if (gender) {
            whereConditions.gender = gender;
         }

         const { count, rows } = await this.Student.findAndCountAll({
            where: whereConditions,
            include: [
               ...includeConditions,
               {
                  model: this.StudentParent,
                  as: 'parents',
                  required: false,
                  attributes: ['relationship', 'first_name', 'last_name', 'phone', 'email'],
               },
               {
                  model: this.StudentMedical,
                  as: 'medicalInfo',
                  required: false,
                  attributes: ['blood_group', 'allergies', 'medical_conditions'],
               },
            ],
            order: [[sortBy, sortOrder.toUpperCase()]],
            limit: parseInt(limit),
            offset: parseInt(offset),
            distinct: true,
         });

         return {
            students: rows.map((student) => ({
               ...student.get({ plain: true }),
               fullName: `${student.first_name} ${student.last_name}`,
               classSection: student.section
                  ? `${student.section.class.name} - ${student.section.name}`
                  : 'Not Assigned',
            })),
            pagination: {
               currentPage: parseInt(page),
               totalPages: Math.ceil(count / limit),
               pageSize: parseInt(limit),
               totalRecords: count,
            },
         };
      } catch (error) {
         logError(error, { context: 'StudentsService.getAllStudents', tenantCode });
         throw new Error('Failed to retrieve students');
      }
   }

   /**
    * Get student by ID with complete profile information
    * @param {number} studentId - Student ID
    * @param {string} tenantCode - Tenant code
    * @returns {Promise<Object>} Complete student profile
    */
   async getStudentById(studentId, tenantCode = null) {
      try {
         const whereConditions = { id: studentId };
         if (tenantCode) {
            whereConditions.tenant_code = tenantCode;
         }

         const student = await this.Student.findOne({
            where: whereConditions,
            include: [
               {
                  model: this.Section,
                  as: 'section',
                  include: [
                     {
                        model: this.Class,
                        as: 'class',
                        include: [
                           {
                              model: this.School,
                              as: 'school',
                           },
                        ],
                     },
                  ],
               },
               {
                  model: this.StudentParent,
                  as: 'parents',
                  attributes: [
                     'id',
                     'relationship',
                     'first_name',
                     'last_name',
                     'phone',
                     'email',
                     'occupation',
                     'address',
                  ],
               },
               {
                  model: this.StudentMedical,
                  as: 'medicalInfo',
                  attributes: [
                     'blood_group',
                     'height',
                     'weight',
                     'allergies',
                     'medical_conditions',
                     'emergency_contact',
                  ],
               },
               {
                  model: this.StudentAcademic,
                  as: 'academicHistory',
                  attributes: ['previous_school', 'academic_year', 'grade', 'percentage', 'remarks'],
               },
            ],
         });

         if (!student) {
            throw new Error('Student not found');
         }

         return {
            ...student.get({ plain: true }),
            fullName: `${student.first_name} ${student.last_name}`,
            age: this.calculateAge(student.date_of_birth),
            classSection: student.section ? `${student.section.class.name} - ${student.section.name}` : 'Not Assigned',
         };
      } catch (error) {
         logError(error, { context: 'StudentsService.getStudentById', studentId, tenantCode });
         throw error;
      }
   }

   /**
    * Create new student with complete profile
    * @param {Object} studentData - Student data with parents and medical info
    * @param {string} tenantCode - Tenant code
    * @returns {Promise<Object>} Created student with full profile
    */
   async createStudent(studentData, tenantCode = null) {
      const transaction = await this.Student.sequelize.transaction();

      try {
         // Extract related data
         const { parents = [], medicalInfo = {}, academicHistory = [], ...baseStudentData } = studentData;

         // Add tenant code and generate admission number
         const studentCreateData = {
            ...baseStudentData,
            tenant_code: tenantCode,
            admission_number: await this.generateAdmissionNumber(tenantCode),
            admission_status: 'ACTIVE',
            created_at: new Date(),
            updated_at: new Date(),
         };

         // Create student record
         const newStudent = await this.Student.create(studentCreateData, { transaction });

         // Create parent records
         if (parents.length > 0) {
            const parentRecords = parents.map((parent) => ({
               ...parent,
               student_id: newStudent.id,
               tenant_code: tenantCode,
            }));
            await this.StudentParent.bulkCreate(parentRecords, { transaction });
         }

         // Create medical information
         if (Object.keys(medicalInfo).length > 0) {
            await this.StudentMedical.create(
               {
                  ...medicalInfo,
                  student_id: newStudent.id,
                  tenant_code: tenantCode,
               },
               { transaction }
            );
         }

         // Create academic history records
         if (academicHistory.length > 0) {
            const academicRecords = academicHistory.map((record) => ({
               ...record,
               student_id: newStudent.id,
               tenant_code: tenantCode,
            }));
            await this.StudentAcademic.bulkCreate(academicRecords, { transaction });
         }

         await transaction.commit();

         // Return complete student profile
         return await this.getStudentById(newStudent.id, tenantCode);
      } catch (error) {
         await transaction.rollback();
         logError(error, { context: 'StudentsService.createStudent', studentData, tenantCode });
         throw error;
      }
   }

   /**
    * Update student information
    * @param {number} studentId - Student ID
    * @param {Object} updateData - Updated student data
    * @param {string} tenantCode - Tenant code
    * @returns {Promise<Object>} Updated student profile
    */
   async updateStudent(studentId, updateData, tenantCode = null) {
      const transaction = await this.Student.sequelize.transaction();

      try {
         // Verify student exists and belongs to tenant
         const existingStudent = await this.getStudentById(studentId, tenantCode);

         // Extract related data for separate updates
         const { parents, medicalInfo, academicHistory, ...baseUpdateData } = updateData;

         // Update base student information
         await this.Student.update(baseUpdateData, {
            where: { id: studentId },
            transaction,
         });

         // Update parent information if provided
         if (parents) {
            // Delete existing parent records and recreate (for simplicity)
            await this.StudentParent.destroy({
               where: { student_id: studentId },
               transaction,
            });

            if (parents.length > 0) {
               const parentRecords = parents.map((parent) => ({
                  ...parent,
                  student_id: studentId,
                  tenant_code: tenantCode,
               }));
               await this.StudentParent.bulkCreate(parentRecords, { transaction });
            }
         }

         // Update medical information
         if (medicalInfo) {
            await this.StudentMedical.upsert(
               {
                  ...medicalInfo,
                  student_id: studentId,
                  tenant_code: tenantCode,
               },
               { transaction }
            );
         }

         // Update academic history if provided
         if (academicHistory) {
            await this.StudentAcademic.destroy({
               where: { student_id: studentId },
               transaction,
            });

            if (academicHistory.length > 0) {
               const academicRecords = academicHistory.map((record) => ({
                  ...record,
                  student_id: studentId,
                  tenant_code: tenantCode,
               }));
               await this.StudentAcademic.bulkCreate(academicRecords, { transaction });
            }
         }

         await transaction.commit();

         return await this.getStudentById(studentId, tenantCode);
      } catch (error) {
         await transaction.rollback();
         logError(error, { context: 'StudentsService.updateStudent', studentId, updateData, tenantCode });
         throw error;
      }
   }

   /**
    * Transfer student to different section
    * @param {number} studentId - Student ID
    * @param {number} newSectionId - New section ID
    * @param {string} reason - Transfer reason
    * @param {string} tenantCode - Tenant code
    * @returns {Promise<Object>} Updated student
    */
   async transferStudent(studentId, newSectionId, reason, tenantCode = null) {
      try {
         // Verify student exists
         const student = await this.getStudentById(studentId, tenantCode);

         // Verify new section exists and has capacity
         const newSection = await this.Section.findOne({
            where: { id: newSectionId },
            include: [
               {
                  model: this.Class,
                  as: 'class',
               },
            ],
         });

         if (!newSection) {
            throw new Error('Target section not found');
         }

         // Check section capacity
         const currentStrength = await this.Student.count({
            where: { section_id: newSectionId, admission_status: 'ACTIVE' },
         });

         if (newSection.capacity && currentStrength >= newSection.capacity) {
            throw new Error('Target section is at full capacity');
         }

         // Update student section
         await this.Student.update(
            {
               section_id: newSectionId,
               transfer_reason: reason,
               transfer_date: new Date(),
            },
            {
               where: { id: studentId },
            }
         );

         // Log the transfer (could be expanded to a separate audit table)
         logError(null, {
            context: 'Student Transfer',
            studentId,
            oldSection: student.section?.name,
            newSection: newSection.name,
            reason,
            tenantCode,
         });

         return await this.getStudentById(studentId, tenantCode);
      } catch (error) {
         logError(error, { context: 'StudentsService.transferStudent', studentId, newSectionId, tenantCode });
         throw error;
      }
   }

   /**
    * Bulk import students from CSV
    * @param {string} filePath - Path to CSV file
    * @param {string} tenantCode - Tenant code
    * @returns {Promise<Object>} Import results
    */
   async bulkImportStudents(filePath, tenantCode = null) {
      return new Promise((resolve, reject) => {
         const students = [];
         const errors = [];
         let processedCount = 0;

         fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
               try {
                  // Validate and transform CSV row to student data
                  const studentData = this.validateCSVRow(row);
                  students.push({
                     ...studentData,
                     tenant_code: tenantCode,
                  });
               } catch (error) {
                  errors.push({
                     row: processedCount + 1,
                     error: error.message,
                     data: row,
                  });
               }
               processedCount++;
            })
            .on('end', async () => {
               try {
                  const results = await this.processBulkImport(students, errors, tenantCode);
                  resolve(results);
               } catch (error) {
                  reject(error);
               }
            })
            .on('error', reject);
      });
   }

   /**
    * Get students statistics
    * @param {string} tenantCode - Tenant code
    * @returns {Promise<Object>} Student statistics
    */
   async getStudentsStatistics(tenantCode = null) {
      try {
         const whereConditions = tenantCode ? { tenant_code: tenantCode } : {};

         const [totalStudents, activeStudents, maleStudents, femaleStudents, classDistribution, recentAdmissions] =
            await Promise.all([
               this.Student.count({ where: whereConditions }),
               this.Student.count({ where: { ...whereConditions, admission_status: 'ACTIVE' } }),
               this.Student.count({ where: { ...whereConditions, gender: 'MALE', admission_status: 'ACTIVE' } }),
               this.Student.count({ where: { ...whereConditions, gender: 'FEMALE', admission_status: 'ACTIVE' } }),
               this.getClassWiseDistribution(tenantCode),
               this.Student.count({
                  where: {
                     ...whereConditions,
                     created_at: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
                  },
               }),
            ]);

         return {
            totalStudents,
            activeStudents,
            inactiveStudents: totalStudents - activeStudents,
            maleStudents,
            femaleStudents,
            genderRatio: activeStudents > 0 ? Math.round((maleStudents / activeStudents) * 100) : 0,
            classDistribution,
            recentAdmissions,
         };
      } catch (error) {
         logError(error, { context: 'StudentsService.getStudentsStatistics', tenantCode });
         throw new Error('Failed to retrieve student statistics');
      }
   }

   // Helper methods

   calculateAge(dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
         age--;
      }

      return age;
   }

   async generateAdmissionNumber(tenantCode) {
      const year = new Date().getFullYear();
      const prefix = tenantCode ? tenantCode.toUpperCase().slice(0, 3) : 'SCH';

      const lastStudent = await this.Student.findOne({
         where: tenantCode ? { tenant_code: tenantCode } : {},
         order: [['id', 'DESC']],
         attributes: ['id'],
      });

      const sequence = lastStudent ? lastStudent.id + 1 : 1;
      return `${prefix}${year}${sequence.toString().padStart(4, '0')}`;
   }

   validateCSVRow(row) {
      const required = ['first_name', 'last_name', 'date_of_birth', 'gender'];
      for (const field of required) {
         if (!row[field]) {
            throw new Error(`Missing required field: ${field}`);
         }
      }

      return {
         first_name: row.first_name.trim(),
         last_name: row.last_name.trim(),
         date_of_birth: new Date(row.date_of_birth),
         gender: row.gender.toUpperCase(),
         email: row.email?.trim(),
         phone: row.phone?.trim(),
         address: row.address?.trim(),
         section_id: row.section_id ? parseInt(row.section_id) : null,
      };
   }

   async processBulkImport(students, errors, tenantCode) {
      const successfulImports = [];
      const failedImports = [];

      for (const studentData of students) {
         try {
            const createdStudent = await this.createStudent(studentData, tenantCode);
            successfulImports.push(createdStudent);
         } catch (error) {
            failedImports.push({
               studentData,
               error: error.message,
            });
         }
      }

      return {
         successful: successfulImports.length,
         failed: failedImports.length,
         errors: [...errors, ...failedImports],
         successfulStudents: successfulImports,
      };
   }

   async getClassWiseDistribution(tenantCode) {
      try {
         const distribution = await this.Student.findAll({
            where: tenantCode ? { tenant_code: tenantCode } : {},
            include: [
               {
                  model: this.Section,
                  as: 'section',
                  include: [
                     {
                        model: this.Class,
                        as: 'class',
                     },
                  ],
               },
            ],
            attributes: [[this.Student.sequelize.fn('COUNT', this.Student.sequelize.col('Student.id')), 'count']],
            group: ['section.class.id', 'section.class.name'],
            raw: true,
         });

         return distribution.map((item) => ({
            className: item['section.class.name'],
            studentCount: parseInt(item.count),
         }));
      } catch (error) {
         logError(error, { context: 'StudentsService.getClassWiseDistribution', tenantCode });
         return [];
      }
   }
}

module.exports = StudentsService;
