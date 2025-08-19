const SchoolService = require('../services/SchoolService');
const { ValidationError, NotFoundError, DuplicateError } = require('../../../utils/errors');
const logger = require('../../../utils/logger');

/**
 * School Controller
 * Handles HTTP requests for school management
 */
class SchoolController {
   constructor() {
      this.schoolService = new SchoolService();
   }

   /**
    * Create a new school
    */
   async createSchool(req, res) {
      try {
         const tenantCode = req.tenantCode;
         const schoolData = req.body;
         const createdBy = req.user ? req.user.id : null;

         // Basic validation
         if (!schoolData.name) {
            throw new ValidationError('School name is required');
         }

         if (!schoolData.code) {
            throw new ValidationError('School code is required');
         }

         const result = await this.schoolService.createSchool(tenantCode, schoolData, createdBy);

         logger.info('School Controller Event', {
            service: 'school-controller',
            category: 'SCHOOL',
            event: 'School creation request processed',
            tenant_code: tenantCode,
            school_code: schoolData.code,
            created_by: createdBy,
         });

         res.status(201).json({
            success: true,
            data: result,
            message: 'School created successfully',
         });
      } catch (error) {
         logger.error('School Controller Error', {
            service: 'school-controller',
            category: 'SCHOOL',
            event: 'School creation failed',
            tenant_code: req.tenantCode,
            error: error.message,
         });

         if (error instanceof ValidationError) {
            return res.status(400).json({
               success: false,
               error: {
                  code: 'VALIDATION_ERROR',
                  message: error.message,
                  timestamp: new Date().toISOString(),
               },
            });
         }

         if (error instanceof DuplicateError) {
            return res.status(409).json({
               success: false,
               error: {
                  code: 'DUPLICATE_ERROR',
                  message: error.message,
                  timestamp: new Date().toISOString(),
               },
            });
         }

         res.status(500).json({
            success: false,
            error: {
               code: 'INTERNAL_SERVER_ERROR',
               message: 'An unexpected error occurred',
               timestamp: new Date().toISOString(),
            },
         });
      }
   }

   /**
    * Get all schools
    */
   async getSchools(req, res) {
      try {
         const tenantCode = req.tenantCode;
         const options = {
            page: req.query.page || 1,
            limit: req.query.limit || 50,
            status: req.query.status,
            type: req.query.type,
         };

         const result = await this.schoolService.getSchools(tenantCode, options);

         logger.info('School Controller Event', {
            service: 'school-controller',
            category: 'SCHOOL',
            event: 'Schools list request processed',
            tenant_code: tenantCode,
            count: result.schools.length,
         });

         res.json({
            success: true,
            data: result,
            message: 'Schools retrieved successfully',
         });
      } catch (error) {
         logger.error('School Controller Error', {
            service: 'school-controller',
            category: 'SCHOOL',
            event: 'Schools retrieval failed',
            tenant_code: req.tenantCode,
            error: error.message,
         });

         res.status(500).json({
            success: false,
            error: {
               code: 'INTERNAL_SERVER_ERROR',
               message: 'An unexpected error occurred',
               timestamp: new Date().toISOString(),
            },
         });
      }
   }

   /**
    * Get school by ID
    */
   async getSchoolById(req, res) {
      try {
         const tenantCode = req.tenantCode;
         const schoolId = req.params.id;

         if (!schoolId || isNaN(schoolId)) {
            throw new ValidationError('Valid school ID is required');
         }

         const result = await this.schoolService.getSchoolById(tenantCode, schoolId);

         logger.info('School Controller Event', {
            service: 'school-controller',
            category: 'SCHOOL',
            event: 'School details request processed',
            tenant_code: tenantCode,
            school_id: schoolId,
         });

         res.json({
            success: true,
            data: result,
            message: 'School retrieved successfully',
         });
      } catch (error) {
         logger.error('School Controller Error', {
            service: 'school-controller',
            category: 'SCHOOL',
            event: 'School retrieval failed',
            tenant_code: req.tenantCode,
            school_id: req.params.id,
            error: error.message,
         });

         if (error instanceof ValidationError) {
            return res.status(400).json({
               success: false,
               error: {
                  code: 'VALIDATION_ERROR',
                  message: error.message,
                  timestamp: new Date().toISOString(),
               },
            });
         }

         if (error instanceof NotFoundError) {
            return res.status(404).json({
               success: false,
               error: {
                  code: 'NOT_FOUND',
                  message: error.message,
                  timestamp: new Date().toISOString(),
               },
            });
         }

         res.status(500).json({
            success: false,
            error: {
               code: 'INTERNAL_SERVER_ERROR',
               message: 'An unexpected error occurred',
               timestamp: new Date().toISOString(),
            },
         });
      }
   }

