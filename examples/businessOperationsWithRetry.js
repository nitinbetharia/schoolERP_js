/**
 * Example: Critical Business Operations with Database Retries
 * This file shows how to implement retry logic for important business operations
 */

const { withCriticalRetry, withTransactionRetry } = require('../utils/databaseRetry');
const { logSystem, logError } = require('../utils/logger');

/**
 * Example: Student Enrollment with Retry Logic
 * This is a critical operation that should succeed even if there are temporary connection issues
 */
async function enrollStudentWithRetry(studentData, tenantDB) {
   return await withCriticalRetry(
      async () => {
         // Start transaction
         const transaction = await tenantDB.transaction();

         try {
            // Create student record
            const student = await tenantDB.models.Student.create(studentData, { transaction });

            // Create enrollment record
            const enrollment = await tenantDB.models.StudentEnrollment.create(
               {
                  student_id: student.id,
                  academic_year_id: studentData.academic_year_id,
                  class_id: studentData.class_id,
                  section_id: studentData.section_id,
                  roll_number: studentData.roll_number,
                  enrollment_date: new Date(),
                  status: 'active',
               },
               { transaction }
            );

            // Commit transaction
            await transaction.commit();

            logSystem('Student enrolled successfully', {
               studentId: student.id,
               enrollmentId: enrollment.id,
               operation: 'student_enrollment',
            });

            return { student, enrollment };
         } catch (error) {
            await transaction.rollback();
            throw error;
         }
      },
      {
         operation: 'student_enrollment',
         studentName: studentData.first_name + ' ' + studentData.last_name,
         context: 'critical_business_operation',
      }
   );
}

/**
 * Example: Fee Payment Processing with Retry Logic
 */
async function processFeePaymentWithRetry(paymentData, tenantDB) {
   return await withTransactionRetry(
      async () => {
         const transaction = await tenantDB.transaction();

         try {
            // Create payment record
            const payment = await tenantDB.models.FeePayment.create(paymentData, { transaction });

            // Update student fee balance
            const student = await tenantDB.models.Student.findByPk(paymentData.student_id, { transaction });
            if (!student) {
               throw new Error('Student not found');
            }

            // Update balance (assuming there's a fee_balance field)
            const newBalance = (student.fee_balance || 0) - paymentData.amount;
            await student.update({ fee_balance: newBalance }, { transaction });

            // Create transaction log
            await tenantDB.models.FeeTransaction.create(
               {
                  student_id: paymentData.student_id,
                  payment_id: payment.id,
                  amount: paymentData.amount,
                  type: 'payment',
                  balance_after: newBalance,
                  transaction_date: new Date(),
               },
               { transaction }
            );

            await transaction.commit();

            return { payment, newBalance };
         } catch (error) {
            await transaction.rollback();
            throw error;
         }
      },
      {
         operation: 'fee_payment_processing',
         studentId: paymentData.student_id,
         amount: paymentData.amount,
         context: 'financial_transaction',
      }
   );
}

/**
 * Example: Attendance Marking with Retry (Less Critical)
 */
async function markAttendanceWithRetry(attendanceData, tenantDB) {
   return await withSequelizeRetry(
      async () => {
         // This is less critical, so we use regular retry
         return await tenantDB.models.Attendance.create(attendanceData);
      },
      {
         operation: 'attendance_marking',
         studentId: attendanceData.student_id,
         date: attendanceData.attendance_date,
         context: 'attendance_operation',
      }
   );
}

/**
 * Example: Bulk Operations with Retry
 */
async function bulkUpdateWithRetry(updates, model, tenantDB) {
   return await withCriticalRetry(
      async () => {
         const transaction = await tenantDB.transaction();

         try {
            const results = [];

            for (const update of updates) {
               const result = await model.update(update.data, {
                  where: update.where,
                  transaction,
               });
               results.push(result);
            }

            await transaction.commit();
            return results;
         } catch (error) {
            await transaction.rollback();
            throw error;
         }
      },
      {
         operation: 'bulk_update',
         updateCount: updates.length,
         model: model.name,
         context: 'bulk_operation',
      }
   );
}

/**
 * Example: Database Query with Simple Retry
 */
async function queryWithRetry(query, params, tenantDB) {
   return await withSequelizeRetry(
      async () => {
         return await tenantDB.query(query, {
            replacements: params,
            type: tenantDB.QueryTypes.SELECT,
         });
      },
      {
         operation: 'custom_query',
         query: query.substring(0, 50) + '...', // Log first 50 chars
         context: 'database_query',
      }
   );
}

module.exports = {
   enrollStudentWithRetry,
   processFeePaymentWithRetry,
   markAttendanceWithRetry,
   bulkUpdateWithRetry,
   queryWithRetry,
};
