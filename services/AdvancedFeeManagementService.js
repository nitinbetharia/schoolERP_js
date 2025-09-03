/**
 * Advanced Fee Management Service
 * Enhanced service for comprehensive fee operations including installments, penalties, and advanced fee types
 */

const { logger } = require('../utils/logger');
const FeeManagementService = require('./FeeManagementService');

class AdvancedFeeManagementService extends FeeManagementService {
   constructor() {
      super();
      this.installmentCache = new Map();
      this.penaltyRules = new Map();
   }

   /**
    * Create installment plan for a student
    */
   async createInstallmentPlan(studentId, feeConfigId, installmentDetails, tenantDb) {
      try {
         const { numberOfInstallments, installmentAmount, dueDates, penaltyRate } = installmentDetails;

         const installments = [];
         for (let i = 0; i < numberOfInstallments; i++) {
            const installment = {
               student_id: studentId,
               fee_config_id: feeConfigId,
               installment_number: i + 1,
               amount: installmentAmount,
               due_date: dueDates[i],
               penalty_rate: penaltyRate || 2, // 2% default
               status: 'pending',
               created_at: new Date(),
               updated_at: new Date()
            };
            installments.push(installment);
         }

         const FeeInstallment = tenantDb.models.FeeInstallment;
         const created = await FeeInstallment.bulkCreate(installments);

         logger.info('Installment plan created', {
            studentId,
            installmentCount: numberOfInstallments,
            totalAmount: numberOfInstallments * installmentAmount
         });

         return created;
      } catch (error) {
         logger.error('Failed to create installment plan', { error: error.message, studentId });
         throw error;
      }
   }

   /**
    * Calculate penalty for overdue fees
    */
   async calculatePenalty(installmentId, tenantDb) {
      try {
         const FeeInstallment = tenantDb.models.FeeInstallment;
         const installment = await FeeInstallment.findByPk(installmentId);

         if (!installment || installment.status === 'paid') {
            return { penalty: 0, message: 'No penalty applicable' };
         }

         const today = new Date();
         const dueDate = new Date(installment.due_date);
         const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

         if (daysOverdue <= 0) {
            return { penalty: 0, message: 'Not overdue' };
         }

         const penaltyAmount = (installment.amount * (installment.penalty_rate / 100)) * Math.ceil(daysOverdue / 30);

         return {
            penalty: penaltyAmount,
            daysOverdue,
            message: `${daysOverdue} days overdue, penalty: ${penaltyAmount}`
         };
      } catch (error) {
         logger.error('Failed to calculate penalty', { error: error.message, installmentId });
         throw error;
      }
   }

   /**
    * Process advanced fee payment with installment handling
    */
   async processAdvancedPayment(paymentData, tenantDb) {
      const transaction = await tenantDb.transaction();
      
      try {
         const { studentId, paymentAmount, paymentMethod, installmentIds } = paymentData;

         let remainingAmount = paymentAmount;
         const processedInstallments = [];
         const FeeInstallment = tenantDb.models.FeeInstallment;
         const FeeTransaction = tenantDb.models.FeeTransaction;

         // Process installments in order of due date
         for (const installmentId of installmentIds) {
            if (remainingAmount <= 0) break;

            const installment = await FeeInstallment.findByPk(installmentId, { transaction });
            if (!installment || installment.status === 'paid') continue;

            const penaltyInfo = await this.calculatePenalty(installmentId, tenantDb);
            const totalDue = installment.amount + penaltyInfo.penalty;

            let paidAmount, status;
            if (remainingAmount >= totalDue) {
               paidAmount = totalDue;
               status = 'paid';
               remainingAmount -= totalDue;
            } else {
               paidAmount = remainingAmount;
               status = 'partial';
               remainingAmount = 0;
            }

            // Update installment
            await installment.update({
               paid_amount: (installment.paid_amount || 0) + paidAmount,
               penalty_paid: penaltyInfo.penalty,
               status: status,
               payment_date: new Date(),
               updated_at: new Date()
            }, { transaction });

            // Create fee transaction
            const feeTransaction = await FeeTransaction.create({
               student_id: studentId,
               installment_id: installmentId,
               amount: paidAmount,
               penalty_amount: penaltyInfo.penalty,
               payment_method: paymentMethod,
               payment_date: new Date(),
               transaction_id: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
               status: 'completed',
               created_at: new Date(),
               updated_at: new Date()
            }, { transaction });

            processedInstallments.push({
               installmentId,
               paidAmount,
               penalty: penaltyInfo.penalty,
               transactionId: feeTransaction.id
            });
         }

         await transaction.commit();

         logger.info('Advanced payment processed', {
            studentId,
            totalAmount: paymentAmount,
            installmentsProcessed: processedInstallments.length
         });

         return {
            success: true,
            processedInstallments,
            remainingAmount
         };

      } catch (error) {
         await transaction.rollback();
         logger.error('Failed to process advanced payment', { error: error.message });
         throw error;
      }
   }

