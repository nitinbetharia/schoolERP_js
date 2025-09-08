const { logError } = require('../utils/logger');

/**
 * Communication & Notification Service
 * Handles SMS, email, app notifications, and parent communication
 * Phase 8 Implementation - Communication System
 */

class CommunicationService {
   constructor(models) {
      if (!models) {
         throw new Error('Models are required for CommunicationService');
      }
      this.models = models;
   }

   /**
    * Create a new notification template
    * @param {Object} templateData - Template information
    * @param {string} tenantCode - Tenant identifier
    * @returns {Promise<Object>} Created template
    */
   async createNotificationTemplate(templateData, tenantCode) {
      try {
         const template = await this.models.NotificationTemplate.create({
            name: templateData.name,
            category: templateData.category,
            type: templateData.type,
            subject: templateData.subject,
            content: templateData.content,
            sms_content: templateData.sms_content || null,
            variables: JSON.stringify(templateData.variables || []),
            is_active: templateData.is_active !== false,
            created_by: templateData.created_by,
            tenant_code: tenantCode,
         });

         return template;
      } catch (error) {
         logError(error, {
            context: 'createNotificationTemplate',
            tenantCode,
            templateData: { name: templateData.name, category: templateData.category },
         });
         throw new Error(`Failed to create notification template: ${error.message}`);
      }
   }

   /**
    * Get all notification templates with filtering
    * @param {Object} filters - Filter criteria
    * @param {Object} pagination - Pagination options
    * @param {string} tenantCode - Tenant identifier
    * @returns {Promise<Object>} Templates with pagination
    */
   async getAllNotificationTemplates(filters = {}, pagination = {}, tenantCode) {
      try {
         const page = Math.max(1, parseInt(pagination.page) || 1);
         const limit = Math.min(100, Math.max(1, parseInt(pagination.limit) || 20));
         const offset = (page - 1) * limit;

         const whereClause = { tenant_code: tenantCode };

         if (filters.search) {
            whereClause[this.models.Sequelize.Op.or] = [
               { name: { [this.models.Sequelize.Op.iLike]: `%${filters.search}%` } },
               { subject: { [this.models.Sequelize.Op.iLike]: `%${filters.search}%` } },
            ];
         }

         if (filters.category) {
            whereClause.category = filters.category;
         }

         if (filters.type) {
            whereClause.type = filters.type;
         }

         if (filters.is_active !== undefined) {
            whereClause.is_active = filters.is_active;
         }

         const orderBy = [];
         const sortBy = pagination.sortBy || 'created_at';
         const sortOrder = pagination.sortOrder || 'DESC';
         orderBy.push([sortBy, sortOrder]);

         const result = await this.models.NotificationTemplate.findAndCountAll({
            where: whereClause,
            order: orderBy,
            limit,
            offset,
            include: [
               {
                  model: this.models.User,
                  as: 'creator',
                  attributes: ['id', 'username', 'email'],
                  required: false,
               },
            ],
         });

         return {
            templates: result.rows,
            pagination: {
               page,
               limit,
               total: result.count,
               totalPages: Math.ceil(result.count / limit),
               hasNext: page < Math.ceil(result.count / limit),
               hasPrev: page > 1,
            },
         };
      } catch (error) {
         logError(error, { context: 'getAllNotificationTemplates', tenantCode, filters });
         throw new Error('Failed to fetch notification templates');
      }
   }

