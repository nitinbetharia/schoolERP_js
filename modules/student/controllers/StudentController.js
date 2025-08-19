const StudentService = require('../services/StudentService');
const logger = require('../../../utils/logger');
const { handleServiceError } = require('../../../utils/errorHandler');

/**
 * Student Controller
 * Handles HTTP requests for complete student lifecycle management
 * This is the most critical controller in the ERP system
 */
class StudentController {
   constructor() {
      this.studentService = new StudentService();
   }

   /**
    * Create new student with admission workflow
    * POST /students
    */
   async createStudent(req, res) {
      try {
         const { tenantCode } = req.session;
         const studentData = req.body;
         const createdBy = req.session.userId;

         const result = await this.studentService.createStudent(tenantCode, studentData, createdBy);

         logger.info('Student Controller Event', {
            controller: 'student-controller',
            category: 'STUDENT',
            event: 'Student created successfully',
            tenant_code: tenantCode,
            student_id: result.student.id,
            admission_number: result.student.admission_number,
            user_id: req.session.userId,
         });

         res.status(201).json({
            success: true,
            message: 'Student created successfully',
            data: result,
         });
      } catch (error) {
         logger.error('Student Controller Error', {
            controller: 'student-controller',
            category: 'STUDENT',
            event: 'Student creation failed',
            tenant_code: req.session?.tenantCode,
            user_id: req.session?.userId,
            error: error.message,
         });

         const { statusCode, errorResponse } = handleServiceError(error);
         res.status(statusCode).json(errorResponse);
      }
   }

   /**
    * Get students with filtering and pagination
    * GET /students
    */
   async getStudents(req, res) {
      try {
         const { tenantCode } = req.session;
         const options = {
            school_id: req.query.school_id,
            class_id: req.query.class_id,
            section_id: req.query.section_id,
            academic_year: req.query.academic_year,
            student_status: req.query.student_status,
            admission_status: req.query.admission_status,
            gender: req.query.gender,
            search: req.query.search,
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 50,
            include_inactive: req.query.include_inactive === 'true',
         };

         const result = await this.studentService.getStudents(tenantCode, options);

         logger.info('Student Controller Event', {
            controller: 'student-controller',
            category: 'STUDENT',
            event: 'Students retrieved successfully',
            tenant_code: tenantCode,
            count: result.students.length,
            total: result.pagination.total,
            user_id: req.session.userId,
         });

         res.status(200).json({
            success: true,
            message: 'Students retrieved successfully',
            data: result,
         });
      } catch (error) {
         logger.error('Student Controller Error', {
            controller: 'student-controller',
            category: 'STUDENT',
            event: 'Students retrieval failed',
            tenant_code: req.session?.tenantCode,
            user_id: req.session?.userId,
            error: error.message,
         });

         const { statusCode, errorResponse } = handleServiceError(error);
         res.status(statusCode).json(errorResponse);
      }
   }

   /**
    * Get student by ID with complete details
    * GET /students/:id
    */
   async getStudentById(req, res) {
      try {
         const { tenantCode } = req.session;
         const { id } = req.params;

         const result = await this.studentService.getStudentById(tenantCode, id);

         logger.info('Student Controller Event', {
            controller: 'student-controller',
            category: 'STUDENT',
            event: 'Student retrieved successfully',
            tenant_code: tenantCode,
            student_id: id,
            user_id: req.session.userId,
         });

         res.status(200).json({
            success: true,
            message: 'Student retrieved successfully',
            data: result,
         });
      } catch (error) {
         logger.error('Student Controller Error', {
            controller: 'student-controller',
            category: 'STUDENT',
            event: 'Student retrieval failed',
            tenant_code: req.session?.tenantCode,
            student_id: req.params?.id,
            user_id: req.session?.userId,
            error: error.message,
         });

         const { statusCode, errorResponse } = handleServiceError(error);
         res.status(statusCode).json(errorResponse);
      }
   }

