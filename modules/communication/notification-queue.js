/**
 * Notification Queue System
 * Handles background processing of bulk email and SMS notifications
 */

const EventEmitter = require('events');
const logger = require('../../config/logger');
const databaseService = require('../data/database-service');
const communicationService = require('./communication-service');

class NotificationQueue extends EventEmitter {
  constructor() {
    super();
    this.queues = {
      email: [],
      sms: []
    };
    this.processing = {
      email: false,
      sms: false
    };
    this.batchSize = {
      email: 50, // Process 50 emails at a time
      sms: 100 // Process 100 SMS at a time
    };
    this.retryAttempts = 3;
    this.retryDelay = 30000; // 30 seconds
    this.maxConcurrent = 5; // Maximum concurrent operations per type

    // Statistics
    this.stats = {
      email: {
        total: 0,
        sent: 0,
        failed: 0,
        pending: 0
      },
      sms: {
        total: 0,
        sent: 0,
        failed: 0,
        pending: 0
      }
    };

    // Initialize queue processing
    this.initializeQueueProcessing();
  }

  /**
   * Initialize queue processing timers
   */
  initializeQueueProcessing() {
    // Process email queue every 30 seconds
    setInterval(() => {
      this.processQueue('email');
    }, 30000);

    // Process SMS queue every 15 seconds (SMS is faster)
    setInterval(() => {
      this.processQueue('sms');
    }, 15000);

    // Clean up old completed jobs every hour
    setInterval(() => {
      this.cleanupCompletedJobs();
    }, 3600000);

    logger.info('Notification queue processing initialized');
  }

  /**
   * Add bulk communication job to queue
   */
  async addBulkJob(type, jobData) {
    try {
      const job = {
        id: this.generateJobId(),
        type,
        data: jobData,
        status: 'pending',
        created_at: new Date(),
        attempts: 0,
        recipients: [],
        results: {
          total: 0,
          sent: 0,
          failed: 0,
          errors: []
        }
      };

      // Prepare recipients based on job data
      await this.prepareRecipients(job);

      // Add to queue
      this.queues[type].push(job);
      this.stats[type].total += job.results.total;
      this.stats[type].pending += job.results.total;

      // Store job in database for persistence
      await this.storeJobInDatabase(job);

      logger.info(`Bulk ${type} job added to queue`, {
        jobId: job.id,
        recipients: job.results.total,
        queueLength: this.queues[type].length
      });

      this.emit('jobAdded', { type, job });
      return job.id;
    } catch (error) {
      logger.error(`Error adding bulk ${type} job to queue`, error);
      throw error;
    }
  }

  /**
   * Prepare recipients for the job
   */
  async prepareRecipients(job) {
    const { data } = job;
    let recipients = [];

    try {
      switch (data.recipient_type) {
        case 'all_students':
          recipients = await this.getAllStudentRecipients(job.type);
          break;

        case 'class_students':
          recipients = await this.getClassStudentRecipients(data.class_ids, job.type);
          break;

        case 'fee_defaulters':
          recipients = await this.getFeeDefaulterRecipients(job.type);
          break;

        case 'custom_list':
          recipients = await this.getCustomListRecipients(data.recipient_list, job.type);
          break;

        default:
          throw new Error(`Invalid recipient type: ${data.recipient_type}`);
      }

      // Filter out invalid recipients
      recipients = recipients.filter(r => (job.type === 'email' ? r.email : r.phone));

      job.recipients = recipients;
      job.results.total = recipients.length;
    } catch (error) {
      logger.error('Error preparing recipients', error);
      throw error;
    }
  }

  /**
   * Get all student recipients
   */
  async getAllStudentRecipients(type) {
    const query =
      type === 'email'
        ? `SELECT s.id, s.first_name, s.last_name, s.guardian_email as email, s.guardian_phone as phone
         FROM students s 
         WHERE s.is_active = 1 AND s.guardian_email IS NOT NULL AND s.guardian_email != ''`
        : `SELECT s.id, s.first_name, s.last_name, s.guardian_email as email, s.guardian_phone as phone
         FROM students s 
         WHERE s.is_active = 1 AND s.guardian_phone IS NOT NULL AND s.guardian_phone != ''`;

    const result = await databaseService.executeQuery(query);
    return result.rows || [];
  }

  /**
   * Get class student recipients
   */
  async getClassStudentRecipients(classIds, type) {
    const placeholders = classIds.map(() => '?').join(',');
    const query =
      type === 'email'
        ? `SELECT s.id, s.first_name, s.last_name, s.guardian_email as email, s.guardian_phone as phone
         FROM students s 
         WHERE s.is_active = 1 AND s.class_id IN (${placeholders}) 
         AND s.guardian_email IS NOT NULL AND s.guardian_email != ''`
        : `SELECT s.id, s.first_name, s.last_name, s.guardian_email as email, s.guardian_phone as phone
         FROM students s 
         WHERE s.is_active = 1 AND s.class_id IN (${placeholders}) 
         AND s.guardian_phone IS NOT NULL AND s.guardian_phone != ''`;

    const result = await databaseService.executeQuery(query, classIds);
    return result.rows || [];
  }

