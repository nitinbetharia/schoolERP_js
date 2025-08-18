const express = require('express');
const router = express.Router();
const studentService = require('../modules/student/student-service');
const workflowEngine = require('../modules/student/workflow-engine');
const validationMiddleware = require('../middleware/validation-middleware');
const authMiddleware = require('../middleware/auth-middleware');
const errorHandler = require('../middleware/error-handler');

// Create new student admission
router.post('/admissions',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('students', 'create'),
  validationMiddleware.validate('student.createAdmission'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const admissionData = req.body;
      const createdBy = req.session.userId;
      
      const result = await studentService.createAdmission(admissionData, createdBy, req.trustCode);
      
      res.success(result, 'Student admission created successfully');
    } catch (error) {
      res.error(error.message, 'ADMISSION_CREATION_FAILED', 400);
    }
  })
);

// Get admissions with filters
router.get('/admissions',
  authMiddleware.requirePermission('students', 'read'),
  validationMiddleware.validateQuery('student.listAdmissions'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const filters = req.query;
      const userRole = req.session.userRole;
      const userId = req.session.userId;
      
      const admissions = await studentService.getAdmissions(filters, userRole, userId, req.trustCode);
      
      res.success(admissions, 'Admissions retrieved successfully');
    } catch (error) {
      res.error(error.message, 'ADMISSIONS_FETCH_FAILED', 500);
    }
  })
);

// Get admission by ID
router.get('/admissions/:admissionId',
  authMiddleware.requirePermission('students', 'read'),
  validationMiddleware.validateParams('student.admissionId'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { admissionId } = req.params;
      
      const admission = await studentService.getAdmissionById(admissionId, req.trustCode);
      
      res.success(admission, 'Admission retrieved successfully');
    } catch (error) {
      res.error(error.message, 'ADMISSION_FETCH_FAILED', 404);
    }
  })
);

// Update admission
router.put('/admissions/:admissionId',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('students', 'update'),
  validationMiddleware.validateParams('student.admissionId'),
  validationMiddleware.validate('student.updateAdmission'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { admissionId } = req.params;
      const updateData = req.body;
      const updatedBy = req.session.userId;
      
      const result = await studentService.updateAdmission(admissionId, updateData, updatedBy, req.trustCode);
      
      res.success(result, 'Admission updated successfully');
    } catch (error) {
      res.error(error.message, 'ADMISSION_UPDATE_FAILED', 400);
    }
  })
);

// Process admission workflow
router.post('/admissions/:admissionId/workflow/:action',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('students', 'update'),
  validationMiddleware.validateParams('student.workflowAction'),
  validationMiddleware.validate('student.workflowData'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { admissionId, action } = req.params;
      const workflowData = req.body;
      const processedBy = req.session.userId;
      
      const result = await workflowEngine.processWorkflow('admission', admissionId, action, workflowData, processedBy, req.trustCode);
      
      res.success(result, `Admission ${action} processed successfully`);
    } catch (error) {
      res.error(error.message, 'WORKFLOW_PROCESSING_FAILED', 400);
    }
  })
);

// Create student (after admission approval)
router.post('/',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('students', 'create'),
  validationMiddleware.validate('student.create'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const studentData = req.body;
      const createdBy = req.session.userId;
      
      const result = await studentService.createStudent(studentData, createdBy, req.trustCode);
      
      res.success(result, 'Student created successfully');
    } catch (error) {
      res.error(error.message, 'STUDENT_CREATION_FAILED', 400);
    }
  })
);

// Get all students with filters
router.get('/',
  authMiddleware.requirePermission('students', 'read'),
  validationMiddleware.validateQuery('student.list'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const filters = req.query;
      const userRole = req.session.userRole;
      const userId = req.session.userId;
      
      const students = await studentService.getStudents(filters, userRole, userId, req.trustCode);
      
      res.success(students, 'Students retrieved successfully');
    } catch (error) {
      res.error(error.message, 'STUDENTS_FETCH_FAILED', 500);
    }
  })
);

// Get student by ID
router.get('/:studentId',
  authMiddleware.requirePermission('students', 'read'),
  validationMiddleware.validateParams('student.id'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { studentId } = req.params;
      const userRole = req.session.userRole;
      const userId = req.session.userId;
      
      const student = await studentService.getStudentById(studentId, userRole, userId, req.trustCode);
      
      res.success(student, 'Student retrieved successfully');
    } catch (error) {
      res.error(error.message, 'STUDENT_FETCH_FAILED', 404);
    }
  })
);

// Update student
router.put('/:studentId',
  authMiddleware.requirePermission('students', 'update'),
  validationMiddleware.validateParams('student.id'),
  validationMiddleware.validate('student.update'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { studentId } = req.params;
      const updateData = req.body;
      const updatedBy = req.session.userId;
      const userRole = req.session.userRole;
      
      const result = await studentService.updateStudent(studentId, updateData, updatedBy, userRole, req.trustCode);
      
      res.success(result, 'Student updated successfully');
    } catch (error) {
      res.error(error.message, 'STUDENT_UPDATE_FAILED', 400);
    }
  })
);

// Delete student (soft delete)
router.delete('/:studentId',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('students', 'delete'),
  validationMiddleware.validateParams('student.id'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { studentId } = req.params;
      const deletedBy = req.session.userId;
      
      const result = await studentService.deleteStudent(studentId, deletedBy, req.trustCode);
      
      res.success(result, 'Student deleted successfully');
    } catch (error) {
      res.error(error.message, 'STUDENT_DELETION_FAILED', 400);
    }
  })
);

