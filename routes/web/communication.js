const express = require('express');
const Joi = require('joi');
const { logError } = require('../../utils/logger');

/**
 * Communication & Notification Routes
 * Complete communication system including notifications, messaging, and parent communication
 * Phase 8 Implementation - Communication & Notification System
 */

module.exports = function (middleware) {
   const router = express.Router();
   const { requireAuth } = middleware;

   // Import models dynamically based on tenant
   const getTenantModels = (tenantCode) => {
      if (!tenantCode) {
         return null;
      }
      const { dbManager } = require('../../models/system/database');
      const tenantDB = dbManager.getTenantDatabase(tenantCode);
      return tenantDB ? require('../../models')(tenantDB) : null;
   };

   // Initialize communication service
   const initCommunicationService = (tenantCode) => {
      const models = getTenantModels(tenantCode);
      const CommunicationService = require('../../services/CommunicationService');
      return new CommunicationService(models);
   };

   // Joi validation schemas
   const templateSchema = Joi.object({
      name: Joi.string().min(2).max(100).required(),
      category: Joi.string()
         .valid('ANNOUNCEMENT', 'ACADEMIC', 'FEE', 'ATTENDANCE', 'EVENT', 'EMERGENCY', 'GENERAL')
         .required(),
      type: Joi.string().valid('EMAIL', 'SMS', 'NOTIFICATION', 'ALL').required(),
      subject: Joi.string().max(200).required(),
      content: Joi.string().max(2000).required(),
      sms_content: Joi.string().max(160).optional().allow(''),
      variables: Joi.array().items(Joi.string()).optional(),
      is_active: Joi.boolean().optional(),
   });

   const communicationSchema = Joi.object({
      title: Joi.string().min(3).max(200).required(),
      message: Joi.string().min(10).max(2000).required(),
      type: Joi.string().valid('ANNOUNCEMENT', 'MESSAGE', 'ALERT', 'REMINDER').required(),
      category: Joi.string()
         .valid('ACADEMIC', 'FEE', 'ATTENDANCE', 'EVENT', 'EMERGENCY', 'GENERAL', 'ANNOUNCEMENT')
         .required(),
      priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').optional(),
      send_via: Joi.array()
         .items(Joi.string().valid('EMAIL', 'SMS', 'NOTIFICATION'))
         .required(),
      target_type: Joi.string()
         .valid('INDIVIDUAL', 'CLASS', 'SECTION', 'ALL_STUDENTS', 'ALL_TEACHERS', 'CUSTOM')
         .required(),
      target_criteria: Joi.object().optional(),
      scheduled_at: Joi.date().optional(),
      recipients: Joi.array()
         .items(
            Joi.object({
               type: Joi.string().valid('USER', 'STUDENT', 'PARENT').required(),
               id: Joi.number().integer().positive().required(),
               email: Joi.string().email().optional(),
               phone: Joi.string().optional(),
            })
         )
         .optional(),
      class_id: Joi.number().integer().positive().optional(),
      section_id: Joi.number().integer().positive().optional(),
   });

   /**
    * @route GET /communication
    * @desc Communication dashboard
    * @access Private (Teachers, School Admin, Trust Admin)
    */
   router.get('/', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'teacher'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Communication privileges required.');
            return res.redirect('/dashboard');
         }

         const communicationService = initCommunicationService(req.tenant?.code);
         if (!communicationService) {
            req.flash('error', 'Communication service initialization failed. Please try again.');
            return res.redirect('/dashboard');
         }

         // Get current date filters (last 7 days)
         const today = new Date();
         const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

         const filters = {
            date_from: sevenDaysAgo.toISOString().split('T')[0],
            date_to: today.toISOString().split('T')[0],
         };

         // Get communication statistics
         const statistics = await communicationService.getCommunicationStatistics(filters, req.tenant?.code);

         // Get user notifications (recent 10)
         const userNotifications = await communicationService.getUserNotifications(
            'USER',
            req.session.user.id,
            {},
            { page: 1, limit: 10 },
            req.tenant?.code
         );

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Communication Center', url: '/communication' },
         ];

         res.render('pages/communication/dashboard', {
            title: 'Communication Center',
            description: 'Complete communication and notification management',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/communication',
            statistics: statistics,
            recentNotifications: userNotifications.notifications,
            breadcrumb: breadcrumb,
            quickActions: [
               { title: 'Send Message', url: '/communication/send', icon: 'fas fa-paper-plane' },
               { title: 'Templates', url: '/communication/templates', icon: 'fas fa-file-alt' },
               { title: 'My Notifications', url: '/communication/notifications', icon: 'fas fa-bell' },
               { title: 'Bulk Messaging', url: '/communication/bulk', icon: 'fas fa-bullhorn' },
            ],
         });
      } catch (error) {
         logError(error, { context: 'communication dashboard GET', tenant: req.tenant?.code });
         req.flash('error', 'Unable to load communication dashboard. Please try again.');
         res.redirect('/dashboard');
      }
   });

   /**
    * @route GET /communication/send
    * @desc Send new communication form
    * @access Private (Teachers, School Admin, Trust Admin)
    */
   router.get('/send', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'teacher'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Message sending privileges required.');
            return res.redirect('/communication');
         }

         const models = getTenantModels(req.tenant?.code);
         if (!models) {
            req.flash('error', 'Service initialization failed.');
            return res.redirect('/communication');
         }

         // Get classes and sections for targeting
         const classes = await models.Class.findAll({
            where: { tenant_code: req.tenant?.code, is_active: true },
            attributes: ['id', 'name'],
            order: [['name', 'ASC']],
         });

         const sections = await models.Section.findAll({
            where: { tenant_code: req.tenant?.code, is_active: true },
            attributes: ['id', 'name', 'class_id'],
            order: [['name', 'ASC']],
         });

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Communication Center', url: '/communication' },
            { title: 'Send Message', url: '/communication/send' },
         ];

         res.render('pages/communication/send', {
            title: 'Send Communication',
            description: 'Send messages to students, parents, or teachers',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/communication/send',
            classes: classes,
            sections: sections,
            breadcrumb: breadcrumb,
            messageTypes: [
               { value: 'ANNOUNCEMENT', label: 'Announcement' },
               { value: 'MESSAGE', label: 'General Message' },
               { value: 'ALERT', label: 'Alert' },
               { value: 'REMINDER', label: 'Reminder' },
            ],
            categories: [
               { value: 'ACADEMIC', label: 'Academic' },
               { value: 'FEE', label: 'Fee Related' },
               { value: 'ATTENDANCE', label: 'Attendance' },
               { value: 'EVENT', label: 'Event' },
               { value: 'EMERGENCY', label: 'Emergency' },
               { value: 'GENERAL', label: 'General' },
            ],
            priorities: [
               { value: 'LOW', label: 'Low', color: 'secondary' },
               { value: 'MEDIUM', label: 'Medium', color: 'info' },
               { value: 'HIGH', label: 'High', color: 'warning' },
               { value: 'URGENT', label: 'Urgent', color: 'danger' },
            ],
         });
      } catch (error) {
         logError(error, { context: 'communication send GET', tenant: req.tenant?.code });
         req.flash('error', 'Unable to load send communication form. Please try again.');
         res.redirect('/communication');
      }
   });

   /**
    * @route POST /communication/send
    * @desc Create and send new communication
    * @access Private (Teachers, School Admin, Trust Admin)
    */
   router.post('/send', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'teacher'];

         if (!allowedTypes.includes(userType)) {
            return res.status(403).json({
               success: false,
               message: 'Access denied. Message sending privileges required.',
            });
         }

         // Validate communication data
         const { error, value } = communicationSchema.validate(req.body, { abortEarly: false });
         if (error) {
            return res.status(400).json({
               success: false,
               message: 'Invalid communication data',
               errors: error.details.map((detail) => detail.message),
            });
         }

         const communicationService = initCommunicationService(req.tenant?.code);
         if (!communicationService) {
            return res.status(500).json({
               success: false,
               message: 'Communication service initialization failed',
            });
         }

         // Add created_by information
         value.created_by = req.session.user.id;

         // Create communication (handle bulk targeting)
         let communication;
         if (['CLASS', 'SECTION', 'ALL_STUDENTS', 'ALL_TEACHERS'].includes(value.target_type)) {
            communication = await communicationService.createBulkCommunication(value, req.tenant?.code);
         } else {
            communication = await communicationService.createCommunication(value, req.tenant?.code);
         }

         // Send immediately if not scheduled
         let sendResults = null;
         if (!value.scheduled_at || new Date(value.scheduled_at) <= new Date()) {
            sendResults = await communicationService.sendCommunication(communication.id, req.tenant?.code);
         }

         res.json({
            success: true,
            message: sendResults
               ? `Communication sent successfully. ${sendResults.successful} recipients reached.`
               : 'Communication scheduled successfully.',
            communication: communication,
            sendResults: sendResults,
         });
      } catch (error) {
         logError(error, { context: 'communication send POST', tenant: req.tenant?.code });
         res.status(500).json({
            success: false,
            message: error.message || 'Failed to send communication',
         });
      }
   });

   /**
    * @route GET /communication/templates
    * @desc Notification templates listing
    * @access Private (School Admin, Trust Admin)
    */
   router.get('/templates', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Template management privileges required.');
            return res.redirect('/communication');
         }

         const communicationService = initCommunicationService(req.tenant?.code);
         if (!communicationService) {
            req.flash('error', 'Communication service initialization failed.');
            return res.redirect('/communication');
         }

         // Get filters and pagination
         const filters = {
            search: req.query.search || '',
            category: req.query.category || '',
            type: req.query.type || '',
            is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined,
         };

         const pagination = {
            page: parseInt(req.query.page) || 1,
            limit: 20,
            sortBy: req.query.sortBy || 'name',
            sortOrder: req.query.sortOrder || 'ASC',
         };

         // Get templates from service
         const result = await communicationService.getAllNotificationTemplates(filters, pagination, req.tenant?.code);

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Communication Center', url: '/communication' },
            { title: 'Templates', url: '/communication/templates' },
         ];

         res.render('pages/communication/templates/index', {
            title: 'Communication Templates',
            description: 'Manage notification and message templates',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/communication/templates',
            templates: result.templates,
            filters: filters,
            pagination: result.pagination,
            breadcrumb: breadcrumb,
            canCreate: ['system', 'trust', 'school'].includes(userType),
            canEdit: ['system', 'trust', 'school'].includes(userType),
            categories: [
               { value: 'ANNOUNCEMENT', label: 'Announcement' },
               { value: 'ACADEMIC', label: 'Academic' },
               { value: 'FEE', label: 'Fee Related' },
               { value: 'ATTENDANCE', label: 'Attendance' },
               { value: 'EVENT', label: 'Event' },
               { value: 'EMERGENCY', label: 'Emergency' },
               { value: 'GENERAL', label: 'General' },
            ],
            templateTypes: [
               { value: 'EMAIL', label: 'Email Only' },
               { value: 'SMS', label: 'SMS Only' },
               { value: 'NOTIFICATION', label: 'In-App Only' },
               { value: 'ALL', label: 'All Channels' },
            ],
         });
      } catch (error) {
         logError(error, { context: 'communication templates GET', tenant: req.tenant?.code });
         req.flash('error', 'Unable to load communication templates. Please try again.');
         res.redirect('/communication');
      }
   });

   /**
    * @route POST /communication/templates
    * @desc Create new notification template
    * @access Private (School Admin, Trust Admin)
    */
   router.post('/templates', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school'];

         if (!allowedTypes.includes(userType)) {
            return res.status(403).json({
               success: false,
               message: 'Access denied. Template creation privileges required.',
            });
         }

         // Validate template data
         const { error, value } = templateSchema.validate(req.body, { abortEarly: false });
         if (error) {
            return res.status(400).json({
               success: false,
               message: 'Invalid template data',
               errors: error.details.map((detail) => detail.message),
            });
         }

         const communicationService = initCommunicationService(req.tenant?.code);
         if (!communicationService) {
            return res.status(500).json({
               success: false,
               message: 'Communication service initialization failed',
            });
         }

         // Add created_by information
         value.created_by = req.session.user.id;

         // Create template using service
         const template = await communicationService.createNotificationTemplate(value, req.tenant?.code);

         res.json({
            success: true,
            message: 'Notification template created successfully',
            template: template,
         });
      } catch (error) {
         logError(error, { context: 'communication templates create POST', tenant: req.tenant?.code });

         const statusCode = error.message.includes('already exists') ? 400 : 500;
         res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to create notification template',
         });
      }
   });

   /**
    * @route GET /communication/notifications
    * @desc User notifications listing
    * @access Private (All authenticated users)
    */
   router.get('/notifications', requireAuth, async (req, res) => {
      try {
         const communicationService = initCommunicationService(req.tenant?.code);
         if (!communicationService) {
            req.flash('error', 'Communication service initialization failed.');
            return res.redirect('/communication');
         }

         // Get filters and pagination
         const filters = {
            status: req.query.status || '',
            category: req.query.category || '',
            priority: req.query.priority || '',
         };

         const pagination = {
            page: parseInt(req.query.page) || 1,
            limit: 20,
         };

         // Get user notifications
         const result = await communicationService.getUserNotifications(
            'USER',
            req.session.user.id,
            filters,
            pagination,
            req.tenant?.code
         );

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Communication Center', url: '/communication' },
            { title: 'My Notifications', url: '/communication/notifications' },
         ];

         res.render('pages/communication/notifications', {
            title: 'My Notifications',
            description: 'View and manage your notifications',
            user: req.session.user,
            tenant: req.tenant,
            userType: req.session.userType,
            currentPath: '/communication/notifications',
            notifications: result.notifications,
            filters: filters,
            pagination: result.pagination,
            breadcrumb: breadcrumb,
            statusOptions: [
               { value: 'UNREAD', label: 'Unread', color: 'primary' },
               { value: 'READ', label: 'Read', color: 'secondary' },
            ],
            priorityOptions: [
               { value: 'LOW', label: 'Low', color: 'secondary' },
               { value: 'MEDIUM', label: 'Medium', color: 'info' },
               { value: 'HIGH', label: 'High', color: 'warning' },
               { value: 'URGENT', label: 'Urgent', color: 'danger' },
            ],
         });
      } catch (error) {
         logError(error, { context: 'communication notifications GET', tenant: req.tenant?.code });
         req.flash('error', 'Unable to load notifications. Please try again.');
         res.redirect('/communication');
      }
   });

   /**
    * @route POST /communication/notifications/:id/read
    * @desc Mark notification as read
    * @access Private (Notification owner)
    */
   router.post('/notifications/:id/read', requireAuth, async (req, res) => {
      try {
         const notificationId = parseInt(req.params.id);
         if (!notificationId || notificationId <= 0) {
            return res.status(400).json({
               success: false,
               message: 'Invalid notification ID',
            });
         }

         const communicationService = initCommunicationService(req.tenant?.code);
         if (!communicationService) {
            return res.status(500).json({
               success: false,
               message: 'Communication service initialization failed',
            });
         }

         // Mark notification as read
         const notification = await communicationService.markNotificationAsRead(notificationId, req.tenant?.code);

         res.json({
            success: true,
            message: 'Notification marked as read',
            notification: notification,
         });
      } catch (error) {
         logError(error, {
            context: 'communication notification mark read POST',
            notificationId: req.params.id,
            tenant: req.tenant?.code,
         });

         const statusCode = error.message.includes('not found') ? 404 : 500;
         res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to mark notification as read',
         });
      }
   });

   return router;
};