   /**
    * Create a new communication record
    * @param {Object} communicationData - Communication information
    * @param {string} tenantCode - Tenant identifier
    * @returns {Promise<Object>} Created communication
    */
   async createCommunication(communicationData, tenantCode) {
      const transaction = await this.models.sequelize.transaction();

      try {
         // Create main communication record
         const communication = await this.models.Communication.create(
            {
               title: communicationData.title,
               message: communicationData.message,
               type: communicationData.type,
               category: communicationData.category,
               priority: communicationData.priority || 'MEDIUM',
               send_via: JSON.stringify(communicationData.send_via || ['NOTIFICATION']),
               target_type: communicationData.target_type,
               target_criteria: JSON.stringify(communicationData.target_criteria || {}),
               scheduled_at: communicationData.scheduled_at || new Date(),
               status: 'DRAFT',
               created_by: communicationData.created_by,
               tenant_code: tenantCode,
            },
            { transaction }
         );

         // Add recipients if provided
         if (communicationData.recipients && communicationData.recipients.length > 0) {
            const recipients = communicationData.recipients.map((recipient) => ({
               communication_id: communication.id,
               recipient_type: recipient.type, // 'USER', 'STUDENT', 'PARENT'
               recipient_id: recipient.id,
               contact_email: recipient.email || null,
               contact_phone: recipient.phone || null,
               status: 'PENDING',
               tenant_code: tenantCode,
            }));

            await this.models.CommunicationRecipient.bulkCreate(recipients, { transaction });
         }

         await transaction.commit();

         // Return communication with recipients
         return await this.getCommunicationById(communication.id, tenantCode);
      } catch (error) {
         await transaction.rollback();
         logError(error, {
            context: 'createCommunication',
            tenantCode,
            communicationData: { title: communicationData.title, type: communicationData.type },
         });
         throw new Error(`Failed to create communication: ${error.message}`);
      }
   }

   /**
    * Get communication by ID
    * @param {number} communicationId - Communication ID
    * @param {string} tenantCode - Tenant identifier
    * @returns {Promise<Object>} Communication details
    */
   async getCommunicationById(communicationId, tenantCode) {
      try {
         const communication = await this.models.Communication.findOne({
            where: {
               id: communicationId,
               tenant_code: tenantCode,
            },
            include: [
               {
                  model: this.models.CommunicationRecipient,
                  as: 'recipients',
                  include: [
                     {
                        model: this.models.User,
                        as: 'user',
                        attributes: ['id', 'username', 'email', 'phone'],
                        required: false,
                     },
                     {
                        model: this.models.Student,
                        as: 'student',
                        attributes: ['id', 'name', 'roll_number', 'parent_email', 'parent_phone'],
                        required: false,
                     },
                  ],
               },
               {
                  model: this.models.User,
                  as: 'creator',
                  attributes: ['id', 'username', 'email'],
               },
            ],
         });

         if (!communication) {
            throw new Error('Communication not found');
         }

         return communication;
      } catch (error) {
         logError(error, { context: 'getCommunicationById', communicationId, tenantCode });
         throw new Error('Failed to fetch communication details');
      }
   }

