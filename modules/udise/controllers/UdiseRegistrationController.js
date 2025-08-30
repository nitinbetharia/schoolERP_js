const { logError } = require('../../../utils/logger');
const createUdiseService = require('../services/UdiseService');

/**
 * UDISE Registration Controller
 * Handles HTTP requests for UDISE school registration operations
 */

/**
 * Create new UDISE school registration
 * POST /api/v1/udise/registration
 */
async function createRegistration(req, res, next) {
   try {
      const { tenantCode } = req.user;
      const { school_id } = req.body;
      const createdBy = req.user.user_id || req.user.email;
      const UdiseService = createUdiseService();

      // Validate required fields
      if (!school_id) {
         return res.status(400).json({
            success: false,
            message: 'school_id is required',
         });
      }

      const registration = await UdiseService.registration.createRegistration(
         tenantCode,
         school_id,
         req.body,
         createdBy
      );

      res.status(201).json({
         success: true,
         message: 'UDISE registration created successfully',
         data: registration,
      });
   } catch (error) {
      logError(error, {
         context: 'UdiseRegistrationController.createRegistration',
         user: req.user,
      });
      next(error);
   }
}

/**
 * Update UDISE registration
 * PUT /api/v1/udise/registration/:id
 */
async function updateRegistration(req, res, next) {
   try {
      const { tenantCode } = req.user;
      const { id } = req.params;
      const updatedBy = req.user.user_id || req.user.email;
      const UdiseService = createUdiseService();

      const registration = await UdiseService.registration.updateRegistration(tenantCode, id, req.body, updatedBy);

      res.json({
         success: true,
         message: 'UDISE registration updated successfully',
         data: registration,
      });
   } catch (error) {
      logError(error, {
         context: 'UdiseRegistrationController.updateRegistration',
         user: req.user,
      });
      next(error);
   }
}

/**
 * Submit registration for approval
 * POST /api/v1/udise/registration/:id/submit
 */
async function submitRegistration(req, res, next) {
   try {
      const { tenantCode } = req.user;
      const { id } = req.params;
      const submittedBy = req.user.user_id || req.user.email;
      const UdiseService = createUdiseService();

      const registration = await UdiseService.registration.submitRegistration(tenantCode, id, submittedBy);

      res.json({
         success: true,
         message: 'UDISE registration submitted for approval',
         data: registration,
      });
   } catch (error) {
      logError(error, {
         context: 'UdiseRegistrationController.submitRegistration',
         user: req.user,
      });
      next(error);
   }
}

/**
 * Get UDISE registrations
 * GET /api/v1/udise/registration
 */
async function getRegistrations(req, res, next) {
   try {
      const { tenantCode } = req.user;
      const UdiseService = createUdiseService();

      const filters = {
         school_id: req.query.school_id,
         registration_status: req.query.registration_status,
         state_code: req.query.state_code,
         district_code: req.query.district_code,
         academic_year: req.query.academic_year,
         limit: parseInt(req.query.limit) || 50,
         offset: parseInt(req.query.offset) || 0,
      };

      const registrations = await UdiseService.registration.getRegistrations(tenantCode, filters);

      res.json({
         success: true,
         message: 'UDISE registrations retrieved successfully',
         data: registrations,
         pagination: {
            limit: filters.limit,
            offset: filters.offset,
            total: registrations.length,
         },
      });
   } catch (error) {
      logError(error, {
         context: 'UdiseRegistrationController.getRegistrations',
         user: req.user,
      });
      next(error);
   }
}

/**
 * Get single UDISE registration by ID
 * GET /api/v1/udise/registration/:id
 */
async function getRegistrationById(req, res, next) {
   try {
      const { tenantCode } = req.user;
      const { id } = req.params;
      const UdiseService = createUdiseService();

      const registration = await UdiseService.registration.getRegistrationById(tenantCode, id);

      res.json({
         success: true,
         message: 'UDISE registration retrieved successfully',
         data: registration,
      });
   } catch (error) {
      logError(error, {
         context: 'UdiseRegistrationController.getRegistrationById',
         user: req.user,
      });
      next(error);
   }
}

/**
 * Validate UDISE registration
 * GET /api/v1/udise/registration/:id/validate
 */
async function validateRegistration(req, res, next) {
   try {
      const { tenantCode } = req.user;
      const { id } = req.params;
      const UdiseService = createUdiseService();

      const validation = await UdiseService.registration.validateRegistration(tenantCode, id);

      res.json({
         success: true,
         message: 'Registration validation completed',
         data: validation,
      });
   } catch (error) {
      logError(error, {
         context: 'UdiseRegistrationController.validateRegistration',
         user: req.user,
      });
      next(error);
   }
}

/**
 * Delete UDISE registration
 * DELETE /api/v1/udise/registration/:id
 */
async function deleteRegistration(req, res, next) {
   try {
      const { tenantCode } = req.user;
      const { id } = req.params;
      const deletedBy = req.user.user_id || req.user.email;
      const UdiseService = createUdiseService();

      await UdiseService.registration.deleteRegistration(tenantCode, id, deletedBy);

      res.json({
         success: true,
         message: 'UDISE registration deleted successfully',
      });
   } catch (error) {
      logError(error, {
         context: 'UdiseRegistrationController.deleteRegistration',
         user: req.user,
      });
      next(error);
   }
}

module.exports = {
   createRegistration,
   updateRegistration,
   submitRegistration,
   getRegistrations,
   getRegistrationById,
   validateRegistration,
   deleteRegistration,
};
