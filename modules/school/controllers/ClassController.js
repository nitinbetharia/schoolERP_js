const ClassService = require('../services/ClassService');
const logger = require('../../../utils/logger');
const { handleServiceError } = require('../../../utils/errorHandler');

/**
 * Class Controller
 * Handles HTTP requests for class management
 */
class ClassController {
   constructor() {
      this.classService = new ClassService();
   }

   /**
    * Create new class
    * POST /classes
    */
   async createClass(req, res) {
      try {
         const { tenantCode } = req.session;
         const classData = req.body;
         const createdBy = req.session.userId;

         const result = await this.classService.createClass(tenantCode, classData, createdBy);

         logger.info('Class Controller Event', {
            controller: 'class-controller',
            category: 'CLASS',
            event: 'Class created successfully',
            tenant_code: tenantCode,
            class_id: result.class.id,
            user_id: req.session.userId,
         });

         res.status(201).json({
            success: true,
            message: 'Class created successfully',
            data: result,
         });
      } catch (error) {
         logger.error('Class Controller Error', {
            controller: 'class-controller',
            category: 'CLASS',
            event: 'Class creation failed',
            tenant_code: req.session?.tenantCode,
            user_id: req.session?.userId,
            error: error.message,
         });

         const { statusCode, errorResponse } = handleServiceError(error);
         res.status(statusCode).json(errorResponse);
      }
   }

   /**
    * Get classes by school
    * GET /classes/school/:schoolId
    */
   async getClassesBySchool(req, res) {
      try {
         const { tenantCode } = req.session;
         const { schoolId } = req.params;
         const { standard, status } = req.query;

         const result = await this.classService.getClassesBySchool(tenantCode, schoolId, { standard, status });

         logger.info('Class Controller Event', {
            controller: 'class-controller',
            category: 'CLASS',
            event: 'Classes retrieved successfully',
            tenant_code: tenantCode,
            school_id: schoolId,
            count: result.classes.length,
            user_id: req.session.userId,
         });

         res.status(200).json({
            success: true,
            message: 'Classes retrieved successfully',
            data: result,
         });
      } catch (error) {
         logger.error('Class Controller Error', {
            controller: 'class-controller',
            category: 'CLASS',
            event: 'Classes retrieval failed',
            tenant_code: req.session?.tenantCode,
            school_id: req.params?.schoolId,
            user_id: req.session?.userId,
            error: error.message,
         });

         const { statusCode, errorResponse } = handleServiceError(error);
         res.status(statusCode).json(errorResponse);
      }
   }

   /**
    * Get class by ID
    * GET /classes/:id
    */
   async getClassById(req, res) {
      try {
         const { tenantCode } = req.session;
         const { id } = req.params;

         const result = await this.classService.getClassById(tenantCode, id);

         logger.info('Class Controller Event', {
            controller: 'class-controller',
            category: 'CLASS',
            event: 'Class retrieved successfully',
            tenant_code: tenantCode,
            class_id: id,
            user_id: req.session.userId,
         });

         res.status(200).json({
            success: true,
            message: 'Class retrieved successfully',
            data: result,
         });
      } catch (error) {
         logger.error('Class Controller Error', {
            controller: 'class-controller',
            category: 'CLASS',
            event: 'Class retrieval failed',
            tenant_code: req.session?.tenantCode,
            class_id: req.params?.id,
            user_id: req.session?.userId,
            error: error.message,
         });

         const { statusCode, errorResponse } = handleServiceError(error);
         res.status(statusCode).json(errorResponse);
      }
   }

