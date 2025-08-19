const SectionService = require('../services/SectionService');
const logger = require('../../../utils/logger');
const { handleServiceError } = require('../../../utils/errorHandler');

/**
 * Section Controller
 * Handles HTTP requests for section management
 */
class SectionController {
   constructor() {
      this.sectionService = new SectionService();
   }

   /**
    * Create new section
    * POST /sections
    */
   async createSection(req, res) {
      try {
         const { tenantCode } = req.session;
         const sectionData = req.body;
         const createdBy = req.session.userId;

         const result = await this.sectionService.createSection(tenantCode, sectionData, createdBy);

         logger.info('Section Controller Event', {
            controller: 'section-controller',
            category: 'SECTION',
            event: 'Section created successfully',
            tenant_code: tenantCode,
            section_id: result.section.id,
            user_id: req.session.userId,
         });

         res.status(201).json({
            success: true,
            message: 'Section created successfully',
            data: result,
         });
      } catch (error) {
         logger.error('Section Controller Error', {
            controller: 'section-controller',
            category: 'SECTION',
            event: 'Section creation failed',
            tenant_code: req.session?.tenantCode,
            user_id: req.session?.userId,
            error: error.message,
         });

         const { statusCode, errorResponse } = handleServiceError(error);
         res.status(statusCode).json(errorResponse);
      }
   }

   /**
    * Get sections by class
    * GET /sections/class/:classId
    */
   async getSectionsByClass(req, res) {
      try {
         const { tenantCode } = req.session;
         const { classId } = req.params;
         const { status } = req.query;

         const result = await this.sectionService.getSectionsByClass(tenantCode, classId, { status });

         logger.info('Section Controller Event', {
            controller: 'section-controller',
            category: 'SECTION',
            event: 'Sections retrieved successfully',
            tenant_code: tenantCode,
            class_id: classId,
            count: result.sections.length,
            user_id: req.session.userId,
         });

         res.status(200).json({
            success: true,
            message: 'Sections retrieved successfully',
            data: result,
         });
      } catch (error) {
         logger.error('Section Controller Error', {
            controller: 'section-controller',
            category: 'SECTION',
            event: 'Sections retrieval failed',
            tenant_code: req.session?.tenantCode,
            class_id: req.params?.classId,
            user_id: req.session?.userId,
            error: error.message,
         });

         const { statusCode, errorResponse } = handleServiceError(error);
         res.status(statusCode).json(errorResponse);
      }
   }

   /**
    * Get section by ID
    * GET /sections/:id
    */
   async getSectionById(req, res) {
      try {
         const { tenantCode } = req.session;
         const { id } = req.params;

         const result = await this.sectionService.getSectionById(tenantCode, id);

         logger.info('Section Controller Event', {
            controller: 'section-controller',
            category: 'SECTION',
            event: 'Section retrieved successfully',
            tenant_code: tenantCode,
            section_id: id,
            user_id: req.session.userId,
         });

         res.status(200).json({
            success: true,
            message: 'Section retrieved successfully',
            data: result,
         });
      } catch (error) {
         logger.error('Section Controller Error', {
            controller: 'section-controller',
            category: 'SECTION',
            event: 'Section retrieval failed',
            tenant_code: req.session?.tenantCode,
            section_id: req.params?.id,
            user_id: req.session?.userId,
            error: error.message,
         });

         const { statusCode, errorResponse } = handleServiceError(error);
         res.status(statusCode).json(errorResponse);
      }
   }

   /**
    * Update section
    * PUT /sections/:id
    */
   async updateSection(req, res) {
      try {
         const { tenantCode } = req.session;
         const { id } = req.params;
         const sectionData = req.body;
         const updatedBy = req.session.userId;

         const result = await this.sectionService.updateSection(tenantCode, id, sectionData, updatedBy);

         logger.info('Section Controller Event', {
            controller: 'section-controller',
            category: 'SECTION',
            event: 'Section updated successfully',
            tenant_code: tenantCode,
            section_id: id,
            user_id: req.session.userId,
         });

         res.status(200).json({
            success: true,
            message: 'Section updated successfully',
            data: result,
         });
      } catch (error) {
         logger.error('Section Controller Error', {
            controller: 'section-controller',
            category: 'SECTION',
            event: 'Section update failed',
            tenant_code: req.session?.tenantCode,
            section_id: req.params?.id,
            user_id: req.session?.userId,
            error: error.message,
         });

         const { statusCode, errorResponse } = handleServiceError(error);
         res.status(statusCode).json(errorResponse);
      }
   }

   /**
    * Delete section
    * DELETE /sections/:id
    */
   async deleteSection(req, res) {
      try {
         const { tenantCode } = req.session;
         const { id } = req.params;
         const deletedBy = req.session.userId;

         const result = await this.sectionService.deleteSection(tenantCode, id, deletedBy);

         logger.info('Section Controller Event', {
            controller: 'section-controller',
            category: 'SECTION',
            event: 'Section deleted successfully',
            tenant_code: tenantCode,
            section_id: id,
            user_id: req.session.userId,
         });

         res.status(200).json({
            success: true,
            message: 'Section deleted successfully',
            data: result,
         });
      } catch (error) {
         logger.error('Section Controller Error', {
            controller: 'section-controller',
            category: 'SECTION',
            event: 'Section deletion failed',
            tenant_code: req.session?.tenantCode,
            section_id: req.params?.id,
            user_id: req.session?.userId,
            error: error.message,
         });

         const { statusCode, errorResponse } = handleServiceError(error);
         res.status(statusCode).json(errorResponse);
      }
   }

   /**
    * Bulk create sections for a class
    * POST /sections/bulk/:classId
    */
   async bulkCreateSections(req, res) {
      try {
         const { tenantCode } = req.session;
         const { classId } = req.params;
         const { sectionNames } = req.body;
         const createdBy = req.session.userId;

         const result = await this.sectionService.bulkCreateSections(tenantCode, classId, sectionNames, createdBy);

         logger.info('Section Controller Event', {
            controller: 'section-controller',
            category: 'SECTION',
            event: 'Sections bulk created successfully',
            tenant_code: tenantCode,
            class_id: classId,
            count: result.sections.length,
            user_id: req.session.userId,
         });

         res.status(201).json({
            success: true,
            message: 'Sections created successfully',
            data: result,
         });
      } catch (error) {
         logger.error('Section Controller Error', {
            controller: 'section-controller',
            category: 'SECTION',
            event: 'Sections bulk creation failed',
            tenant_code: req.session?.tenantCode,
            class_id: req.params?.classId,
            user_id: req.session?.userId,
            error: error.message,
         });

         const { statusCode, errorResponse } = handleServiceError(error);
         res.status(statusCode).json(errorResponse);
      }
   }
}

module.exports = SectionController;