   /**
    * Update student information
    * PUT /students/:id
    */
   async updateStudent(req, res) {
      try {
         const { tenantCode } = req.session;
         const { id } = req.params;
         const studentData = req.body;
         const updatedBy = req.session.userId;

         const result = await this.studentService.updateStudent(tenantCode, id, studentData, updatedBy);

         logger.info('Student Controller Event', {
            controller: 'student-controller',
            category: 'STUDENT',
            event: 'Student updated successfully',
            tenant_code: tenantCode,
            student_id: id,
            user_id: req.session.userId,
         });

         res.status(200).json({
            success: true,
            message: 'Student updated successfully',
            data: result,
         });
      } catch (error) {
         logger.error('Student Controller Error', {
            controller: 'student-controller',
            category: 'STUDENT',
            event: 'Student update failed',
            tenant_code: req.session?.tenantCode,
            student_id: req.params?.id,
            user_id: req.session?.userId,
            error: error.message,
         });

         const { statusCode, errorResponse } = handleServiceError(error);
         res.status(statusCode).json(errorResponse);
      }
   }

   /**
    * Transfer student to different school/class/section
    * POST /students/:id/transfer
    */
   async transferStudent(req, res) {
      try {
         const { tenantCode } = req.session;
         const { id } = req.params;
         const transferData = req.body;
         const updatedBy = req.session.userId;

         const result = await this.studentService.transferStudent(tenantCode, id, transferData, updatedBy);

         logger.info('Student Controller Event', {
            controller: 'student-controller',
            category: 'STUDENT',
            event: 'Student transferred successfully',
            tenant_code: tenantCode,
            student_id: id,
            transfer_type: transferData.to_school_id ? 'EXTERNAL' : 'INTERNAL',
            user_id: req.session.userId,
         });

         res.status(200).json({
            success: true,
            message: 'Student transferred successfully',
            data: result,
         });
      } catch (error) {
         logger.error('Student Controller Error', {
            controller: 'student-controller',
            category: 'STUDENT',
            event: 'Student transfer failed',
            tenant_code: req.session?.tenantCode,
            student_id: req.params?.id,
            user_id: req.session?.userId,
            error: error.message,
         });

         const { statusCode, errorResponse } = handleServiceError(error);
         res.status(statusCode).json(errorResponse);
      }
   }

   /**
    * Promote student to next class
    * POST /students/:id/promote
    */
   async promoteStudent(req, res) {
      try {
         const { tenantCode } = req.session;
         const { id } = req.params;
         const promotionData = req.body;
         const updatedBy = req.session.userId;

         const result = await this.studentService.promoteStudent(tenantCode, id, promotionData, updatedBy);

         logger.info('Student Controller Event', {
            controller: 'student-controller',
            category: 'STUDENT',
            event: 'Student promoted successfully',
            tenant_code: tenantCode,
            student_id: id,
            from_class: promotionData.from_class_id,
            to_class: promotionData.to_class_id,
            user_id: req.session.userId,
         });

         res.status(200).json({
            success: true,
            message: 'Student promoted successfully',
            data: result,
         });
      } catch (error) {
         logger.error('Student Controller Error', {
            controller: 'student-controller',
            category: 'STUDENT',
            event: 'Student promotion failed',
            tenant_code: req.session?.tenantCode,
            student_id: req.params?.id,
            user_id: req.session?.userId,
            error: error.message,
         });

         const { statusCode, errorResponse } = handleServiceError(error);
         res.status(statusCode).json(errorResponse);
      }
   }

   /**
    * Get student enrollment history
    * GET /students/:id/enrollments
    */
   async getStudentEnrollments(req, res) {
      try {
         const { tenantCode } = req.session;
         const { id } = req.params;

         const result = await this.studentService.getStudentEnrollments(tenantCode, id);

         logger.info('Student Controller Event', {
            controller: 'student-controller',
            category: 'STUDENT',
            event: 'Student enrollments retrieved successfully',
            tenant_code: tenantCode,
            student_id: id,
            user_id: req.session.userId,
         });

         res.status(200).json({
            success: true,
            message: 'Student enrollments retrieved successfully',
            data: result,
         });
      } catch (error) {
         logger.error('Student Controller Error', {
            controller: 'student-controller',
            category: 'STUDENT',
            event: 'Student enrollments retrieval failed',
            tenant_code: req.session?.tenantCode,
            student_id: req.params?.id,
            user_id: req.session?.userId,
            error: error.message,
         });

         const { statusCode, errorResponse } = handleServiceError(error);
         res.status(statusCode).json(errorResponse);
      }
   }

