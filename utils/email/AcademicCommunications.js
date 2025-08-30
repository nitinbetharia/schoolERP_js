const { createTransporter, createEmailTemplate } = require('./EmailCore');
const { logger } = require('../logger');

/**
 * Email Service - Academic Communications
 * Handles academic-related emails (attendance, academic performance, etc.)
 * Focused on student academic progress and school activity communications
 *
 * Following copilot instructions: CommonJS, async/await, proper error handling
 */

/**
 * Send attendance notification email to parents
 * @param {string} parentEmail - Parent's email address
 * @param {string} studentName - Student's full name
 * @param {Object} attendanceData - Attendance information
 * @param {Object} schoolData - School information
 * @returns {Promise<Object>} Send result with success status
 */
async function sendAttendanceNotification(parentEmail, studentName, attendanceData, schoolData = {}) {
   try {
      const emailTransporter = createTransporter();
      if (!emailTransporter) {
         logger.warn('Email service not available - skipping attendance notification');
         return { success: false, reason: 'Email service not configured' };
      }

      const isAbsent = attendanceData.status === 'ABSENT';
      const attendanceDate = new Date(attendanceData.date).toLocaleDateString();

      const statusMessage = isAbsent
         ? 'Your child was marked absent today. If incorrect, contact the school immediately.'
         : 'Your child was present at school today.';

      const statusColor = isAbsent ? 'red' : 'green';
      const checkInRow = attendanceData.checkInTime
         ? `<li><strong>Check-in Time:</strong> ${attendanceData.checkInTime}</li>`
         : '';
      const checkOutRow = attendanceData.checkOutTime
         ? `<li><strong>Check-out Time:</strong> ${attendanceData.checkOutTime}</li>`
         : '';
      const remarksRow = attendanceData.remarks ? `<li><strong>Remarks:</strong> ${attendanceData.remarks}</li>` : '';

      const template = createEmailTemplate(
         `Attendance Notification - ${studentName}`,
         `
        <p>This is an automated attendance notification for your child.</p>
        
        <div class="highlight">
          <h3>Attendance Details:</h3>
          <ul>
            <li><strong>Student Name:</strong> ${studentName}</li>
            <li><strong>Date:</strong> ${attendanceDate}</li>
            <li><strong>Status:</strong> <span style="color: ${statusColor};">${attendanceData.status}</span></li>
            ${checkInRow}
            ${checkOutRow}
            ${remarksRow}
          </ul>
        </div>
        
        <p style="color: ${statusColor};"><strong>${statusMessage}</strong></p>
        
        <p>If you have any concerns about your child's attendance, please contact the class 
        teacher or school office.</p>
        
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
         ...template,
      };

      const result = await emailTransporter.sendMail(mailOptions);

      logger.info('Attendance notification email sent successfully', {
         to: parentEmail,
         messageId: result.messageId,
         studentName,
         status: attendanceData.status,
      });

      return { success: true, messageId: result.messageId };
   } catch (error) {
      logger.error('Failed to send attendance notification email', {
         error: error.message,
         parentEmail,
         studentName,
      });
      throw error;
   }
}

module.exports = {
   sendAttendanceNotification,
};
