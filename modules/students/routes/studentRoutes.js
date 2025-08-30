const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { validateBody, validateQuery, validateParams } = require('../../../utils/validation');
const {
   createStudentSchema,
   updateStudentSchema,
   queryStudentSchema,
   transferStudentSchema,
   graduateStudentSchema,
   bulkStudentSchema,
} = require('../../../models/student/StudentValidation');
const { commonSchemas } = require('../../../utils/validation');

/**
 * Student Routes - Simple and clean with integrated features
 * Includes validation, PDF export, Excel export, and email functionality
 */

// Validation schemas for common operations
const idParamSchema = require('joi').object({
   id: commonSchemas.id,
});

const studentQuerySchema = require('joi').object({
   page: commonSchemas.pagination.page,
   limit: commonSchemas.pagination.limit,
   classId: require('joi').number().integer().positive().optional(),
   sectionId: require('joi').number().integer().positive().optional(),
   status: require('joi').string().valid('ACTIVE', 'INACTIVE', 'TRANSFERRED', 'GRADUATED').optional(),
   search: require('joi').string().max(100).optional(),
   sortBy: require('joi').string().default('created_at'),
   sortOrder: commonSchemas.pagination.sortOrder,
});

const exportQuerySchema = require('joi').object({
   classId: require('joi').number().integer().positive().optional(),
   status: require('joi').string().valid('ACTIVE', 'INACTIVE', 'TRANSFERRED', 'GRADUATED').optional(),
   format: require('joi').string().valid('download', 'path').default('download'),
});

const welcomeEmailSchema = require('joi').object({
   temporaryPassword: require('joi').string().min(6).max(20).required(),
});

const bulkEmailSchema = require('joi').object({
   studentIds: require('joi').array().items(require('joi').number().integer().positive()).min(1).required(),
   subject: require('joi').string().max(200).optional(),
   message: require('joi').string().max(1000).optional(),
   emailType: require('joi').string().valid('welcome', 'notification').default('notification'),
});

// Basic CRUD routes
router.get('/', validateQuery(queryStudentSchema), studentController.listStudents);

router.post('/', validateBody(createStudentSchema), studentController.createStudent);

router.get('/:id', validateParams(idParamSchema), studentController.getStudentById);

router.put('/:id', validateParams(idParamSchema), validateBody(updateStudentSchema), studentController.updateStudent);

router.delete('/:id', validateParams(idParamSchema), studentController.deleteStudent);

// Export routes - PDF
router.get('/export/pdf', validateQuery(exportQuerySchema), studentController.exportStudentsPDF);

// Export routes - Excel
router.get('/export/excel', validateQuery(exportQuerySchema), studentController.exportStudentsExcel);

// Email routes
router.post(
   '/:id/send-welcome',
   validateParams(idParamSchema),
   validateBody(welcomeEmailSchema),
   studentController.sendWelcomeEmail
);

router.post('/send-bulk-email', validateBody(bulkEmailSchema), studentController.sendBulkEmail);

module.exports = router;