// Transfer student
router.post('/:studentId/transfer',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('students', 'update'),
  validationMiddleware.validateParams('student.id'),
  validationMiddleware.validate('student.transfer'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { studentId } = req.params;
      const transferData = req.body;
      const processedBy = req.session.userId;
      
      const result = await studentService.transferStudent(studentId, transferData, processedBy, req.trustCode);
      
      res.success(result, 'Student transfer initiated successfully');
    } catch (error) {
      res.error(error.message, 'STUDENT_TRANSFER_FAILED', 400);
    }
  })
);

// Promote student
router.post('/:studentId/promote',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('students', 'update'),
  validationMiddleware.validateParams('student.id'),
  validationMiddleware.validate('student.promote'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { studentId } = req.params;
      const promotionData = req.body;
      const processedBy = req.session.userId;
      
      const result = await studentService.promoteStudent(studentId, promotionData, processedBy, req.trustCode);
      
      res.success(result, 'Student promoted successfully');
    } catch (error) {
      res.error(error.message, 'STUDENT_PROMOTION_FAILED', 400);
    }
  })
);

// Add parent to student
router.post('/:studentId/parents',
  authMiddleware.requirePermission('students', 'update'),
  validationMiddleware.validateParams('student.id'),
  validationMiddleware.validate('student.addParent'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { studentId } = req.params;
      const parentData = req.body;
      const addedBy = req.session.userId;
      
      const result = await studentService.addParent(studentId, parentData, addedBy, req.trustCode);
      
      res.success(result, 'Parent added to student successfully');
    } catch (error) {
      res.error(error.message, 'PARENT_ADDITION_FAILED', 400);
    }
  })
);

// Get student parents
router.get('/:studentId/parents',
  authMiddleware.requirePermission('students', 'read'),
  validationMiddleware.validateParams('student.id'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { studentId } = req.params;
      
      const parents = await studentService.getStudentParents(studentId, req.trustCode);
      
      res.success(parents, 'Student parents retrieved successfully');
    } catch (error) {
      res.error(error.message, 'PARENTS_FETCH_FAILED', 500);
    }
  })
);

// Remove parent from student
router.delete('/:studentId/parents/:parentId',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('students', 'update'),
  validationMiddleware.validateParams('student.parentAssignment'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { studentId, parentId } = req.params;
      const removedBy = req.session.userId;
      
      const result = await studentService.removeParent(studentId, parentId, removedBy, req.trustCode);
      
      res.success(result, 'Parent removed from student successfully');
    } catch (error) {
      res.error(error.message, 'PARENT_REMOVAL_FAILED', 400);
    }
  })
);

// Bulk operations
router.post('/bulk/promote',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('students', 'update'),
  validationMiddleware.validate('student.bulkPromote'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { student_ids, promotion_data } = req.body;
      const processedBy = req.session.userId;
      
      const result = await studentService.bulkPromoteStudents(student_ids, promotion_data, processedBy, req.trustCode);
      
      res.success(result, 'Bulk student promotion completed');
    } catch (error) {
      res.error(error.message, 'BULK_PROMOTION_FAILED', 400);
    }
  })
);

// Get student statistics
router.get('/stats/overview',
  authMiddleware.requirePermission('students', 'read'),
  validationMiddleware.validateQuery('student.statsFilters'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const filters = req.query;
      const userRole = req.session.userRole;
      const userId = req.session.userId;
      
      const stats = await studentService.getStudentStats(filters, userRole, userId, req.trustCode);
      
      res.success(stats, 'Student statistics retrieved successfully');
    } catch (error) {
      res.error(error.message, 'STATS_FETCH_FAILED', 500);
    }
  })
);

// Export students data
router.get('/export/:format',
  authMiddleware.requirePermission('students', 'read'),
  validationMiddleware.validateParams('common.exportFormat'),
  validationMiddleware.validateQuery('student.export'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { format } = req.params;
      const filters = req.query;
      const userRole = req.session.userRole;
      const userId = req.session.userId;
      
      const result = await studentService.exportStudents(format, filters, userRole, userId, req.trustCode);
      
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.data);
      
    } catch (error) {
      res.error(error.message, 'EXPORT_FAILED', 500);
    }
  })
);

// Get student history
router.get('/:studentId/history',
  authMiddleware.requirePermission('students', 'read'),
  validationMiddleware.validateParams('student.id'),
  validationMiddleware.validateQuery('student.historyFilters'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { studentId } = req.params;
      const filters = req.query;
      
      const history = await studentService.getStudentHistory(studentId, filters, req.trustCode);
      
      res.success(history, 'Student history retrieved successfully');
    } catch (error) {
      res.error(error.message, 'HISTORY_FETCH_FAILED', 500);
    }
  })
);

// Upload student photo
router.post('/:studentId/photo',
  authMiddleware.requirePermission('students', 'update'),
  validationMiddleware.validateParams('student.id'),
  validationMiddleware.validateFileUpload({
    required: true,
    fields: {
      photo: {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        allowedExtensions: ['jpg', 'jpeg', 'png', 'webp']
      }
    }
  }),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { studentId } = req.params;
      const photoFile = req.files.photo;
      const uploadedBy = req.session.userId;
      
      const result = await studentService.uploadStudentPhoto(studentId, photoFile, uploadedBy, req.trustCode);
      
      res.success(result, 'Student photo uploaded successfully');
    } catch (error) {
      res.error(error.message, 'PHOTO_UPLOAD_FAILED', 400);
    }
  })
);

module.exports = router;