   /**
    * Update school
    */
   async updateSchool(req, res) {
      try {
         const tenantCode = req.tenantCode;
         const schoolId = req.params.id;
         const schoolData = req.body;
         const updatedBy = req.user ? req.user.id : null;

         if (!schoolId || isNaN(schoolId)) {
            throw new ValidationError('Valid school ID is required');
         }

         const result = await this.schoolService.updateSchool(tenantCode, schoolId, schoolData, updatedBy);

         logger.info('School Controller Event', {
            service: 'school-controller',
            category: 'SCHOOL',
            event: 'School update request processed',
            tenant_code: tenantCode,
            school_id: schoolId,
            updated_by: updatedBy,
         });

         res.json({
            success: true,
            data: result,
            message: 'School updated successfully',
         });
      } catch (error) {
         logger.error('School Controller Error', {
            service: 'school-controller',
            category: 'SCHOOL',
            event: 'School update failed',
            tenant_code: req.tenantCode,
            school_id: req.params.id,
            error: error.message,
         });

         if (error instanceof ValidationError) {
            return res.status(400).json({
               success: false,
               error: {
                  code: 'VALIDATION_ERROR',
                  message: error.message,
                  timestamp: new Date().toISOString(),
               },
            });
         }

         if (error instanceof NotFoundError) {
            return res.status(404).json({
               success: false,
               error: {
                  code: 'NOT_FOUND',
                  message: error.message,
                  timestamp: new Date().toISOString(),
               },
            });
         }

         if (error instanceof DuplicateError) {
            return res.status(409).json({
               success: false,
               error: {
                  code: 'DUPLICATE_ERROR',
                  message: error.message,
                  timestamp: new Date().toISOString(),
               },
            });
         }

         res.status(500).json({
            success: false,
            error: {
               code: 'INTERNAL_SERVER_ERROR',
               message: 'An unexpected error occurred',
               timestamp: new Date().toISOString(),
            },
         });
      }
   }

   /**
    * Delete school
    */
   async deleteSchool(req, res) {
      try {
         const tenantCode = req.tenantCode;
         const schoolId = req.params.id;
         const deletedBy = req.user ? req.user.id : null;

         if (!schoolId || isNaN(schoolId)) {
            throw new ValidationError('Valid school ID is required');
         }

         const result = await this.schoolService.deleteSchool(tenantCode, schoolId, deletedBy);

         logger.info('School Controller Event', {
            service: 'school-controller',
            category: 'SCHOOL',
            event: 'School deletion request processed',
            tenant_code: tenantCode,
            school_id: schoolId,
            deleted_by: deletedBy,
         });

         res.json({
            success: true,
            data: result,
            message: 'School deleted successfully',
         });
      } catch (error) {
         logger.error('School Controller Error', {
            service: 'school-controller',
            category: 'SCHOOL',
            event: 'School deletion failed',
            tenant_code: req.tenantCode,
            school_id: req.params.id,
            error: error.message,
         });

         if (error instanceof ValidationError) {
            return res.status(400).json({
               success: false,
               error: {
                  code: 'VALIDATION_ERROR',
                  message: error.message,
                  timestamp: new Date().toISOString(),
               },
            });
         }

         if (error instanceof NotFoundError) {
            return res.status(404).json({
               success: false,
               error: {
                  code: 'NOT_FOUND',
                  message: error.message,
                  timestamp: new Date().toISOString(),
               },
            });
         }

         res.status(500).json({
            success: false,
            error: {
               code: 'INTERNAL_SERVER_ERROR',
               message: 'An unexpected error occurred',
               timestamp: new Date().toISOString(),
            },
         });
      }
   }

   /**
    * Get school statistics
    */
   async getSchoolStats(req, res) {
      try {
         const tenantCode = req.tenantCode;
         const schoolId = req.params.id;

         if (!schoolId || isNaN(schoolId)) {
            throw new ValidationError('Valid school ID is required');
         }

         const result = await this.schoolService.getSchoolStats(tenantCode, schoolId);

         logger.info('School Controller Event', {
            service: 'school-controller',
            category: 'SCHOOL',
            event: 'School statistics request processed',
            tenant_code: tenantCode,
            school_id: schoolId,
         });

         res.json({
            success: true,
            data: result,
            message: 'School statistics retrieved successfully',
         });
      } catch (error) {
         logger.error('School Controller Error', {
            service: 'school-controller',
            category: 'SCHOOL',
            event: 'School statistics retrieval failed',
            tenant_code: req.tenantCode,
            school_id: req.params.id,
            error: error.message,
         });

         if (error instanceof ValidationError) {
            return res.status(400).json({
               success: false,
               error: {
                  code: 'VALIDATION_ERROR',
                  message: error.message,
                  timestamp: new Date().toISOString(),
               },
            });
         }

         if (error instanceof NotFoundError) {
            return res.status(404).json({
               success: false,
               error: {
                  code: 'NOT_FOUND',
                  message: error.message,
                  timestamp: new Date().toISOString(),
               },
            });
         }

         res.status(500).json({
            success: false,
            error: {
               code: 'INTERNAL_SERVER_ERROR',
               message: 'An unexpected error occurred',
               timestamp: new Date().toISOString(),
            },
         });
      }
   }
}

module.exports = SchoolController;