   /**
    * Send communication to recipients
    * @param {number} communicationId - Communication ID
    * @param {string} tenantCode - Tenant identifier
    * @returns {Promise<Object>} Send results
    */
   async sendCommunication(communicationId, tenantCode) {
      const transaction = await this.models.sequelize.transaction();

      try {
         const communication = await this.getCommunicationById(communicationId, tenantCode);

         if (communication.status !== 'DRAFT' && communication.status !== 'SCHEDULED') {
            throw new Error('Communication can only be sent if it is in DRAFT or SCHEDULED status');
         }

         const sendVia = JSON.parse(communication.send_via || '["NOTIFICATION"]');
         const results = {
            total: 0,
            successful: 0,
            failed: 0,
            errors: [],
         };

         // Update communication status
         await communication.update(
            {
               status: 'SENDING',
               sent_at: new Date(),
            },
            { transaction }
         );

         // Process each recipient
         for (const recipient of communication.recipients) {
            results.total++;

            try {
               // Determine contact details
               let email = recipient.contact_email;
               let phone = recipient.contact_phone;

               if (recipient.user) {
                  email = email || recipient.user.email;
                  phone = phone || recipient.user.phone;
               } else if (recipient.student) {
                  email = email || recipient.student.parent_email;
                  phone = phone || recipient.student.parent_phone;
               }

               let sentSuccessfully = false;

               // Send via different channels
               for (const channel of sendVia) {
                  switch (channel) {
                     case 'EMAIL':
                        if (email) {
                           await this.sendEmail(email, communication.title, communication.message);
                           sentSuccessfully = true;
                        }
                        break;

                     case 'SMS':
                        if (phone) {
                           await this.sendSMS(phone, communication.message);
                           sentSuccessfully = true;
                        }
                        break;

                     case 'NOTIFICATION':
                        await this.createInAppNotification(
                           {
                              recipient_type: recipient.recipient_type,
                              recipient_id: recipient.recipient_id,
                              title: communication.title,
                              message: communication.message,
                              category: communication.category,
                              priority: communication.priority,
                           },
                           tenantCode
                        );
                        sentSuccessfully = true;
                        break;

                     default:
                        // App notification as fallback
                        await this.createInAppNotification(
                           {
                              recipient_type: recipient.recipient_type,
                              recipient_id: recipient.recipient_id,
                              title: communication.title,
                              message: communication.message,
                              category: communication.category,
                              priority: communication.priority,
                           },
                           tenantCode
                        );
                        sentSuccessfully = true;
                  }
               }

               // Update recipient status
               await recipient.update(
                  {
                     status: sentSuccessfully ? 'SENT' : 'FAILED',
                     sent_at: sentSuccessfully ? new Date() : null,
                     error_message: sentSuccessfully ? null : 'No valid contact information found',
                  },
                  { transaction }
               );

               if (sentSuccessfully) {
                  results.successful++;
               } else {
                  results.failed++;
                  results.errors.push(`Recipient ${recipient.id}: No valid contact information`);
               }
            } catch (recipientError) {
               results.failed++;
               results.errors.push(`Recipient ${recipient.id}: ${recipientError.message}`);

               // Update recipient status
               await recipient.update(
                  {
                     status: 'FAILED',
                     error_message: recipientError.message,
                  },
                  { transaction }
               );
            }
         }

         // Update final communication status
         const finalStatus = results.failed === 0 ? 'SENT' : results.successful === 0 ? 'FAILED' : 'PARTIALLY_SENT';

         await communication.update(
            {
               status: finalStatus,
               completed_at: new Date(),
            },
            { transaction }
         );

         await transaction.commit();
         return results;
      } catch (error) {
         await transaction.rollback();
         logError(error, { context: 'sendCommunication', communicationId, tenantCode });
         throw new Error(`Failed to send communication: ${error.message}`);
      }
   }

   /**
    * Create in-app notification
    * @param {Object} notificationData - Notification details
    * @param {string} tenantCode - Tenant identifier
    * @returns {Promise<Object>} Created notification
    */
   async createInAppNotification(notificationData, tenantCode) {
      try {
         const notification = await this.models.Notification.create({
            recipient_type: notificationData.recipient_type,
            recipient_id: notificationData.recipient_id,
            title: notificationData.title,
            message: notificationData.message,
            category: notificationData.category || 'GENERAL',
            priority: notificationData.priority || 'MEDIUM',
            status: 'UNREAD',
            created_at: new Date(),
            tenant_code: tenantCode,
         });

         return notification;
      } catch (error) {
         logError(error, { context: 'createInAppNotification', tenantCode });
         throw new Error('Failed to create in-app notification');
      }
   }

   /**
    * Get user notifications
    * @param {string} userType - User type (USER, STUDENT, PARENT)
    * @param {number} userId - User ID
    * @param {Object} filters - Filter options
    * @param {Object} pagination - Pagination options
    * @param {string} tenantCode - Tenant identifier
    * @returns {Promise<Object>} User notifications
    */
   async getUserNotifications(userType, userId, filters = {}, pagination = {}, tenantCode) {
      try {
         const page = Math.max(1, parseInt(pagination.page) || 1);
         const limit = Math.min(50, Math.max(1, parseInt(pagination.limit) || 20));
         const offset = (page - 1) * limit;

         const whereClause = {
            recipient_type: userType,
            recipient_id: userId,
            tenant_code: tenantCode,
         };

         if (filters.status) {
            whereClause.status = filters.status;
         }

         if (filters.category) {
            whereClause.category = filters.category;
         }

         if (filters.priority) {
            whereClause.priority = filters.priority;
         }

         const result = await this.models.Notification.findAndCountAll({
            where: whereClause,
            order: [['created_at', 'DESC']],
            limit,
            offset,
         });

         return {
            notifications: result.rows,
            pagination: {
               page,
               limit,
               total: result.count,
               totalPages: Math.ceil(result.count / limit),
               hasNext: page < Math.ceil(result.count / limit),
               hasPrev: page > 1,
            },
         };
      } catch (error) {
         logError(error, { context: 'getUserNotifications', userType, userId, tenantCode });
         throw new Error('Failed to fetch user notifications');
      }
   }