   /**
    * Get students by class/section
    * GET /students/class/:classId/section/:sectionId
    */
   async getStudentsByClassSection(req, res) {
      try {
         const { tenantCode } = req.session;
         const { classId, sectionId } = req.params;

         const options = {
            class_id: classId,
            section_id: sectionId,
            student_status: req.query.student_status || 'ACTIVE',
         };

         const result = await this.studentService.getStudents(tenantCode, options);

         logger.info('Student Controller Event', {
            controller: 'student-controller',
            category: 'STUDENT',
            event: 'Class section students retrieved successfully',
            tenant_code: tenantCode,
            class_id: classId,
            section_id: sectionId,
            count: result.students.length,
            user_id: req.session.userId,
         });

         res.status(200).json({
            success: true,
            message: 'Class section students retrieved successfully',
            data: result,
         });
      } catch (error) {
         logger.error('Student Controller Error', {
            controller: 'student-controller',
            category: 'STUDENT',
            event: 'Class section students retrieval failed',
            tenant_code: req.session?.tenantCode,
            class_id: req.params?.classId,
            section_id: req.params?.sectionId,
            user_id: req.session?.userId,
            error: error.message,
         });

         const { statusCode, errorResponse } = handleServiceError(error);
         res.status(statusCode).json(errorResponse);
      }
   }

   /**
    * Update student status (activate/deactivate/suspend)
    * PATCH /students/:id/status
    */
   async updateStudentStatus(req, res) {
      try {
         const { tenantCode } = req.session;
         const { id } = req.params;
         const { status, reason } = req.body;
         const updatedBy = req.session.userId;

         const result = await this.studentService.updateStudent(
            tenantCode,
            id,
            {
               student_status: status,
               remarks: reason ? `Status changed to ${status}: ${reason}` : `Status changed to ${status}`,
            },
            updatedBy
         );

         logger.info('Student Controller Event', {
            controller: 'student-controller',
            category: 'STUDENT',
            event: 'Student status updated successfully',
            tenant_code: tenantCode,
            student_id: id,
            new_status: status,
            user_id: req.session.userId,
         });

         res.status(200).json({
            success: true,
            message: 'Student status updated successfully',
            data: result,
         });
      } catch (error) {
         logger.error('Student Controller Error', {
            controller: 'student-controller',
            category: 'STUDENT',
            event: 'Student status update failed',
            tenant_code: req.session?.tenantCode,
            student_id: req.params?.id,
            user_id: req.session?.userId,
            error: error.message,
         });

         const { statusCode, errorResponse } = handleServiceError(error);
         res.status(statusCode).json(errorResponse);
      }
   }

   /**
    * Bulk operations on students
    * POST /students/bulk
    */
   async bulkOperations(req, res) {
      try {
         const { tenantCode } = req.session;
         const { operation, student_ids, data } = req.body;
         const updatedBy = req.session.userId;

         let results = [];

         switch (operation) {
            case 'PROMOTE':
               for (const studentId of student_ids) {
                  const result = await this.studentService.promoteStudent(tenantCode, studentId, data, updatedBy);
                  results.push(result);
               }
               break;

            case 'TRANSFER':
               for (const studentId of student_ids) {
                  const result = await this.studentService.transferStudent(tenantCode, studentId, data, updatedBy);
                  results.push(result);
               }
               break;

            case 'UPDATE_STATUS':
               for (const studentId of student_ids) {
                  const result = await this.studentService.updateStudent(
                     tenantCode,
                     studentId,
                     { student_status: data.status },
                     updatedBy
                  );
                  results.push(result);
               }
               break;

            default:
               throw new Error('Invalid bulk operation');
         }

         logger.info('Student Controller Event', {
            controller: 'student-controller',
            category: 'STUDENT',
            event: `Bulk ${operation} completed successfully`,
            tenant_code: tenantCode,
            student_count: student_ids.length,
            user_id: req.session.userId,
         });

         res.status(200).json({
            success: true,
            message: `Bulk ${operation} completed successfully`,
            data: { results },
         });
      } catch (error) {
         logger.error('Student Controller Error', {
            controller: 'student-controller',
            category: 'STUDENT',
            event: 'Bulk operation failed',
            tenant_code: req.session?.tenantCode,
            user_id: req.session?.userId,
            error: error.message,
         });

         const { statusCode, errorResponse } = handleServiceError(error);
         res.status(statusCode).json(errorResponse);
      }
   }
}

module.exports = StudentController;
