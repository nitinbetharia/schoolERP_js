const studentService = require('../services/studentService');
const pdfService = require('../../../utils/pdfService');
const excelService = require('../../../utils/excelService');
const emailService = require('../../../utils/emailService');
const { formatSuccessResponse, formatErrorResponse } = require('../../../utils/validation');
const { logger } = require('../../../utils/logger');

/**
 * Student Controller - Simple function exports with integrated features
 * Includes PDF generation, Excel export, and Email functionality
 */

/**
 * Create a new student
 * POST /api/students
 */
async function createStudent(req, res) {
   try {
      const tenantCode = req.tenantCode;
      const studentData = req.body;
      const createdBy = req.user ? req.user.id : null;

      studentData.created_by = createdBy;

      const student = await studentService.createStudent(tenantCode, studentData);

      logger.info('Student created successfully', { 
         tenantCode, 
         studentId: student.id,
         createdBy 
      });

      res.status(201).json(formatSuccessResponse(student, 'Student created successfully'));
   } catch (error) {
      logger.error('Failed to create student', { 
         error: error.message, 
         tenantCode: req.tenantCode 
      });
    
      if (error.message.includes('already exists')) {
         res.status(409).json(formatErrorResponse(error, 'Student with this admission number already exists'));
      } else {
         res.status(400).json(formatErrorResponse(error, 'Failed to create student'));
      }
   }
}

/**
 * Get student by ID
 * GET /api/students/:id
 */
async function getStudentById(req, res) {
   try {
      const tenantCode = req.tenantCode;
      const studentId = req.params.id;

      const student = await studentService.getStudentById(tenantCode, studentId);

      if (!student) {
         return res.status(404).json(formatErrorResponse(null, 'Student not found'));
      }

      res.json(formatSuccessResponse(student, 'Student retrieved successfully'));
   } catch (error) {
      logger.error('Failed to get student by ID', { 
         error: error.message, 
         tenantCode: req.tenantCode,
         studentId: req.params.id 
      });
    
      res.status(500).json(formatErrorResponse(error, 'Failed to retrieve student'));
   }
}

/**
 * Update student
 * PUT /api/students/:id
 */
async function updateStudent(req, res) {
   try {
      const tenantCode = req.tenantCode;
      const studentId = req.params.id;
      const updateData = req.body;

      const student = await studentService.updateStudent(tenantCode, studentId, updateData);

      logger.info('Student updated successfully', { 
         tenantCode, 
         studentId,
         updatedBy: req.user?.id 
      });

      res.json(formatSuccessResponse(student, 'Student updated successfully'));
   } catch (error) {
      logger.error('Failed to update student', { 
         error: error.message, 
         tenantCode: req.tenantCode,
         studentId: req.params.id 
      });
    
      if (error.message.includes('not found')) {
         res.status(404).json(formatErrorResponse(error, 'Student not found'));
      } else {
         res.status(400).json(formatErrorResponse(error, 'Failed to update student'));
      }
   }
}

/**
 * Delete student
 * DELETE /api/students/:id
 */
async function deleteStudent(req, res) {
   try {
      const tenantCode = req.tenantCode;
      const studentId = req.params.id;

      await studentService.deleteStudent(tenantCode, studentId);

      logger.info('Student deleted successfully', { 
         tenantCode, 
         studentId,
         deletedBy: req.user?.id 
      });

      res.json(formatSuccessResponse(null, 'Student deleted successfully'));
   } catch (error) {
      logger.error('Failed to delete student', { 
         error: error.message, 
         tenantCode: req.tenantCode,
         studentId: req.params.id 
      });
    
      if (error.message.includes('not found')) {
         res.status(404).json(formatErrorResponse(error, 'Student not found'));
      } else {
         res.status(500).json(formatErrorResponse(error, 'Failed to delete student'));
      }
   }
}

/**
 * List students with filtering and pagination
 * GET /api/students
 */
