const { DataTypes } = require('sequelize');

/**
 * Fee Transaction Model - Field Definitions
 * Defines all database fields, constraints, and indexes for fee transactions
 * Core schema definition separated from business logic methods
 *
 * Following copilot instructions: CommonJS, consistent field organization
 */

const feeTransactionFields = {
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
      type: DataTypes.ENUM('cash', 'cheque', 'dd', 'online', 'card', 'upi', 'neft', 'rtgs'),
      allowNull: true,
      comment: 'Payment method used (applicable for payments)',
   },

   payment_details: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional payment details (cheque no, transaction id, etc.)',
      /*
      Example for cheque:
      {
        "cheque_number": "123456",
        "cheque_date": "2024-03-15",
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
      comment: 'Date when transaction was processed',
   },

   due_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Due date for the fees (if applicable)',
   },

   transaction_status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
      comment: 'Current status of the transaction',
   },

   late_fee_applied: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      defaultValue: 0,
      comment: 'Late fee charged (if applicable)',
   },

   discount_applied: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      defaultValue: 0,
      comment: 'Discount given (if applicable)',
   },

   adjustment_details: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Details about adjustments made',
      /*
      Example:
      {
        "reason": "Fee structure change",
        "adjusted_components": {
          "tuition_fee": {
            "original_amount": 10000,
            "adjusted_amount": 8000,
            "reason": "Mid-year discount"
          }
        },
        "approved_by": 123
      }
      */
   },

   period_covered: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Time period this payment covers',
      /*
      Example:
      {
        "from_month": "2024-04",
        "to_month": "2024-06",
        "term": "Q1",
        "months": ["April", "May", "June"]
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
};

const feeTransactionOptions = {
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
};

module.exports = {
   feeTransactionFields,
   feeTransactionOptions,
};