  /**
   * Get fee defaulter recipients
   */
  async getFeeDefaulterRecipients(type) {
    const query =
      type === 'email'
        ? `SELECT DISTINCT s.id, s.first_name, s.last_name, s.guardian_email as email, s.guardian_phone as phone
         FROM students s
         INNER JOIN fee_assignments fa ON s.id = fa.student_id
         LEFT JOIN payments p ON fa.id = p.fee_assignment_id
         WHERE s.is_active = 1 
         AND fa.due_date < CURDATE()
         AND (p.id IS NULL OR p.status != 'SUCCESS')
         AND s.guardian_email IS NOT NULL AND s.guardian_email != ''`
        : `SELECT DISTINCT s.id, s.first_name, s.last_name, s.guardian_email as email, s.guardian_phone as phone
         FROM students s
         INNER JOIN fee_assignments fa ON s.id = fa.student_id
         LEFT JOIN payments p ON fa.id = p.fee_assignment_id
         WHERE s.is_active = 1 
         AND fa.due_date < CURDATE()
         AND (p.id IS NULL OR p.status != 'SUCCESS')
         AND s.guardian_phone IS NOT NULL AND s.guardian_phone != ''`;

    const result = await databaseService.executeQuery(query);
    return result.rows || [];
  }

  /**
   * Get custom list recipients
   */
  async getCustomListRecipients(studentIds, type) {
    const placeholders = studentIds.map(() => '?').join(',');
    const query =
      type === 'email'
        ? `SELECT s.id, s.first_name, s.last_name, s.guardian_email as email, s.guardian_phone as phone
         FROM students s 
         WHERE s.is_active = 1 AND s.id IN (${placeholders}) 
         AND s.guardian_email IS NOT NULL AND s.guardian_email != ''`
        : `SELECT s.id, s.first_name, s.last_name, s.guardian_email as email, s.guardian_phone as phone
         FROM students s 
         WHERE s.is_active = 1 AND s.id IN (${placeholders}) 
         AND s.guardian_phone IS NOT NULL AND s.guardian_phone != ''`;

    const result = await databaseService.executeQuery(query, studentIds);
    return result.rows || [];
  }

  /**
   * Process queue for specific type
   */
  async processQueue(type) {
    if (this.processing[type] || this.queues[type].length === 0) {
      return;
    }

    this.processing[type] = true;

    try {
      const job = this.queues[type].shift();
      if (!job) {
        this.processing[type] = false;
        return;
      }

      logger.info(`Processing ${type} job`, {
        jobId: job.id,
        recipients: job.recipients.length,
        attempt: job.attempts + 1
      });

      await this.processJob(job);
    } catch (error) {
      logger.error(`Error processing ${type} queue`, error);
    } finally {
      this.processing[type] = false;
    }
  }

  /**
   * Process individual job
   */
  async processJob(job) {
    try {
      job.status = 'processing';
      job.attempts++;
      job.started_at = new Date();

      await this.updateJobInDatabase(job);

      // Process recipients in batches
      const batches = this.createBatches(job.recipients, this.batchSize[job.type]);
      const promises = [];

      for (let i = 0; i < batches.length && i < this.maxConcurrent; i++) {
        promises.push(this.processBatch(job, batches[i], i));
      }

      // Wait for all batches to complete
      await Promise.allSettled(promises);

      // Update job status
      job.status = job.results.failed === 0 ? 'completed' : 'completed_with_errors';
      job.completed_at = new Date();

      // Update statistics
      this.stats[job.type].sent += job.results.sent;
      this.stats[job.type].failed += job.results.failed;
      this.stats[job.type].pending -= job.results.total;

      await this.updateJobInDatabase(job);

      logger.info(`Job completed`, {
        jobId: job.id,
        type: job.type,
        status: job.status,
        sent: job.results.sent,
        failed: job.results.failed
      });

      this.emit('jobCompleted', { job });
    } catch (error) {
      await this.handleJobError(job, error);
    }
  }