   /**
    * Mark notification as read
    * @param {number} notificationId - Notification ID
    * @param {string} tenantCode - Tenant identifier
    * @returns {Promise<Object>} Updated notification
    */
   async markNotificationAsRead(notificationId, tenantCode) {
      try {
         const notification = await this.models.Notification.findOne({
            where: {
               id: notificationId,
               tenant_code: tenantCode,
            },
         });

         if (!notification) {
            throw new Error('Notification not found');
         }

         await notification.update({
            status: 'READ',
            read_at: new Date(),
         });

         return notification;
      } catch (error) {
         logError(error, { context: 'markNotificationAsRead', notificationId, tenantCode });
         throw new Error('Failed to mark notification as read');
      }
   }

   /**
    * Send email (placeholder - integrate with your email service)
    * @param {string} email - Recipient email
    * @param {string} subject - Email subject
    * @param {string} message - Email content
    * @returns {Promise<boolean>} Success status
    */
   async sendEmail(email, subject, message) {
      try {
         // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
         console.log(`Sending email to ${email}: ${subject}`);

         // Simulated email sending
         return new Promise((resolve) => {
            setTimeout(() => resolve(true), 100);
         });
      } catch (error) {
         logError(error, { context: 'sendEmail', email, subject });
         throw new Error('Failed to send email');
      }
   }

   /**
    * Send SMS (placeholder - integrate with your SMS service)
    * @param {string} phone - Recipient phone number
    * @param {string} message - SMS content
    * @returns {Promise<boolean>} Success status
    */
   async sendSMS(phone, message) {
      try {
         // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
         console.log(`Sending SMS to ${phone}: ${message}`);

         // Simulated SMS sending
         return new Promise((resolve) => {
            setTimeout(() => resolve(true), 100);
         });
      } catch (error) {
         logError(error, { context: 'sendSMS', phone, message });
         throw new Error('Failed to send SMS');
      }
   }

   /**
    * Get communication statistics
    * @param {Object} filters - Filter criteria
    * @param {string} tenantCode - Tenant identifier
    * @returns {Promise<Object>} Communication statistics
    */
   async getCommunicationStatistics(filters = {}, tenantCode) {
      try {
         const whereClause = { tenant_code: tenantCode };

         if (filters.date_from) {
            whereClause.created_at = {
               [this.models.Sequelize.Op.gte]: new Date(filters.date_from),
            };
         }

         if (filters.date_to) {
            if (whereClause.created_at) {
               whereClause.created_at[this.models.Sequelize.Op.lte] = new Date(filters.date_to);
            } else {
               whereClause.created_at = {
                  [this.models.Sequelize.Op.lte]: new Date(filters.date_to),
               };
            }
         }

         // Get communication counts by status
         const communicationStats = await this.models.Communication.findAll({
            where: whereClause,
            attributes: ['status', [this.models.Sequelize.fn('COUNT', this.models.Sequelize.col('id')), 'count']],
            group: ['status'],
         });

         // Get notification counts by category
         const notificationStats = await this.models.Notification.findAll({
            where: {
               tenant_code: tenantCode,
               ...(filters.date_from && {
                  created_at: { [this.models.Sequelize.Op.gte]: new Date(filters.date_from) },
               }),
               ...(filters.date_to && { created_at: { [this.models.Sequelize.Op.lte]: new Date(filters.date_to) } }),
            },
            attributes: [
               'category',
               'status',
               [this.models.Sequelize.fn('COUNT', this.models.Sequelize.col('id')), 'count'],
            ],
            group: ['category', 'status'],
         });

         // Get template usage stats
         const templateStats = await this.models.NotificationTemplate.count({
            where: {
               tenant_code: tenantCode,
               is_active: true,
            },
         });

         return {
            communication_by_status: communicationStats.reduce((acc, stat) => {
               acc[stat.status] = parseInt(stat.dataValues.count);
               return acc;
            }, {}),
            notifications_by_category: notificationStats.reduce((acc, stat) => {
               if (!acc[stat.category]) {
                  acc[stat.category] = {};
               }
               acc[stat.category][stat.status] = parseInt(stat.dataValues.count);
               return acc;
            }, {}),
            active_templates: templateStats,
            summary: {
               total_communications: communicationStats.reduce((sum, stat) => sum + parseInt(stat.dataValues.count), 0),
               total_notifications: notificationStats.reduce((sum, stat) => sum + parseInt(stat.dataValues.count), 0),
            },
         };
      } catch (error) {
         logError(error, { context: 'getCommunicationStatistics', tenantCode });
         throw new Error('Failed to fetch communication statistics');
      }
   }