async function listStudents(req, res) {
   try {
      const tenantCode = req.tenantCode;
      const query = req.query;

      // Check if this is system admin access (no tenant context)
      if (!tenantCode && req.isSystemAdmin) {
         return res.status(400).json(formatErrorResponse(
            new Error('Tenant context required'),
            'Student data requires tenant context. ' +
            'Please access via tenant subdomain (e.g., demo.localhost:3000)'
         ));
      }

      // Check if tenant context is missing
      if (!tenantCode) {
         return res.status(400).json(formatErrorResponse(
            new Error('Missing tenant context'),
            'Please access this endpoint via tenant subdomain'
         ));
      }

      const result = await studentService.listStudents(tenantCode, query);

      res.json(formatSuccessResponse(
         result.students, 
         'Students retrieved successfully',
         { pagination: result.pagination }
      ));
   } catch (error) {
      logger.error('Failed to list students', { 
         error: error.message, 
         tenantCode: req.tenantCode,
         query: req.query 
      });
    
      res.status(500).json(formatErrorResponse(error, 'Failed to retrieve students'));
   }
}

/**
 * Generate PDF report of students
 * GET /api/students/export/pdf
 */
async function exportStudentsPDF(req, res) {
   try {
      const tenantCode = req.tenantCode;
      const { classId, status, format = 'download' } = req.query;

      // Get students data
      const studentsData = await studentService.getStudentsForExport(tenantCode, {
         classId,
         status
      });

      if (studentsData.students.length === 0) {
         return res.status(404).json(formatErrorResponse(null, 'No students found for export'));
      }

      // Generate PDF
      const pdfPath = await pdfService.generateStudentReport(
         studentsData.students, 
         studentsData.schoolData
      );

      logger.info('Student PDF report generated', { 
         tenantCode, 
         studentCount: studentsData.students.length,
         classId,
         status 
      });

      if (format === 'download') {
      // Download file
         res.download(pdfPath, `students-report-${Date.now()}.pdf`, (err) => {
            if (err) {
               logger.error('PDF download error', err);
            }
            // Cleanup file after download
            setTimeout(() => {
               const fs = require('fs');
               if (fs.existsSync(pdfPath)) {
                  fs.unlinkSync(pdfPath);
               }
            }, 5000);
         });
      } else {
      // Return file path for email attachment or other use
         res.json(formatSuccessResponse(
            { filePath: pdfPath }, 
            'PDF report generated successfully'
         ));
      }

   } catch (error) {
      logger.error('Failed to generate students PDF', { 
         error: error.message, 
         tenantCode: req.tenantCode 
      });
    
      res.status(500).json(formatErrorResponse(error, 'Failed to generate PDF report'));
   }
}

/**
 * Generate Excel export of students
 * GET /api/students/export/excel
 */
async function exportStudentsExcel(req, res) {
   try {
      const tenantCode = req.tenantCode;
      const { classId, status, format = 'download' } = req.query;

      // Get students data
      const studentsData = await studentService.getStudentsForExport(tenantCode, {
         classId,
         status
      });

      if (studentsData.students.length === 0) {
         return res.status(404).json(formatErrorResponse(null, 'No students found for export'));
      }

      // Generate Excel
      const excelPath = await excelService.generateStudentList(
         studentsData.students, 
         studentsData.schoolData
      );

      logger.info('Student Excel report generated', { 
         tenantCode, 
         studentCount: studentsData.students.length,
         classId,
         status 
      });

      if (format === 'download') {
      // Download file
         res.download(excelPath, `students-list-${Date.now()}.xlsx`, (err) => {
            if (err) {
               logger.error('Excel download error', err);
            }
            // Cleanup file after download
            setTimeout(() => {
               const fs = require('fs');
               if (fs.existsSync(excelPath)) {
                  fs.unlinkSync(excelPath);
               }
            }, 5000);
         });
      } else {
      // Return file path
         res.json(formatSuccessResponse(
            { filePath: excelPath }, 
            'Excel report generated successfully'
         ));
      }

   } catch (error) {
      logger.error('Failed to generate students Excel', { 
         error: error.message, 
         tenantCode: req.tenantCode 
      });
    
      res.status(500).json(formatErrorResponse(error, 'Failed to generate Excel report'));
   }
}

/**
 * Send welcome email to student
 * POST /api/students/:id/send-welcome
 */
