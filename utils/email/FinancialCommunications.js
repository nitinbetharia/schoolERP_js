const { createTransporter, createEmailTemplate } = require('./EmailCore');
const { logger } = require('../logger');

/**
 * Email Service - Financial Communications
 * Handles fee-related emails (reminders, receipts, payment notifications)
 * Focused on financial transaction and payment communications
 *
 * Following copilot instructions: CommonJS, async/await, proper error handling
 */

/**
 * Send fee payment reminder email to students/parents
 * @param {string} studentEmail - Student or parent email address
 * @param {string} studentName - Student's full name
 * @param {Object} feeDetails - Fee information (amount, dueDate, type)
 * @param {Object} schoolData - School information
 * @returns {Promise<Object>} Send result with success status
 */
async function sendFeeReminder(studentEmail, studentName, feeDetails, schoolData = {}) {
   try {
      const emailTransporter = createTransporter();
      if (!emailTransporter) {
         logger.warn('Email service not available - skipping fee reminder');
         return { success: false, reason: 'Email service not configured' };
      }

      const dueDate = new Date(feeDetails.dueDate);
      const isOverdue = dueDate < new Date();

      const urgentPrefix = isOverdue ? 'URGENT: Overdue' : '';
      const subjectLine = `${urgentPrefix} Fee Payment Reminder`.trim();

      const urgentText = isOverdue ? 'URGENT reminder for an overdue' : 'friendly reminder for a pending';

      const statusMessage = isOverdue
         ? 'This payment is overdue. Please make the payment immediately.'
         : 'Please make the payment by the due date to avoid any late fees.';

      const template = createEmailTemplate(
         subjectLine,
         `
        <p>This is a <strong>${urgentText}</strong> fee payment.</p>
        
        <div class="highlight">
          <h3>Fee Payment Details:</h3>
          <ul>
            <li><strong>Student Name:</strong> ${studentName}</li>
            <li><strong>Fee Type:</strong> ${feeDetails.type || 'General Fee'}</li>
            <li><strong>Amount:</strong> ₹${feeDetails.amount}</li>
            <li><strong>Due Date:</strong> ${dueDate.toLocaleDateString()}</li>
            ${isOverdue ? '<li style="color: red;"><strong>Status:</strong> OVERDUE</li>' : ''}
          </ul>
        </div>
        
        <p><strong>${statusMessage}</strong></p>
        
        <p><strong>Payment Methods:</strong></p>
        <ul>
          <li>Cash payment at school office</li>
          <li>Bank transfer (contact office for details)</li>
          <li>Online payment (if available)</li>
        </ul>
        
        <p>If you have already made the payment, please ignore this reminder and contact the 
        school office with your payment receipt.</p>
        
        <p>For any queries regarding this payment, please contact the school office during 
        working hours.</p>
      `,
         studentName,
         schoolData
      );

      const mailOptions = {
         from: `"${schoolData.name || 'School ERP System'}" <${process.env.SMTP_USER}>`,
         to: studentEmail,
         ...template,
      };

      const result = await emailTransporter.sendMail(mailOptions);

      logger.info('Fee reminder email sent successfully', {
         to: studentEmail,
         messageId: result.messageId,
         studentName,
         amount: feeDetails.amount,
         isOverdue,
      });

      return { success: true, messageId: result.messageId };
   } catch (error) {
      logger.error('Failed to send fee reminder email', {
         error: error.message,
         studentEmail,
         studentName,
      });
      throw error;
   }
}

/**
 * Send fee receipt email with PDF attachment
 * @param {string} studentEmail - Student or parent email address
 * @param {string} studentName - Student's full name
 * @param {Object} receiptData - Receipt information
 * @param {string} receiptPdfPath - Path to receipt PDF file
 * @param {Object} schoolData - School information
 * @returns {Promise<Object>} Send result with success status
 */
async function sendFeeReceipt(studentEmail, studentName, receiptData, receiptPdfPath, schoolData = {}) {
   try {
      const emailTransporter = createTransporter();
      if (!emailTransporter) {
         logger.warn('Email service not available - skipping fee receipt');
         return { success: false, reason: 'Email service not configured' };
      }

      const paymentDate = new Date(receiptData.date).toLocaleDateString();

      const template = createEmailTemplate(
         'Fee Payment Receipt',
         `
        <p>Thank you for your fee payment! Your payment has been successfully processed.</p>
        
        <div class="highlight">
          <h3>Payment Receipt Details:</h3>
          <ul>
            <li><strong>Receipt Number:</strong> ${receiptData.receiptNo}</li>
            <li><strong>Student Name:</strong> ${studentName}</li>
            <li><strong>Amount Paid:</strong> ₹${receiptData.amount}</li>
            <li><strong>Payment Date:</strong> ${paymentDate}</li>
            <li><strong>Payment Method:</strong> ${receiptData.paymentMethod || 'N/A'}</li>
          </ul>
        </div>
        
        <p>Please find your official receipt attached to this email as a PDF document.</p>
        
        <p><strong>Important:</strong></p>
        <ul>
          <li>Please keep this receipt for your records</li>
          <li>This serves as proof of payment</li>
          <li>Present this receipt if requested by school administration</li>
        </ul>
        
        <p>If you have any questions about this payment or need assistance, please contact 
        the school office.</p>
        
        <p>Thank you for your prompt payment!</p>
      `,
         studentName,
         schoolData
      );

      const mailOptions = {
         from: `"${schoolData.name || 'School ERP System'}" <${process.env.SMTP_USER}>`,
         to: studentEmail,
         attachments: receiptPdfPath
            ? [
                 {
                    filename: `fee-receipt-${receiptData.receiptNo}.pdf`,
                    path: receiptPdfPath,
                    contentType: 'application/pdf',
                 },
              ]
            : [],
         ...template,
      };

      const result = await emailTransporter.sendMail(mailOptions);

      logger.info('Fee receipt email sent successfully', {
         to: studentEmail,
         messageId: result.messageId,
         studentName,
         receiptNo: receiptData.receiptNo,
      });

      return { success: true, messageId: result.messageId };
   } catch (error) {
      logger.error('Failed to send fee receipt email', {
         error: error.message,
         studentEmail,
         studentName,
      });
      throw error;
   }
}

module.exports = {
   sendFeeReminder,
   sendFeeReceipt,
};
