const nodemailer = require('nodemailer');
const path = require('path');
const { logger } = require('./logger');

/**
 * Email Service - Send emails for school ERP
 * Simple, secure, reusable functions following DRY principles
 */

// Cache transporter to avoid recreating
let transporter = null;

/**
 * Create reusable email transporter (DRY principle)
 */
function createTransporter() {
   if (transporter) {
      return transporter;
   }
  
   // Validate required environment variables
   const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD'];
   const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
   if (missingVars.length > 0) {
      logger.warn('Email service not configured - missing environment variables', { missingVars });
      return null;
   }
  
   try {
      transporter = nodemailer.createTransporter({
         host: process.env.SMTP_HOST,
         port: parseInt(process.env.SMTP_PORT) || 587,
         secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
         auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
         },
         // Additional security options
         tls: {
            rejectUnauthorized: process.env.NODE_ENV === 'production'
         }
      });
    
      logger.info('Email transporter created successfully');
      return transporter;
    
   } catch (error) {
      logger.error('Failed to create email transporter', error);
      return null;
   }
}

/**
 * Common email template function (DRY principle)
 */
function createEmailTemplate(subject, content, recipientName, schoolData = {}) {
   const schoolName = schoolData.name || 'School ERP System';
  
   return {
      subject: subject,
      html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #366092; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 30px; }
          .footer { background-color: #666; color: white; padding: 15px; text-align: center; font-size: 12px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #366092; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .highlight { background-color: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${schoolName}</h1>
          </div>
          <div class="content">
            <p>Dear ${recipientName},</p>
            <div>${content}</div>
            <br>
            <p>Best regards,<br>
            <strong>${schoolName}</strong><br>
            School Administration</p>
          </div>
          <div class="footer">
            <p>This is an automated email from ${schoolName}. Please do not reply to this email.</p>
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </body>
      </html>
    `,
      text: `
      ${schoolName}
      
      Dear ${recipientName},
      
      ${content.replace(/<[^>]*>/g, '')}
      
      Best regards,
      ${schoolName}
      School Administration
      
      This is an automated email. Please do not reply.
    `
   };
}

/**
 * Send welcome email to new user
 */
async function sendWelcomeEmail(userEmail, userName, temporaryPassword, schoolData = {}) {
   try {
      const emailTransporter = createTransporter();
      if (!emailTransporter) {
         logger.warn('Email service not available - skipping welcome email');
         return { success: false, reason: 'Email service not configured' };
      }
    
      const template = createEmailTemplate(
         'Welcome to School ERP System',
         `
        <p>Your account has been created successfully in our School ERP System.</p>
        
        <div class="highlight">
          <h3>Your Login Credentials:</h3>
          <ul>
            <li><strong>Email:</strong> ${userEmail}</li>
            <li><strong>Temporary Password:</strong> ${temporaryPassword}</li>
          </ul>
        </div>
        
        <p>For your security, please log in and change your password immediately.</p>
        
        <p><strong>Important Security Notes:</strong></p>
        <ul>
          <li>Never share your login credentials with anyone</li>
          <li>Use a strong, unique password</li>
          <li>Log out when you're finished using the system</li>
        </ul>
        
        <p>If you have any questions or need assistance, please contact the school administration.</p>
      `,
         userName,
         schoolData
      );
    
      const mailOptions = {
         from: `"${schoolData.name || 'School ERP System'}" <${process.env.SMTP_USER}>`,
         to: userEmail,
         ...template
      };
    
      const result = await emailTransporter.sendMail(mailOptions);
    
      logger.info('Welcome email sent successfully', { 
         to: userEmail, 
         messageId: result.messageId,
         userName 
      });
    
      return { success: true, messageId: result.messageId };
    
   } catch (error) {
      logger.error('Failed to send welcome email', { error: error.message, userEmail, userName });
      throw error;
   }
}

/**
 * Send fee payment reminder email
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
    
      const template = createEmailTemplate(
         `${isOverdue ? 'URGENT: Overdue' : ''} Fee Payment Reminder`,
         `
        <p>This is a ${isOverdue ? '<strong>URGENT</strong> reminder for an overdue' : 'friendly reminder for a pending'} fee payment.</p>
        
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
        
        ${isOverdue ? 
      '<p style="color: red;"><strong>This payment is overdue. Please make the payment immediately to avoid any inconvenience.</strong></p>' :
      '<p>Please make the payment by the due date to avoid any late fees.</p>'
}
        
        <p><strong>Payment Methods:</strong></p>
        <ul>
          <li>Cash payment at school office</li>
          <li>Bank transfer (contact office for details)</li>
          <li>Online payment (if available)</li>
        </ul>
        
        <p>If you have already made the payment, please ignore this reminder and contact the school office with your payment receipt.</p>
        
        <p>For any queries regarding this payment, please contact the school office during working hours.</p>
      `,
         studentName,
         schoolData
      );
    
      const mailOptions = {
         from: `"${schoolData.name || 'School ERP System'}" <${process.env.SMTP_USER}>`,
         to: studentEmail,
         ...template
      };
    
      const result = await emailTransporter.sendMail(mailOptions);
    
      logger.info('Fee reminder email sent successfully', { 
         to: studentEmail, 
         messageId: result.messageId,
         studentName,
         amount: feeDetails.amount,
         isOverdue
      });
    
      return { success: true, messageId: result.messageId };
    
   } catch (error) {
      logger.error('Failed to send fee reminder email', { error: error.message, studentEmail, studentName });
      throw error;
   }
}

/**
 * Send fee receipt email with PDF attachment
 */
async function sendFeeReceipt(studentEmail, studentName, receiptData, receiptPdfPath, schoolData = {}) {
   try {
      const emailTransporter = createTransporter();
      if (!emailTransporter) {
         logger.warn('Email service not available - skipping fee receipt');
         return { success: false, reason: 'Email service not configured' };
      }
    
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
            <li><strong>Payment Date:</strong> ${new Date(receiptData.date).toLocaleDateString()}</li>
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
        
        <p>If you have any questions about this payment or need assistance, please contact the school office.</p>
        
        <p>Thank you for your prompt payment!</p>
      `,
         studentName,
         schoolData
      );
    
      const mailOptions = {
         from: `"${schoolData.name || 'School ERP System'}" <${process.env.SMTP_USER}>`,
         to: studentEmail,
         attachments: receiptPdfPath ? [
            {
               filename: `fee-receipt-${receiptData.receiptNo}.pdf`,
               path: receiptPdfPath,
               contentType: 'application/pdf'
            }
         ] : [],
         ...template
      };
    
      const result = await emailTransporter.sendMail(mailOptions);
    
      logger.info('Fee receipt email sent successfully', { 
         to: studentEmail, 
         messageId: result.messageId,
         studentName,
         receiptNo: receiptData.receiptNo
      });
    
      return { success: true, messageId: result.messageId };
    
   } catch (error) {
      logger.error('Failed to send fee receipt email', { error: error.message, studentEmail, studentName });
      throw error;
   }
}