  /**
   * Process batch of recipients
   */
  async processBatch(job, batch, batchIndex) {
    try {
      logger.info(`Processing batch ${batchIndex + 1}`, {
        jobId: job.id,
        batchSize: batch.length
      });

      const promises = batch.map(recipient => this.processRecipient(job, recipient));
      const results = await Promise.allSettled(promises);

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          job.results.sent++;
        } else {
          job.results.failed++;
          job.results.errors.push({
            recipient: batch[index],
            error: result.reason?.message || 'Unknown error'
          });
        }
      });
    } catch (error) {
      logger.error(`Error processing batch`, error);
      job.results.failed += batch.length;
    }
  }

  /**
   * Process individual recipient
   */
  async processRecipient(job, recipient) {
    try {
      const { data } = job;

      // Prepare message with template variables
      const variables = {
        student_name: `${recipient.first_name} ${recipient.last_name}`,
        first_name: recipient.first_name,
        last_name: recipient.last_name,
        ...data.template_variables
      };

      let message = data.message;

      // Replace template variables
      Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        message = message.replace(regex, variables[key]);
      });

      if (job.type === 'email') {
        const emailData = {
          to: recipient.email,
          subject: data.subject,
          message: message,
          is_html: data.is_html || false
        };

        await communicationService.sendEmail(emailData);
      } else {
        const smsData = {
          to: recipient.phone,
          message: message
        };

        await communicationService.sendSMS(smsData);
      }

      // Log successful delivery
      await this.logDelivery(job.id, recipient, 'success');
    } catch (error) {
      // Log failed delivery
      await this.logDelivery(job.id, recipient, 'failed', error.message);
      throw error;
    }
  }

  /**
   * Handle job error
   */
  async handleJobError(job, error) {
    logger.error(`Job failed`, {
      jobId: job.id,
      attempt: job.attempts,
      error: error.message
    });

    if (job.attempts < this.retryAttempts) {
      // Schedule retry
      setTimeout(() => {
        job.status = 'pending';
        this.queues[job.type].push(job);
        logger.info(`Job scheduled for retry`, {
          jobId: job.id,
          nextAttempt: job.attempts + 1
        });
      }, this.retryDelay);
    } else {
      // Mark as failed
      job.status = 'failed';
      job.error = error.message;
      job.completed_at = new Date();

      this.stats[job.type].failed += job.results.total;
      this.stats[job.type].pending -= job.results.total;

      await this.updateJobInDatabase(job);
      this.emit('jobFailed', { job, error });
    }
  }

  /**
   * Create batches from array
   */
  createBatches(array, batchSize) {
    const batches = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Store job in database
   */
  async storeJobInDatabase(job) {
    const query = `
      INSERT INTO notification_jobs (
        id, type, status, data, recipients_count, 
        created_at, attempts, results
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await databaseService.executeQuery(query, [
      job.id,
      job.type,
      job.status,
      JSON.stringify(job.data),
      job.results.total,
      job.created_at,
      job.attempts,
      JSON.stringify(job.results)
    ]);
  }

  /**
   * Update job in database
   */
  async updateJobInDatabase(job) {
    const query = `
      UPDATE notification_jobs 
      SET status = ?, attempts = ?, results = ?, 
          started_at = ?, completed_at = ?, error = ?
      WHERE id = ?
    `;

    await databaseService.executeQuery(query, [
      job.status,
      job.attempts,
      JSON.stringify(job.results),
      job.started_at,
      job.completed_at,
      job.error,
      job.id
    ]);
  }

  /**
   * Log delivery attempt
   */
  async logDelivery(jobId, recipient, status, error = null) {
    const query = `
      INSERT INTO notification_delivery_logs (
        job_id, recipient_type, recipient_id, recipient_contact,
        status, error_message, created_at
      ) VALUES (?, 'student', ?, ?, ?, ?, NOW())
    `;

    const contact = recipient.email || recipient.phone;

    await databaseService.executeQuery(query, [jobId, recipient.id, contact, status, error]);
  }

  /**
   * Clean up old completed jobs
   */
  async cleanupCompletedJobs() {
    try {
      // Remove jobs older than 30 days
      const query = `
        DELETE FROM notification_jobs 
        WHERE status IN ('completed', 'completed_with_errors', 'failed')
        AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
      `;

      const result = await databaseService.executeQuery(query);

      if (result.affectedRows > 0) {
        logger.info(`Cleaned up ${result.affectedRows} old notification jobs`);
      }
    } catch (error) {
      logger.error('Error cleaning up completed jobs', error);
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId) {
    const query = `
      SELECT * FROM notification_jobs WHERE id = ?
    `;

    const result = await databaseService.executeQuery(query, [jobId]);

    if (result.rows && result.rows.length > 0) {
      const job = result.rows[0];
      job.data = JSON.parse(job.data);
      job.results = JSON.parse(job.results);
      return job;
    }

    return null;
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    return {
      ...this.stats,
      queueLengths: {
        email: this.queues.email.length,
        sms: this.queues.sms.length
      },
      processing: this.processing
    };
  }

  /**
   * Generate unique job ID
   */
  generateJobId() {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Pause queue processing
   */
  pauseQueue(type) {
    this.processing[type] = true;
    logger.info(`${type} queue processing paused`);
  }

  /**
   * Resume queue processing
   */
  resumeQueue(type) {
    this.processing[type] = false;
    logger.info(`${type} queue processing resumed`);
  }

  /**
   * Clear queue
   */
  clearQueue(type) {
    const count = this.queues[type].length;
    this.queues[type] = [];
    logger.info(`Cleared ${count} jobs from ${type} queue`);
    return count;
  }
}

// Export singleton instance
module.exports = new NotificationQueue();
