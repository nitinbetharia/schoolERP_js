const { DataTypes } = require('sequelize');

/**
 * Fee Transaction Model
 * Tracks all fee payments, adjustments, and financial transactions
 * Located in TENANT database
 */
const defineFeeTransaction = (sequelize) => {
   const FeeTransaction = sequelize.define(
      'FeeTransaction',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
         },

         student_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'students',
               key: 'id',
            },
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE',
            comment: 'Reference to student',
         },

         fee_assignment_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'student_fee_assignments',
               key: 'id',
            },
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE',
            comment: 'Reference to student fee assignment',
         },

         transaction_type: {
            type: DataTypes.ENUM(
               'payment',
               'refund',
               'adjustment',
               'waiver',
               'late_fee',
               'discount',
               'penalty',
               'advance',
               'transfer'
            ),
            allowNull: false,
            comment: 'Type of financial transaction',
         },

         transaction_number: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            comment: 'Unique transaction reference number',
         },

         receipt_number: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: 'Receipt number for payments',
         },

         academic_year: {
            type: DataTypes.STRING(20),
            allowNull: false,
            comment: 'Academic year this transaction belongs to',
         },

         fee_components: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {},
            comment: 'Breakdown of fee components in this transaction',
            /*
            Example:
            {
              "tuition_fee": {
                "amount": 8000,
                "months_covered": ["2024-04", "2024-05"],
                "adjustment_applied": 2000
              },
              "library_fee": {
                "amount": 500,
                "period_covered": "2024-25",
                "adjustment_applied": 0
              }
            }
            */
         },

         total_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Total transaction amount',
         },

         payment_method: {
            type: DataTypes.ENUM('cash', 'cheque', 'online', 'bank_transfer', 'mobile_payment', 'card'),
            allowNull: true,
            comment: 'Method of payment (null for non-payment transactions)',
         },

         payment_details: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Payment method specific details',
            /*
            Example for cheque:
            {
              "cheque_number": "123456",
              "cheque_date": "2024-04-01",
              "bank_name": "SBI",
              "branch": "Main Branch"
            }
            
            Example for online:
            {
              "gateway": "razorpay",
              "transaction_id": "pay_xyz123",
              "payment_id": "order_abc456"
            }
            */
         },

         transaction_date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            comment: 'Date when transaction occurred',
         },

         due_date: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Due date for this payment (for payment transactions)',
         },

         late_fee_applied: {
            type: DataTypes.DECIMAL(8, 2),
            allowNull: true,
            defaultValue: 0,
            comment: 'Late fee amount applied if payment was overdue',
         },

         discount_applied: {
            type: DataTypes.DECIMAL(8, 2),
            allowNull: true,
            defaultValue: 0,
            comment: 'Total discount amount applied in this transaction',
         },

         adjustment_details: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Details of adjustments made',
            /*
            Example:
            {
              "reason": "Sibling discount applied",
              "approved_by": 123,
              "approval_date": "2024-04-01",
              "original_amount": 10000,
              "adjusted_amount": 8000,
              "adjustment_type": "discount"
            }
            */
         },

         transaction_status: {
            type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled', 'refunded'),
            defaultValue: 'completed',
            comment: 'Current status of the transaction',
         },

         failure_reason: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Reason for failure (if transaction failed)',
         },

         period_covered: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Time period this transaction covers',
            /*
            Example:
            {
              "from_date": "2024-04-01",
              "to_date": "2024-04-30",
              "months": ["2024-04"],
              "description": "April 2024 fees"
            }
            */
         },

         balance_before: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: 'Outstanding balance before this transaction',
         },

         balance_after: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: 'Outstanding balance after this transaction',
         },

         collected_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'User ID who collected/processed this transaction',
         },

         approved_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'User ID who approved this transaction (for adjustments/refunds)',
         },

         remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Additional remarks or notes about the transaction',
         },

         is_reversed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Whether this transaction has been reversed',
         },

         reversed_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'User ID who reversed this transaction',
         },

         reversal_date: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Date when transaction was reversed',
         },

         reversal_reason: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Reason for reversal',
         },

         created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
         },

         updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
         },
      },
      {
         tableName: 'fee_transactions',
         timestamps: true,
         createdAt: 'created_at',
         updatedAt: 'updated_at',
         indexes: [
            {
               fields: ['transaction_number'],
               unique: true,
               name: 'idx_fee_transaction_number',
            },
            {
               fields: ['student_id', 'academic_year'],
               name: 'idx_fee_transaction_student_year',
            },
            {
               fields: ['fee_assignment_id'],
               name: 'idx_fee_transaction_assignment',
            },
            {
               fields: ['transaction_type'],
               name: 'idx_fee_transaction_type',
            },
            {
               fields: ['transaction_status'],
               name: 'idx_fee_transaction_status',
            },
            {
               fields: ['transaction_date'],
               name: 'idx_fee_transaction_date',
            },
            {
               fields: ['collected_by'],
               name: 'idx_fee_transaction_collector',
            },
         ],
         hooks: {
            beforeCreate: (transaction) => {
               // Generate transaction number if not provided
               if (!transaction.transaction_number) {
                  const date = new Date();
                  const year = date.getFullYear().toString().substr(-2);
                  const month = (date.getMonth() + 1).toString().padStart(2, '0');
                  const random = Math.floor(Math.random() * 9999)
                     .toString()
                     .padStart(4, '0');
                  transaction.transaction_number = `TXN${year}${month}${random}`;
               }

               // Generate receipt number for payments
               if (transaction.transaction_type === 'payment' && !transaction.receipt_number) {
                  const date = new Date();
                  const year = date.getFullYear().toString().substr(-2);
                  const month = (date.getMonth() + 1).toString().padStart(2, '0');
                  const random = Math.floor(Math.random() * 9999)
                     .toString()
                     .padStart(4, '0');
                  transaction.receipt_number = `RCP${year}${month}${random}`;
               }
            },
         },
      }
   );

   // Instance Methods
   FeeTransaction.prototype.getFeeComponents = function () {
      return this.fee_components || {};
   };

   FeeTransaction.prototype.getPaymentDetails = function () {
      return this.payment_details || {};
   };

   FeeTransaction.prototype.getAdjustmentDetails = function () {
      return this.adjustment_details || {};
   };

   FeeTransaction.prototype.getPeriodCovered = function () {
      return this.period_covered || {};
   };

   FeeTransaction.prototype.isPayment = function () {
      return this.transaction_type === 'payment';
   };

   FeeTransaction.prototype.isRefund = function () {
      return this.transaction_type === 'refund';
   };

   FeeTransaction.prototype.isAdjustment = function () {
      return ['adjustment', 'waiver', 'discount'].includes(this.transaction_type);
   };

   FeeTransaction.prototype.canBeReversed = function () {
      return (
         !this.is_reversed &&
         this.transaction_status === 'completed' &&
         ['payment', 'refund', 'adjustment'].includes(this.transaction_type)
      );
   };

   FeeTransaction.prototype.reverseTransaction = async function (userId, reason, transaction = null) {
      if (!this.canBeReversed()) {
         throw new Error('Transaction cannot be reversed');
      }

      this.is_reversed = true;
      this.reversed_by = userId;
      this.reversal_date = new Date();
      this.reversal_reason = reason;

      await this.save({ transaction });

      // Create a reversal transaction
      const reversalType = this.transaction_type === 'payment' ? 'refund' : 'adjustment';
      const reversalAmount = this.transaction_type === 'refund' ? this.total_amount : -this.total_amount;

      const reversalTransaction = await FeeTransaction.create(
         {
            student_id: this.student_id,
            fee_assignment_id: this.fee_assignment_id,
            transaction_type: reversalType,
            academic_year: this.academic_year,
            total_amount: Math.abs(reversalAmount),
            transaction_date: new Date(),
            collected_by: userId,
            remarks: `Reversal of transaction ${this.transaction_number}: ${reason}`,
            adjustment_details: {
               reason: `Reversal: ${reason}`,
               original_transaction: this.transaction_number,
               reversed_by: userId,
               reversal_date: new Date(),
            },
         },
         { transaction }
      );

      return reversalTransaction;
   };

   FeeTransaction.prototype.getFormattedDetails = function () {
      return {
         transaction_number: this.transaction_number,
         receipt_number: this.receipt_number,
         type: this.transaction_type,
         amount: parseFloat(this.total_amount),
         date: this.transaction_date,
         method: this.payment_method,
         status: this.transaction_status,
         components: this.getFeeComponents(),
         period: this.getPeriodCovered(),
         late_fee: parseFloat(this.late_fee_applied || 0),
         discount: parseFloat(this.discount_applied || 0),
         remarks: this.remarks,
         is_reversed: this.is_reversed,
      };
   };

   // Class Methods
   FeeTransaction.createPayment = async function (paymentData, transaction = null) {
      const payment = await this.create(
         {
            student_id: paymentData.student_id,
            fee_assignment_id: paymentData.fee_assignment_id,
            transaction_type: 'payment',
            academic_year: paymentData.academic_year,
            total_amount: paymentData.total_amount,
            payment_method: paymentData.payment_method,
            payment_details: paymentData.payment_details || {},
            fee_components: paymentData.fee_components || {},
            transaction_date: paymentData.transaction_date || new Date(),
            due_date: paymentData.due_date,
            late_fee_applied: paymentData.late_fee_applied || 0,
            discount_applied: paymentData.discount_applied || 0,
            period_covered: paymentData.period_covered,
            collected_by: paymentData.collected_by,
            remarks: paymentData.remarks,
         },
         { transaction }
      );

      return payment;
   };

   FeeTransaction.getStudentTransactions = async function (studentId, academicYear, limit = null) {
      const whereClause = { student_id: studentId };
      if (academicYear) {
         whereClause.academic_year = academicYear;
      }

      const options = {
         where: whereClause,
         order: [
            ['transaction_date', 'DESC'],
            ['created_at', 'DESC'],
         ],
      };

      if (limit) {
         options.limit = limit;
      }

      return await this.findAll(options);
   };

   FeeTransaction.getOutstandingBalance = async function (studentId, academicYear) {
      const transactions = await this.getStudentTransactions(studentId, academicYear);

      let balance = 0;
      transactions.forEach((txn) => {
         if (!txn.is_reversed && txn.transaction_status === 'completed') {
            switch (txn.transaction_type) {
               case 'payment':
                  balance -= parseFloat(txn.total_amount);
                  break;
               case 'refund':
                  balance += parseFloat(txn.total_amount);
                  break;
               case 'late_fee':
               case 'penalty':
                  balance += parseFloat(txn.total_amount);
                  break;
               case 'discount':
               case 'waiver':
                  balance -= parseFloat(txn.total_amount);
                  break;
            }
         }
      });

      return Math.round(balance * 100) / 100;
   };

   FeeTransaction.getPaymentHistory = async function (studentId, academicYear, startDate, endDate) {
      const whereClause = {
         student_id: studentId,
         transaction_type: 'payment',
         transaction_status: 'completed',
         is_reversed: false,
      };

      if (academicYear) {
         whereClause.academic_year = academicYear;
      }

      if (startDate && endDate) {
         whereClause.transaction_date = {
            [sequelize.Sequelize.Op.between]: [startDate, endDate],
         };
      }

      return await this.findAll({
         where: whereClause,
         order: [['transaction_date', 'DESC']],
      });
   };

   return FeeTransaction;
};

module.exports = defineFeeTransaction;