   /**
    * Create bulk communication for class/section
    * @param {Object} bulkData - Bulk communication data
    * @param {string} tenantCode - Tenant identifier
    * @returns {Promise<Object>} Created communication with recipient count
    */
   async createBulkCommunication(bulkData, tenantCode) {
      try {
         let recipients = [];

         // Get recipients based on target type
         switch (bulkData.target_type) {
            case 'CLASS':
               if (bulkData.class_id) {
                  const students = await this.models.Student.findAll({
                     where: {
                        class_id: bulkData.class_id,
                        tenant_code: tenantCode,
                        is_active: true,
                     },
                     attributes: ['id', 'name', 'parent_email', 'parent_phone'],
                  });

                  recipients = students.map((student) => ({
                     type: 'STUDENT',
                     id: student.id,
                     email: student.parent_email,
                     phone: student.parent_phone,
                  }));
               }
               break;

            case 'SECTION':
               if (bulkData.section_id) {
                  const students = await this.models.Student.findAll({
                     where: {
                        section_id: bulkData.section_id,
                        tenant_code: tenantCode,
                        is_active: true,
                     },
                     attributes: ['id', 'name', 'parent_email', 'parent_phone'],
                  });

                  recipients = students.map((student) => ({
                     type: 'STUDENT',
                     id: student.id,
                     email: student.parent_email,
                     phone: student.parent_phone,
                  }));
               }
               break;

            case 'ALL_STUDENTS':
               const allStudents = await this.models.Student.findAll({
                  where: {
                     tenant_code: tenantCode,
                     is_active: true,
                  },
                  attributes: ['id', 'name', 'parent_email', 'parent_phone'],
               });

               recipients = allStudents.map((student) => ({
                  type: 'STUDENT',
                  id: student.id,
                  email: student.parent_email,
                  phone: student.parent_phone,
               }));
               break;

            case 'ALL_TEACHERS':
               const teachers = await this.models.User.findAll({
                  where: {
                     tenant_code: tenantCode,
                     role: 'TEACHER',
                     is_active: true,
                  },
                  attributes: ['id', 'username', 'email', 'phone'],
               });

               recipients = teachers.map((teacher) => ({
                  type: 'USER',
                  id: teacher.id,
                  email: teacher.email,
                  phone: teacher.phone,
               }));
               break;
         }

         // Create communication with recipients
         const communicationData = {
            ...bulkData,
            recipients,
         };

         return await this.createCommunication(communicationData, tenantCode);
      } catch (error) {
         logError(error, { context: 'createBulkCommunication', tenantCode, target_type: bulkData.target_type });
         throw new Error(`Failed to create bulk communication: ${error.message}`);
      }
   }
}

module.exports = CommunicationService;
