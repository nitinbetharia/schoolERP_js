const StudentService = require('../services/StudentService');
const logger = require('../../../utils/logger');
const {
   ErrorFactory,
   formatErrorResponse,
   getErrorStatusCode,
   formatSuccessResponse
} = require('../../../utils/errors');

/**
 * Student Controller
 * Handles HTTP requests for complete student lifecycle management
 * This is the most critical controller in the ERP system
 */
function createStudentController() {
   const studentService = new StudentService();

   /**
    * Create a new student
    * POST /api/students
    */
   async function createStudent(req, res, next) {
      try {
         const tenantCode = req.tenantCode;
         const studentData = req.body;
         const createdBy = req.user ? req.user.id : null;

         // Add creator info
         studentData.created_by = createdBy;

         const student = await studentService.createStudent(tenantCode, studentData);

         logger.info('Student created successfully', {
            controller: 'student-controller',
            category: 'STUDENT',
            event: 'Student creation successful',
            tenant_code: tenantCode,
            student_id: student.id,
            user_id: createdBy
         });

         res.status(201).json(formatSuccessResponse(student, 'Student created successfully'));
      } catch (error) {
         logger.error('Student Controller Error', {
            controller: 'student-controller',
            category: 'STUDENT',
            event: 'Student creation failed',
            tenant_code: req.session?.tenantCode,
            user_id: req.session?.userId,
            error: error.message
         });
         next(error);
      }
   }

   /**
    * Get all students with filtering and pagination
    * GET /api/students
    */
   async function getStudents(req, res, next) {
      try {
         const tenantCode = req.tenantCode;
         const query = req.query;

         const result = await studentService.getStudents(tenantCode, query);

         res.json(formatSuccessResponse(result.students, 'Students retrieved successfully', {
            pagination: result.pagination
         }));
      } catch (error) {
         logger.error('Student Controller Error', {
            controller: 'student-controller',
            category: 'STUDENT',
            event: 'Students retrieval failed',
            tenant_code: req.session?.tenantCode,
            user_id: req.session?.userId,
            error: error.message
         });
         next(error);
      }
   }

   /**
    * Get student by ID
    * GET /api/students/:id
    */
   async function getStudentById(req, res, next) {
      try {
         const tenantCode = req.tenantCode;
         const studentId = req.params.id;

         const student = await studentService.getStudentById(tenantCode, studentId);

         res.json(formatSuccessResponse(student, 'Student retrieved successfully'));
      } catch (error) {
         logger.error('Student Controller Error', {
            controller: 'student-controller',
            category: 'STUDENT',
            event: 'Student retrieval failed',
            tenant_code: req.session?.tenantCode,
            student_id: req.params?.id,
            user_id: req.session?.userId,
            error: error.message
         });
         next(error);
      }
   }

   /**
    * Update student
    * PUT /api/students/:id
    */
   async function updateStudent(req, res, next) {
      try {
         const tenantCode = req.tenantCode;
         const studentId = req.params.id;
         const updateData = req.body;
         const updatedBy = req.user ? req.user.id : null;

         updateData.updated_by = updatedBy;

         const student = await studentService.updateStudent(tenantCode, studentId, updateData);

         logger.info('Student updated successfully', {
            controller: 'student-controller',
            category: 'STUDENT',
            event: 'Student update successful',
            tenant_code: tenantCode,
            student_id: studentId,
            user_id: updatedBy
         });

         res.json(formatSuccessResponse(student, 'Student updated successfully'));
      } catch (error) {
         logger.error('Student Controller Error', {
            controller: 'student-controller',
            category: 'STUDENT',
            event: 'Student update failed',
            tenant_code: req.session?.tenantCode,
            student_id: req.params?.id,
            user_id: req.session?.userId,
            error: error.message
         });
         next(error);
      }
   }

   /**
    * Transfer student to different class/section
    * POST /api/students/:id/transfer
    */
   async function transferStudent(req, res, next) {
      try {
         const tenantCode = req.tenantCode;
         const studentId = req.params.id;
         const transferData = req.body;
         const updatedBy = req.user ? req.user.id : null;

         const result = await studentService.transferStudent(tenantCode, studentId, transferData, updatedBy);

         logger.info('Student transferred successfully', {
            controller: 'student-controller',
            category: 'STUDENT',
            event: 'Student transfer successful',
            tenant_code: tenantCode,
            student_id: studentId,
            user_id: updatedBy
         });

         res.json(formatSuccessResponse(result, 'Student transferred successfully'));
      } catch (error) {
         logger.error('Student Controller Error', {
            controller: 'student-controller',
            category: 'STUDENT',
            event: 'Student transfer failed',
            tenant_code: req.session?.tenantCode,
            student_id: req.params?.id,
            user_id: req.session?.userId,
            error: error.message
         });
         next(error);
      }
   }

   /**
    * Promote student to next class
    * POST /api/students/:id/promote
    */
   async function promoteStudent(req, res, next) {
      try {
         const tenantCode = req.tenantCode;
         const studentId = req.params.id;
         const promotionData = req.body;
         const updatedBy = req.user ? req.user.id : null;

         const result = await studentService.promoteStudent(tenantCode, studentId, promotionData, updatedBy);

         logger.info('Student promoted successfully', {
            controller: 'student-controller',
            category: 'STUDENT',
            event: 'Student promotion successful',
            tenant_code: tenantCode,
            student_id: studentId,
            user_id: updatedBy
         });

         res.json(formatSuccessResponse(result, 'Student promoted successfully'));
      } catch (error) {
         logger.error('Student Controller Error', {
            controller: 'student-controller',
            category: 'STUDENT',
            event: 'Student promotion failed',
            tenant_code: req.session?.tenantCode,
            student_id: req.params?.id,
            user_id: req.session?.userId,
            error: error.message
         });
         next(error);
      }
   }

   /**
    * Get student enrollments
    * GET /api/students/:id/enrollments
    */
   async function getStudentEnrollments(req, res, next) {
      try {
         const tenantCode = req.tenantCode;
         const studentId = req.params.id;

         const enrollments = await studentService.getStudentEnrollments(tenantCode, studentId);

         res.json(formatSuccessResponse(enrollments, 'Student enrollments retrieved successfully'));
      } catch (error) {
         logger.error('Student Controller Error', {
            controller: 'student-controller',
            category: 'STUDENT',
            event: 'Student enrollments retrieval failed',
            tenant_code: req.session?.tenantCode,
            student_id: req.params?.id,
            user_id: req.session?.userId,
            error: error.message
         });
         next(error);
      }
   }

   /**
    * Get students by class and section
    * GET /api/students/class/:classId/section/:sectionId
    */
   async function getStudentsByClassSection(req, res, next) {
      try {
         const tenantCode = req.tenantCode;
         const { classId, sectionId } = req.params;
         const query = req.query;

         const result = await studentService.getStudentsByClassSection(tenantCode, classId, sectionId, query);

         res.json(formatSuccessResponse(result.students, 'Students retrieved successfully', {
            pagination: result.pagination
         }));
      } catch (error) {
         logger.error('Student Controller Error', {
            controller: 'student-controller',
            category: 'STUDENT',
            event: 'Class section students retrieval failed',
            tenant_code: req.session?.tenantCode,
            class_id: req.params?.classId,
            section_id: req.params?.sectionId,
            user_id: req.session?.userId,
            error: error.message
         });
         next(error);
      }
   }

   /**
    * Update student status
    * PATCH /api/students/:id/status
    */
   async function updateStudentStatus(req, res, next) {
      try {
         const tenantCode = req.tenantCode;
         const studentId = req.params.id;
         const { status } = req.body;
         const updatedBy = req.user ? req.user.id : null;

         const result = await studentService.updateStudentStatus(tenantCode, studentId, status, updatedBy);

         logger.info('Student status updated successfully', {
            controller: 'student-controller',
            category: 'STUDENT',
            event: 'Student status update successful',
            tenant_code: tenantCode,
            student_id: studentId,
            user_id: updatedBy,
            new_status: status
         });

         res.json(formatSuccessResponse(result, 'Student status updated successfully'));
      } catch (error) {
         logger.error('Student Controller Error', {
            controller: 'student-controller',
            category: 'STUDENT',
            event: 'Student status update failed',
            tenant_code: req.session?.tenantCode,
            student_id: req.params?.id,
            user_id: req.session?.userId,
            error: error.message
         });
         next(error);
      }
   }

   /**
    * Bulk operations on students
    * POST /api/students/bulk
    */
   async function bulkOperations(req, res, next) {
      try {
         const tenantCode = req.tenantCode;
         const { operation, student_ids, data } = req.body;
         const updatedBy = req.user ? req.user.id : null;

         const results = [];
         const errors = [];

         switch (operation) {
            case 'PROMOTE':
               for (const studentId of student_ids) {
                  try {
                     const result = await studentService.promoteStudent(tenantCode, studentId, data, updatedBy);
                     results.push(result);
                  } catch (error) {
                     errors.push({ studentId, error: error.message });
                  }
               }
               break;

            case 'TRANSFER':
               for (const studentId of student_ids) {
                  try {
                     const result = await studentService.transferStudent(tenantCode, studentId, data, updatedBy);
                     results.push(result);
                  } catch (error) {
                     errors.push({ studentId, error: error.message });
                  }
               }
               break;

            case 'UPDATE_STATUS':
               for (const studentId of student_ids) {
                  try {
                     const result = await studentService.updateStudent(
                        tenantCode,
                        studentId,
                        { student_status: data.status },
                        updatedBy
                     );
                     results.push(result);
                  } catch (error) {
                     errors.push({ studentId, error: error.message });
                  }
               }
               break;

            default:
               throw ErrorFactory.badRequest(`Invalid bulk operation: ${operation}`);
         }

         logger.info('Bulk operation completed', {
            controller: 'student-controller',
            category: 'STUDENT',
            event: 'Bulk operation completed',
            tenant_code: tenantCode,
            operation,
            total: student_ids.length,
            successful: results.length,
            failed: errors.length,
            user_id: updatedBy
         });

         res.json(formatSuccessResponse({
            operation,
            total: student_ids.length,
            successful: results.length,
            failed: errors.length,
            results,
            errors
         }, 'Bulk operation completed'));
      } catch (error) {
         logger.error('Student Controller Error', {
            controller: 'student-controller',
            category: 'STUDENT',
            event: 'Bulk operation failed',
            tenant_code: req.session?.tenantCode,
            user_id: req.session?.userId,
            error: error.message
         });
         next(error);
      }
   }

   return {
      createStudent,
      getStudents,
      getStudentById,
      updateStudent,
      transferStudent,
      promoteStudent,
      getStudentEnrollments,
      getStudentsByClassSection,
      updateStudentStatus,
      bulkOperations
   };
}

module.exports = createStudentController;