   /**
    * Update class
    * PUT /classes/:id
    */
   async updateClass(req, res) {
      try {
         const { tenantCode } = req.session;
         const { id } = req.params;
         const classData = req.body;
         const updatedBy = req.session.userId;

         const result = await this.classService.updateClass(tenantCode, id, classData, updatedBy);

         logger.info('Class Controller Event', {
            controller: 'class-controller',
            category: 'CLASS',
            event: 'Class updated successfully',
            tenant_code: tenantCode,
            class_id: id,
            user_id: req.session.userId,
         });

         res.status(200).json({
            success: true,
            message: 'Class updated successfully',
            data: result,
         });
      } catch (error) {
         logger.error('Class Controller Error', {
            controller: 'class-controller',
            category: 'CLASS',
            event: 'Class update failed',
            tenant_code: req.session?.tenantCode,
            class_id: req.params?.id,
            user_id: req.session?.userId,
            error: error.message,
         });

         const { statusCode, errorResponse } = handleServiceError(error);
         res.status(statusCode).json(errorResponse);
      }
   }

   /**
    * Delete class
    * DELETE /classes/:id
    */
   async deleteClass(req, res) {
      try {
         const { tenantCode } = req.session;
         const { id } = req.params;
         const deletedBy = req.session.userId;

         const result = await this.classService.deleteClass(tenantCode, id, deletedBy);

         logger.info('Class Controller Event', {
            controller: 'class-controller',
            category: 'CLASS',
            event: 'Class deleted successfully',
            tenant_code: tenantCode,
            class_id: id,
            user_id: req.session.userId,
         });

         res.status(200).json({
            success: true,
            message: 'Class deleted successfully',
            data: result,
         });
      } catch (error) {
         logger.error('Class Controller Error', {
            controller: 'class-controller',
            category: 'CLASS',
            event: 'Class deletion failed',
            tenant_code: req.session?.tenantCode,
            class_id: req.params?.id,
            user_id: req.session?.userId,
            error: error.message,
         });

         const { statusCode, errorResponse } = handleServiceError(error);
         res.status(statusCode).json(errorResponse);
      }
   }

   /**
    * Get class statistics
    * GET /classes/:id/stats
    */
   async getClassStats(req, res) {
      try {
         const { tenantCode } = req.session;
         const { id } = req.params;

         const result = await this.classService.getClassStats(tenantCode, id);

         logger.info('Class Controller Event', {
            controller: 'class-controller',
            category: 'CLASS',
            event: 'Class stats retrieved successfully',
            tenant_code: tenantCode,
            class_id: id,
            user_id: req.session.userId,
         });

         res.status(200).json({
            success: true,
            message: 'Class statistics retrieved successfully',
            data: result,
         });
      } catch (error) {
         logger.error('Class Controller Error', {
            controller: 'class-controller',
            category: 'CLASS',
            event: 'Class stats retrieval failed',
            tenant_code: req.session?.tenantCode,
            class_id: req.params?.id,
            user_id: req.session?.userId,
            error: error.message,
         });

         const { statusCode, errorResponse } = handleServiceError(error);
         res.status(statusCode).json(errorResponse);
      }
   }

   /**
    * Bulk create classes for a school
    * POST /classes/bulk/:schoolId
    */
   async bulkCreateClasses(req, res) {
      try {
         const { tenantCode } = req.session;
         const { schoolId } = req.params;
         const { standards } = req.body;
         const createdBy = req.session.userId;

         const result = await this.classService.bulkCreateClasses(tenantCode, schoolId, standards, createdBy);

         logger.info('Class Controller Event', {
            controller: 'class-controller',
            category: 'CLASS',
            event: 'Classes bulk created successfully',
            tenant_code: tenantCode,
            school_id: schoolId,
            count: result.classes.length,
            user_id: req.session.userId,
         });

         res.status(201).json({
            success: true,
            message: 'Classes created successfully',
            data: result,
         });
      } catch (error) {
         logger.error('Class Controller Error', {
            controller: 'class-controller',
            category: 'CLASS',
            event: 'Classes bulk creation failed',
            tenant_code: req.session?.tenantCode,
            school_id: req.params?.schoolId,
            user_id: req.session?.userId,
            error: error.message,
         });

         const { statusCode, errorResponse } = handleServiceError(error);
         res.status(statusCode).json(errorResponse);
      }
   }
}

module.exports = ClassController;
