/**
 * Email Service - Main Coordinator
 * Central email service coordinating all specialized communication modules
 * 
 * Following modular architecture established by copilot refactoring:
 * - EmailCore: Infrastructure (transporter, templates, configuration)
 * - UserCommunications: User account related emails
 * - FinancialCommunications: Fee and payment related emails
 * - AcademicCommunications: Academic progress and attendance emails
 * - SystemCommunications: System alerts and administrative emails
 */

const { createTransporter, createEmailTemplate, testEmailConfiguration } = require('./email/EmailCore');
const { sendWelcomeEmail } = require('./email/UserCommunications');
const { sendFeeReminder, sendFeeReceipt } = require('./email/FinancialCommunications');
const { sendAttendanceNotification } = require('./email/AcademicCommunications');
const { sendErrorAlert } = require('./email/SystemCommunications');

/**
 * Main Email Service - Exports all email functionality
 * Maintains backward compatibility while providing modular architecture
 */
module.exports = {
   // Core email infrastructure
   createTransporter,
   createEmailTemplate,
   testEmailConfiguration,
   
   // User communication functions
   sendWelcomeEmail,
   
   // Financial communication functions
   sendFeeReminder,
   sendFeeReceipt,
   
   // Academic communication functions
   sendAttendanceNotification,
   
   // System communication functions
   sendErrorAlert,
};
