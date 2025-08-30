const { dbManager } = require('../../../models/system/database');
const { logger } = require('../../../utils/logger');
const { getPaginationData } = require('../../../utils/validation');

/**
 * Student Service - Simple business logic functions
 * Handles student business logic for multi-tenant system
 */

/**
 * Create a new student
 */
async function createStudent(tenantCode, studentData) {
   try {
      const models = await dbManager.getTenantModels(tenantCode);
      const { Student, User } = models;

      // Check if student with admission number already exists
      if (studentData.admission_number) {
         const existingStudent = await Student.findOne({
            where: { admission_number: studentData.admission_number },
         });

         if (existingStudent) {
            throw new Error('Student with this admission number already exists');
         }
      }

      // If creating user account, check email uniqueness
      if (studentData.email && studentData.create_user_account) {
         const existingUser = await User.findOne({
            where: { email: studentData.email },
         });

         if (existingUser) {
            throw new Error('User with this email already exists');
         }
      }

      // Create student
      const student = await Student.create({
         ...studentData,
         status: studentData.status || 'ACTIVE',
      });

      // Create user account if requested
      if (studentData.create_user_account && studentData.email) {
         const bcrypt = require('bcryptjs');
         const tempPassword = studentData.temporary_password || 'student123';
         const hashedPassword = await bcrypt.hash(tempPassword, 12);

         await User.create({
            school_id: studentData.school_id,
            username: studentData.admission_number || studentData.email.split('@')[0],
            email: studentData.email,
            password_hash: hashedPassword,
            role: 'student',
            is_active: true,
         });
      }

      return student;
   } catch (error) {
      logger.error('Error in createStudent service', {
         error: error.message,
         tenantCode,
         admission_number: studentData.admission_number,
      });
      throw error;
   }
}

/**
 * Get student by ID
 */
async function getStudentById(tenantCode, studentId) {
   try {
      const models = await dbManager.getTenantModels(tenantCode);
      const { Student, User, Class, Section } = models;

      const student = await Student.findByPk(studentId, {
         include: [
            {
               model: Class,
               as: 'class',
               attributes: ['id', 'class_name'],
            },
            {
               model: Section,
               as: 'section',
               attributes: ['id', 'section_name'],
            },
            {
               model: User,
               as: 'user',
               attributes: ['id', 'username', 'email', 'is_active', 'last_login_at'],
            },
         ],
      });

      return student;
   } catch (error) {
      logger.error('Error in getStudentById service', {
         error: error.message,
         tenantCode,
         studentId,
      });
      throw error;
   }
}

/**
 * Update student
 */
async function updateStudent(tenantCode, studentId, updateData) {
   try {
      const models = await dbManager.getTenantModels(tenantCode);
      const { Student } = models;

      // Find student first
      const student = await Student.findByPk(studentId);
      if (!student) {
         throw new Error('Student not found');
      }

      // Check admission number uniqueness if being updated
      if (updateData.admission_number && updateData.admission_number !== student.admission_number) {
         const existingStudent = await Student.findOne({
            where: {
               admission_number: updateData.admission_number,
               id: { [require('sequelize').Op.ne]: studentId },
            },
         });

         if (existingStudent) {
            throw new Error('Another student with this admission number already exists');
         }
      }

      // Update student
      await student.update(updateData);
      return student;
   } catch (error) {
      logger.error('Error in updateStudent service', {
         error: error.message,
         tenantCode,
         studentId,
      });
      throw error;
   }
}

/**
 * Delete student (soft delete by setting status to inactive)
 */
async function deleteStudent(tenantCode, studentId) {
   try {
      const models = await dbManager.getTenantModels(tenantCode);
      const { Student, User } = models;

      // Find student first
      const student = await Student.findByPk(studentId);
      if (!student) {
         throw new Error('Student not found');
      }

      // Soft delete student
      await student.update({ status: 'INACTIVE' });

      // Also deactivate associated user account if exists
      const user = await User.findOne({
         where: { email: student.email },
      });
      if (user) {
         await user.update({ is_active: false });
      }

      return { message: 'Student deactivated successfully' };
   } catch (error) {
      logger.error('Error in deleteStudent service', {
         error: error.message,
         tenantCode,
         studentId,
      });
      throw error;
   }
}

/**
 * List students with pagination and filtering
 */