async function sendWelcomeEmail(req, res) {
   try {
      const tenantCode = req.tenantCode;
      const studentId = req.params.id;
      const { temporaryPassword } = req.body;

      // Get student data
      const student = await studentService.getStudentById(tenantCode, studentId);
      if (!student) {
         return res.status(404).json(formatErrorResponse(null, 'Student not found'));
      }

      // Get school data for email template
      const schoolData = await studentService.getSchoolData(tenantCode);

      // Send welcome email
      const emailResult = await emailService.sendWelcomeEmail(
         student.email,
         student.name || `${student.first_name} ${student.last_name}`,
         temporaryPassword,
         schoolData
      );

      if (emailResult.success) {
         logger.info('Welcome email sent to student', { 
            tenantCode, 
            studentId,
            email: student.email,
            messageId: emailResult.messageId 
         });

         res.json(formatSuccessResponse(
            { messageId: emailResult.messageId }, 
            'Welcome email sent successfully'
         ));
      } else {
         res.status(500).json(formatErrorResponse(
            null, 
            emailResult.reason || 'Failed to send email'
         ));
      }

   } catch (error) {
      logger.error('Failed to send welcome email', { 
         error: error.message, 
         tenantCode: req.tenantCode,
         studentId: req.params.id 
      });
    
      res.status(500).json(formatErrorResponse(error, 'Failed to send welcome email'));
   }
}

/**
 * Send bulk emails to students
 * POST /api/students/send-bulk-email
 */
async function sendBulkEmail(req, res) {
   try {
      const tenantCode = req.tenantCode;
      const { studentIds, message, emailType = 'notification' } = req.body;

      if (!studentIds || studentIds.length === 0) {
         return res.status(400).json(formatErrorResponse(null, 'No students selected'));
      }

      // Get students data
      const students = await studentService.getStudentsByIds(tenantCode, studentIds);
      const schoolData = await studentService.getSchoolData(tenantCode);

      const emailResults = [];
    
      // Send emails to each student
      for (const student of students) {
         try {
            let emailResult;
        
            if (emailType === 'welcome') {
               emailResult = await emailService.sendWelcomeEmail(
                  student.email,
                  student.name || `${student.first_name} ${student.last_name}`,
                  'temp123', // Default temp password
                  schoolData
               );
            } else {
               // For custom notifications, we'd need to create a generic email function
               // For now, using welcome email template
               emailResult = await emailService.sendWelcomeEmail(
                  student.email,
                  student.name || `${student.first_name} ${student.last_name}`,
                  message,
                  schoolData
               );
            }

            emailResults.push({
               studentId: student.id,
               email: student.email,
               success: emailResult.success,
               messageId: emailResult.messageId
            });

         } catch (emailError) {
            logger.error('Individual email failed in bulk send', { 
               studentId: student.id,
               email: student.email,
               error: emailError.message 
            });
        
            emailResults.push({
               studentId: student.id,
               email: student.email,
               success: false,
               error: emailError.message
            });
         }
      }

      const successCount = emailResults.filter(result => result.success).length;

      logger.info('Bulk email completed', { 
         tenantCode, 
         totalStudents: students.length,
         successCount,
         failureCount: students.length - successCount
      });

      res.json(formatSuccessResponse(
         { 
            results: emailResults,
            summary: {
               total: students.length,
               success: successCount,
               failed: students.length - successCount
            }
         }, 
         `Bulk email completed. ${successCount}/${students.length} emails sent successfully`
      ));

   } catch (error) {
      logger.error('Failed to send bulk email', { 
         error: error.message, 
         tenantCode: req.tenantCode 
      });
    
      res.status(500).json(formatErrorResponse(error, 'Failed to send bulk emails'));
   }
}

// Helper function for getting students data (used by controllers)
async function getStudentsData(tenantCode, filters = {}) {
   return await studentService.getStudentsForExport(tenantCode, filters);
}

// Direct function exports (no factory pattern)
module.exports = {
   createStudent,
   getStudentById,
   updateStudent,
   deleteStudent,
   listStudents,
   exportStudentsPDF,
   exportStudentsExcel,
   sendWelcomeEmail,
   sendBulkEmail,
   getStudentsData // Helper for other controllers
};