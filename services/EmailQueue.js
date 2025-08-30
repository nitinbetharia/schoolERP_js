const { logSystem, logError } = require('../utils/logger');

/**
 * Email Queue Service
 * Handles queuing, processing, and retry logic for email sending
 */
class EmailQueue {
   constructor() {
      this.queue = [];
      this.processing = false;
      this.retryAttempts = 3;
      this.retryDelay = 5000; // 5 seconds
      this.maxQueueSize = 1000;
   }

   /**
    * Add email to queue
    * @param {Object} emailData - Email data including mailOptions and metadata
    * @returns {string} - Queue ID for tracking
    */
   addToQueue(emailData) {
      if (this.queue.length >= this.maxQueueSize) {
         throw new Error(`Email queue is full (max: ${this.maxQueueSize})`);
      }

      const queueItem = {
         id: this.generateQueueId(),
         mailOptions: emailData.mailOptions,
         metadata: emailData.metadata || {},
         attempts: 0,
         maxRetries: emailData.maxRetries || this.retryAttempts,
         priority: emailData.priority || 'normal',
         createdAt: new Date(),
         status: 'pending',
         errors: [],
      };

      // Insert based on priority
      if (queueItem.priority === 'high') {
         this.queue.unshift(queueItem);
      } else {
         this.queue.push(queueItem);
      }

      logSystem('Email added to queue', {
         queueId: queueItem.id,
         to: queueItem.mailOptions.to,
         subject: queueItem.mailOptions.subject,
         priority: queueItem.priority,
         queueLength: this.queue.length,
      });

      // Start processing if not already running
      if (!this.processing) {
         this.processQueue();
      }

      return queueItem.id;
   }

   /**
    * Process email queue
    */
   async processQueue() {
      if (this.processing || this.queue.length === 0) {
         return;
      }

      this.processing = true;
      logSystem('Starting email queue processing', { queueLength: this.queue.length });

      while (this.queue.length > 0) {
         const queueItem = this.queue.shift();

         try {
            await this.processQueueItem(queueItem);
         } catch (error) {
            logError(error, {
               context: 'ProcessQueueItem',
               queueId: queueItem.id,
               attempt: queueItem.attempts,
            });
         }
      }

      this.processing = false;
      logSystem('Email queue processing completed');
   }

   /**
    * Process individual queue item
    * @param {Object} queueItem - Queue item to process
    */
   async processQueueItem(queueItem) {
      queueItem.attempts++;
      queueItem.status = 'processing';

      try {
         // Get transport from EmailTransport service
         const emailTransport = require('./EmailTransport');

         if (!emailTransport.isInitialized) {
            throw new Error('Email transport not initialized');
         }

         // Send email
         const result = await emailTransport.sendMail(queueItem.mailOptions);

         queueItem.status = 'sent';
         queueItem.sentAt = new Date();
         queueItem.messageId = result.messageId;

         logSystem('Email sent successfully from queue', {
            queueId: queueItem.id,
            messageId: result.messageId,
            to: queueItem.mailOptions.to,
            attempts: queueItem.attempts,
         });

         // Call success callback if provided
         if (queueItem.metadata.onSuccess) {
            try {
               await queueItem.metadata.onSuccess(result, queueItem);
            } catch (callbackError) {
               logError(callbackError, {
                  context: 'QueueSuccessCallback',
                  queueId: queueItem.id,
               });
            }
         }
      } catch (error) {
         queueItem.errors.push({
            attempt: queueItem.attempts,
            error: error.message,
            timestamp: new Date(),
         });

         // Check if we should retry
         if (queueItem.attempts < queueItem.maxRetries) {
            queueItem.status = 'retrying';

            logSystem('Email send failed, scheduling retry', {
               queueId: queueItem.id,
               attempt: queueItem.attempts,
               maxRetries: queueItem.maxRetries,
               error: error.message,
            });

            // Add back to queue after delay
            setTimeout(() => {
               this.queue.unshift(queueItem); // High priority for retry
               if (!this.processing) {
                  this.processQueue();
               }
            }, this.retryDelay * queueItem.attempts); // Exponential backoff
         } else {
            queueItem.status = 'failed';
            queueItem.failedAt = new Date();

            logError(error, {
               context: 'EmailQueueFinalFailure',
               queueId: queueItem.id,
               attempts: queueItem.attempts,
               to: queueItem.mailOptions.to,
            });

            // Call error callback if provided
            if (queueItem.metadata.onError) {
               try {
                  await queueItem.metadata.onError(error, queueItem);
               } catch (callbackError) {
                  logError(callbackError, {
                     context: 'QueueErrorCallback',
                     queueId: queueItem.id,
                  });
               }
            }
         }
      }
   }

   /**
    * Get queue status
    * @returns {Object} - Current queue status
    */
   getStatus() {
      const statusCounts = {
         pending: 0,
         processing: 0,
         retrying: 0,
      };

      this.queue.forEach((item) => {
         statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
      });

      return {
         isProcessing: this.processing,
         totalItems: this.queue.length,
         maxQueueSize: this.maxQueueSize,
         retryAttempts: this.retryAttempts,
         retryDelay: this.retryDelay,
         statusCounts,
         oldestItem: this.queue.length > 0 ? this.queue[this.queue.length - 1].createdAt : null,
      };
   }

   /**
    * Clear queue
    * @param {string} status - Optional status filter
    */
   clearQueue(status = null) {
      const originalLength = this.queue.length;

      if (status) {
         this.queue = this.queue.filter((item) => item.status !== status);
      } else {
         this.queue = [];
      }

      const clearedCount = originalLength - this.queue.length;

      logSystem('Email queue cleared', {
         clearedCount,
         remainingCount: this.queue.length,
         statusFilter: status,
      });

      return clearedCount;
   }

   /**
    * Generate unique queue ID
    * @returns {string} - Unique ID
    */
   generateQueueId() {
      return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
   }

   /**
    * Get queue item by ID
    * @param {string} queueId - Queue ID
    * @returns {Object|null} - Queue item or null if not found
    */
   getQueueItem(queueId) {
      return this.queue.find((item) => item.id === queueId) || null;
   }

   /**
    * Remove queue item by ID
    * @param {string} queueId - Queue ID
    * @returns {boolean} - True if removed
    */
   removeQueueItem(queueId) {
      const index = this.queue.findIndex((item) => item.id === queueId);
      if (index !== -1) {
         this.queue.splice(index, 1);
         logSystem('Email removed from queue', { queueId });
         return true;
      }
      return false;
   }
}

// Export singleton instance
module.exports = new EmailQueue();