/**
 * Send attendance notification to parents
 */
async function sendAttendanceNotification(parentEmail, studentName, attendanceData, schoolData = {}) {
   try {
      const emailTransporter = createTransporter();
      if (!emailTransporter) {
         logger.warn('Email service not available - skipping attendance notification');
         return { success: false, reason: 'Email service not configured' };
      }
    
      const isAbsent = attendanceData.status === 'ABSENT';
    
      const template = createEmailTemplate(
         `Attendance Notification - ${studentName}`,
         `
        <p>This is an automated attendance notification for your child.</p>
        
        <div class="highlight">
          <h3>Attendance Details:</h3>
          <ul>
            <li><strong>Student Name:</strong> ${studentName}</li>
            <li><strong>Date:</strong> ${new Date(attendanceData.date).toLocaleDateString()}</li>
            <li><strong>Status:</strong> <span style="color: ${isAbsent ? 'red' : 'green'};">${attendanceData.status}</span></li>
            ${attendanceData.checkInTime ? `<li><strong>Check-in Time:</strong> ${attendanceData.checkInTime}</li>` : ''}
            ${attendanceData.checkOutTime ? `<li><strong>Check-out Time:</strong> ${attendanceData.checkOutTime}</li>` : ''}
            ${attendanceData.remarks ? `<li><strong>Remarks:</strong> ${attendanceData.remarks}</li>` : ''}
          </ul>
        </div>
        
        ${isAbsent ? 
      '<p style="color: red;"><strong>Your child was marked absent today. If this is incorrect, please contact the school immediately.</strong></p>' :
      '<p style="color: green;">Your child was present at school today.</p>'
}
        
        <p>If you have any concerns about your child\'s attendance, please contact the class teacher or school office.</p>
        
        <p><strong>School Contact Information:</strong><br>
        Phone: ${schoolData.phone || 'Contact school office'}<br>
        Email: ${schoolData.email || 'Contact school office'}</p>
      `,
         'Parent/Guardian',
         schoolData
      );
    
      const mailOptions = {
         from: `"${schoolData.name || 'School ERP System'}" <${process.env.SMTP_USER}>`,
         to: parentEmail,
         ...template
      };
    
      const result = await emailTransporter.sendMail(mailOptions);
    
      logger.info('Attendance notification email sent successfully', { 
         to: parentEmail, 
         messageId: result.messageId,
         studentName,
         status: attendanceData.status
      });
    
      return { success: true, messageId: result.messageId };
    
   } catch (error) {
      logger.error('Failed to send attendance notification email', { error: error.message, parentEmail, studentName });
      throw error;
   }
}

/**
 * Test email configuration
 */
async function testEmailConfiguration() {
   try {
      const emailTransporter = createTransporter();
      if (!emailTransporter) {
         return { success: false, error: 'Email service not configured' };
      }
    
      // Verify connection
      await emailTransporter.verify();
    
      logger.info('Email configuration test successful');
      return { success: true, message: 'Email service is properly configured' };
    
   } catch (error) {
      logger.error('Email configuration test failed', error);
      return { success: false, error: error.message };
   }
}

module.exports = {
   sendWelcomeEmail,
   sendFeeReminder,
   sendFeeReceipt,
   sendAttendanceNotification,
   testEmailConfiguration
};