   /**
    * Generate fee structure with multiple fee types
    */
   async generateAdvancedFeeStructure(classId, academicYearId, feeTypes, tenantDb) {
      try {
         const feeStructure = {
           class_id: classId,
           academic_year_id: academicYearId,
           fee_types: {},
           total_annual_fee: 0,
           installment_options: []
         };

         // Calculate fee types
         for (const feeType of feeTypes) {
            const { type, amount, frequency, mandatory } = feeType;
            
            let annualAmount;
            switch (frequency) {
               case 'monthly':
                  annualAmount = amount * 12;
                  break;
               case 'quarterly':
                  annualAmount = amount * 4;
                  break;
               case 'half-yearly':
                  annualAmount = amount * 2;
                  break;
               case 'annual':
                  annualAmount = amount;
                  break;
               default:
                  annualAmount = amount;
            }

            feeStructure.fee_types[type] = {
               amount,
               frequency,
               annual_amount: annualAmount,
               mandatory
            };

            if (mandatory) {
               feeStructure.total_annual_fee += annualAmount;
            }
         }

         // Generate installment options
         const installmentOptions = [
            { installments: 1, description: 'Annual Payment', discount: 5 },
            { installments: 2, description: 'Half-Yearly Payment', discount: 3 },
            { installments: 4, description: 'Quarterly Payment', discount: 0 },
            { installments: 12, description: 'Monthly Payment', discount: 0, penalty_rate: 2 }
         ];

         feeStructure.installment_options = installmentOptions;

         const FeeConfiguration = tenantDb.models.FeeConfiguration;
         const savedConfig = await FeeConfiguration.create({
            class_id: classId,
            academic_year_id: academicYearId,
            fee_structure: JSON.stringify(feeStructure),
            created_at: new Date(),
            updated_at: new Date()
         });

         logger.info('Advanced fee structure generated', {
            classId,
            academicYearId,
            totalFee: feeStructure.total_annual_fee
         });

         return savedConfig;

      } catch (error) {
         logger.error('Failed to generate advanced fee structure', { error: error.message });
         throw error;
      }
   }

   /**
    * Get comprehensive fee analytics
    */
   async getFeeAnalytics(filters, tenantDb) {
      try {
         const { startDate, endDate, classId, studentId } = filters;

         const FeeTransaction = tenantDb.models.FeeTransaction;
         const FeeInstallment = tenantDb.models.FeeInstallment;

         // Collection analytics
         const collections = await FeeTransaction.findAll({
            where: {
               payment_date: {
                  [tenantDb.Sequelize.Op.between]: [startDate, endDate]
               },
               ...(studentId && { student_id: studentId })
            },
            attributes: [
               [tenantDb.Sequelize.fn('SUM', tenantDb.Sequelize.col('amount')), 'total_collected'],
               [tenantDb.Sequelize.fn('SUM', tenantDb.Sequelize.col('penalty_amount')), 'total_penalty'],
               [tenantDb.Sequelize.fn('COUNT', tenantDb.Sequelize.col('id')), 'transaction_count']
            ]
         });

         // Outstanding analytics
         const outstanding = await FeeInstallment.findAll({
            where: {
               status: ['pending', 'partial'],
               due_date: {
                  [tenantDb.Sequelize.Op.lte]: new Date()
               }
            },
            attributes: [
               [tenantDb.Sequelize.fn('SUM', tenantDb.Sequelize.col('amount')), 'total_outstanding'],
               [tenantDb.Sequelize.fn('COUNT', tenantDb.Sequelize.col('id')), 'overdue_count']
            ]
         });

         return {
            collections: collections[0] || { total_collected: 0, total_penalty: 0, transaction_count: 0 },
            outstanding: outstanding[0] || { total_outstanding: 0, overdue_count: 0 },
            collection_rate: this.calculateCollectionRate(collections[0], outstanding[0])
         };

      } catch (error) {
         logger.error('Failed to get fee analytics', { error: error.message });
         throw error;
      }
   }

   /**
    * Calculate collection rate
    */
   calculateCollectionRate(collections, outstanding) {
      const collected = parseFloat(collections?.total_collected || 0);
      const pending = parseFloat(outstanding?.total_outstanding || 0);
      const total = collected + pending;
      
      return total > 0 ? ((collected / total) * 100).toFixed(2) : 0;
   }
}

module.exports = AdvancedFeeManagementService;