async function listStudents(tenantCode, queryParams = {}) {
   try {
      const models = await dbManager.getTenantModels(tenantCode);
      const { Student, Class, Section } = models;

      const {
         page = 1,
         limit = 20,
         classId,
         sectionId,
         status = 'ACTIVE',
         search,
         sortBy = 'created_at',
         sortOrder = 'DESC',
      } = queryParams;

      // Build where conditions
      const whereConditions = {};

      if (classId) {
         whereConditions.class_id = classId;
      }

      if (sectionId) {
         whereConditions.section_id = sectionId;
      }

      if (status) {
         whereConditions.status = status;
      }

      // Search functionality
      if (search) {
         const { Op } = require('sequelize');
         whereConditions[Op.or] = [
            { first_name: { [Op.like]: `%${search}%` } },
            { last_name: { [Op.like]: `%${search}%` } },
            { admission_number: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
         ];
      }

      const offset = (page - 1) * limit;

      // Get students with pagination
      const { rows: students, count: totalCount } = await Student.findAndCountAll({
         where: whereConditions,
         include: [
            {
               model: Class,
               as: 'class',
               attributes: ['id', 'class_name'],
            },
            {
               model: Section,
               as: 'section',
               attributes: ['id', 'section_name'],
            },
         ],
         order: [[sortBy, sortOrder.toUpperCase()]],
         limit: parseInt(limit),
         offset: offset,
      });

      // Get pagination data
      const paginationData = getPaginationData(page, limit, totalCount);

      return {
         students,
         pagination: paginationData.pagination,
      };
   } catch (error) {
      logger.error('Error in listStudents service', {
         error: error.message,
         tenantCode,
         queryParams,
      });
      throw error;
   }
}

/**
 * Get students for export (PDF/Excel)
 */
async function getStudentsForExport(tenantCode, filters = {}) {
   try {
      const models = await dbManager.getTenantModels(tenantCode);
      const { Student, Class, Section, School } = models;

      // Build where conditions
      const whereConditions = {};

      if (filters.classId) {
         whereConditions.class_id = filters.classId;
      }

      if (filters.sectionId) {
         whereConditions.section_id = filters.sectionId;
      }

      if (filters.status) {
         whereConditions.status = filters.status;
      } else {
         whereConditions.status = 'ACTIVE'; // Default to active students
      }

      // Get students
      const students = await Student.findAll({
         where: whereConditions,
         include: [
            {
               model: Class,
               as: 'class',
               attributes: ['id', 'class_name'],
            },
            {
               model: Section,
               as: 'section',
               attributes: ['id', 'section_name'],
            },
         ],
         order: [['first_name', 'ASC']],
      });

      // Get school data for headers
      const school = await School.findOne({
         attributes: ['id', 'school_name', 'school_code'],
      });

      // Format students for export
      const formattedStudents = students.map((student) => ({
         id: student.id,
         student_id: student.admission_number,
         name: `${student.first_name} ${student.last_name || ''}`.trim(),
         first_name: student.first_name,
         last_name: student.last_name,
         email: student.email,
         phone: student.phone,
         class_name: student.class?.class_name || 'N/A',
         class: student.class?.class_name || 'N/A',
         section_name: student.section?.section_name || 'N/A',
         roll_number: student.roll_number,
         status: student.status,
         admission_date: student.admission_date,
         father_name: student.father_name,
         mother_name: student.mother_name,
      }));

      return {
         students: formattedStudents,
         schoolData: {
            id: school?.id,
            name: school?.school_name || 'School ERP System',
            code: school?.school_code,
         },
      };
   } catch (error) {
      logger.error('Error in getStudentsForExport service', {
         error: error.message,
         tenantCode,
         filters,
      });
      throw error;
   }
}

/**
 * Get students by IDs (for bulk operations)
 */
async function getStudentsByIds(tenantCode, studentIds) {
   try {
      const models = await dbManager.getTenantModels(tenantCode);
      const { Student } = models;

      const students = await Student.findAll({
         where: {
            id: studentIds,
            status: 'ACTIVE',
         },
         attributes: ['id', 'first_name', 'last_name', 'email', 'phone'],
      });

      // Format for email operations
      return students.map((student) => ({
         id: student.id,
         name: `${student.first_name} ${student.last_name || ''}`.trim(),
         first_name: student.first_name,
         last_name: student.last_name,
         email: student.email,
         phone: student.phone,
      }));
   } catch (error) {
      logger.error('Error in getStudentsByIds service', {
         error: error.message,
         tenantCode,
         studentIds,
      });
      throw error;
   }
}

/**
 * Get school data for email templates
 */
async function getSchoolData(tenantCode) {
   try {
      const models = await dbManager.getTenantModels(tenantCode);
      const { School } = models;

      const school = await School.findOne({
         attributes: ['id', 'school_name', 'school_code', 'email', 'phone', 'address'],
      });

      return {
         id: school?.id,
         name: school?.school_name || 'School ERP System',
         code: school?.school_code,
         email: school?.email,
         phone: school?.phone,
         address: school?.address,
      };
   } catch (error) {
      logger.error('Error in getSchoolData service', {
         error: error.message,
         tenantCode,
      });
      // Return default data if school not found
      return {
         name: 'School ERP System',
         email: process.env.SMTP_USER,
         phone: 'Contact School Office',
      };
   }
}

/**
 * Get students by class (helper function)
 */
async function getStudentsByClass(tenantCode, classId) {
   try {
      const models = await dbManager.getTenantModels(tenantCode);
      const { Student } = models;

      const students = await Student.findAll({
         where: {
            class_id: classId,
            status: 'ACTIVE',
         },
         attributes: ['id', 'first_name', 'last_name', 'admission_number', 'roll_number', 'email'],
         order: [
            ['roll_number', 'ASC'],
            ['first_name', 'ASC'],
         ],
      });

      return students;
   } catch (error) {
      logger.error('Error in getStudentsByClass service', {
         error: error.message,
         tenantCode,
         classId,
      });
      throw error;
   }
}

// Direct function exports (no factory pattern)
module.exports = {
   createStudent,
   getStudentById,
   updateStudent,
   deleteStudent,
   listStudents,
   getStudentsForExport,
   getStudentsByIds,
   getSchoolData,
   getStudentsByClass,
};
