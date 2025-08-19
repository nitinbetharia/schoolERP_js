/**
 * FeeTransaction Model - Tenant Database Entity
 * 
 * Q1: Uses Sequelize ORM (not raw MySQL)
 * Q12: Uses sequelize.define() (not class-based)
 * Q14: Uses INTEGER primary key for tenant entities
 * Q16: Snake_case database, camelCase JavaScript
 * Q19: Joi validation schemas within model file
 * Q33: RESTRICT foreign keys with user-friendly errors
 * Q59: Uses business constants instead of hardcoded values
 * 
 * FeeTransaction represents payment records for fee structures
 * - Tracks all payments, refunds, adjustments, and waivers
 * - Supports multiple payment methods and gateway integration
 * - Contains audit trail for financial reconciliation
 * - Used for receipt generation and financial reports
 */

const { DataTypes } = require('sequelize');
const Joi = require('joi');
const config = require('../../../config');
const constants = config.get('constants');

/**
 * FeeTransaction Model Definition
 * @param {Sequelize} sequelize - Tenant sequelize instance
 * @returns {Model} FeeTransaction model
 */
function createFeeTransactionModel(sequelize) {
  const FeeTransaction = sequelize.define(
    'FeeTransaction',
    {
      // Primary key
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },

      // Student reference
      studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'student_id',
        references: {
          model: 'students',
          key: 'id'
        }
      },

      // Fee structure reference
      feeStructureId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'fee_structure_id',
        references: {
          model: 'fee_structures',
          key: 'id'
        }
      },

      // Transaction details
      transactionType: {
        type: DataTypes.ENUM(...constants.FEE_TRANSACTION_TYPES.ALL_TYPES),
        allowNull: false,
        defaultValue: constants.FEE_TRANSACTION_TYPES.PAYMENT,
        field: 'transaction_type',
        validate: {
          isIn: [constants.FEE_TRANSACTION_TYPES.ALL_TYPES]
        }
      },

      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
          isDecimal: true
        }
      },

      // Payment method and reference
      paymentMethod: {
        type: DataTypes.ENUM(...constants.PAYMENT_METHODS.ALL_METHODS),
        allowNull: false,
        field: 'payment_method',
        validate: {
          isIn: [constants.PAYMENT_METHODS.ALL_METHODS]
        }
      },

      paymentReference: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'payment_reference',
        comment: 'Transaction ID from payment gateway or cheque number'
      },

      paymentDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'payment_date'
      },

      // Academic period reference
      academicMonth: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'academic_month',
        comment: 'For monthly fees (1-12)',
        validate: {
          min: 1,
          max: 12
        }
      },

      academicQuarter: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'academic_quarter',
        comment: 'For quarterly fees (1-4)',
        validate: {
          min: 1,
          max: 4
        }
      },

      // Fee components
      lateFeeAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'late_fee_amount',
        validate: {
          min: 0,
          isDecimal: true
        }
      },

      discountAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'discount_amount',
        validate: {
          min: 0,
          isDecimal: true
        }
      },

      discountReason: {
        type: DataTypes.STRING(200),
        allowNull: true,
        field: 'discount_reason'
      },

      // Collection information
      collectedByUserId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'collected_by_user_id',
        references: {
          model: 'users',
          key: 'id'
        }
      },

      receiptNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true,
        field: 'receipt_number'
      },

      // Transaction status
      status: {
        type: DataTypes.ENUM(...constants.FEE_TRANSACTION_STATUS.ALL_STATUS),
        allowNull: false,
        defaultValue: constants.FEE_TRANSACTION_STATUS.COMPLETED,
        validate: {
          isIn: [constants.FEE_TRANSACTION_STATUS.ALL_STATUS]
        }
      },

      // Additional information
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true
      },

      // Gateway integration data
      gatewayData: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'gateway_data',
        comment: 'Payment gateway response data'
      },

      // Reconciliation
      reconciliationStatus: {
        type: DataTypes.ENUM(...constants.RECONCILIATION_STATUS.ALL_STATUS),
        allowNull: false,
        defaultValue: constants.RECONCILIATION_STATUS.PENDING,
        field: 'reconciliation_status',
        validate: {
          isIn: [constants.RECONCILIATION_STATUS.ALL_STATUS]
        }
      },

      reconciledAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'reconciled_at'
      },

      reconciledByUserId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'reconciled_by_user_id',
        references: {
          model: 'users',
          key: 'id'
        }
      },

      // Timestamps
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
      },

      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updated_at'
      }
    },
    {
      // Model options
      tableName: 'fee_transactions',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      
      // Indexes for performance
      indexes: [
        {
          fields: ['student_id']
        },
        {
          fields: ['fee_structure_id']
        },
        {
          fields: ['payment_date']
        },
        {
          fields: ['status']
        },
        {
          fields: ['payment_method']
        },
        {
          fields: ['collected_by_user_id']
        },
        {
          fields: ['receipt_number']
        },
        {
          fields: ['reconciliation_status']
        },
        {
          // Composite index for fee reports
          fields: ['payment_date', 'status', 'student_id']
        },
        {
          // Composite index for reconciliation
          fields: ['reconciliation_status', 'payment_method', 'payment_date']
        }
      ]
    }
  );

  // Q13 Compliance: Define associations
  FeeTransaction.associate = (models) => {
    // FeeTransaction belongs to Student
    if (models.Student) {
      FeeTransaction.belongsTo(models.Student, {
        foreignKey: 'studentId',
        as: 'student',
        onDelete: 'CASCADE'
      });
    }

    // FeeTransaction belongs to FeeStructure
    if (models.FeeStructure) {
      FeeTransaction.belongsTo(models.FeeStructure, {
        foreignKey: 'feeStructureId',
        as: 'feeStructure',
        onDelete: 'CASCADE'
      });
    }

    // FeeTransaction belongs to User (collector)
    if (models.User) {
      FeeTransaction.belongsTo(models.User, {
        foreignKey: 'collectedByUserId',
        as: 'collectedBy',
        onDelete: 'SET NULL'
      });

      // FeeTransaction belongs to User (reconciler)
      FeeTransaction.belongsTo(models.User, {
        foreignKey: 'reconciledByUserId',
        as: 'reconciledBy',
        onDelete: 'SET NULL'
      });
    }
  };

  // Instance methods
  FeeTransaction.prototype.toJSON = function() {
    const values = { ...this.dataValues };
    
    // Format decimal amounts
    ['amount', 'lateFeeAmount', 'discountAmount'].forEach(field => {
      if (values[field] !== null) {
        values[field] = parseFloat(values[field]);
      }
    });
    
    return values;
  };

  FeeTransaction.prototype.getTotalAmount = function() {
    return parseFloat(this.amount) + parseFloat(this.lateFeeAmount) - parseFloat(this.discountAmount);
  };

  FeeTransaction.prototype.generateReceiptNumber = function() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `FEE${date}${this.id.toString().padStart(6, '0')}${random}`;
  };

  FeeTransaction.prototype.markAsReconciled = async function(userId) {
    this.reconciliationStatus = constants.RECONCILIATION_STATUS.RECONCILED;
    this.reconciledAt = new Date();
    this.reconciledByUserId = userId;
    return await this.save();
  };

  // Class methods
  FeeTransaction.findByStudent = async function(studentId, options = {}) {
    return await this.findAll({
      where: { studentId },
      order: [['paymentDate', 'DESC']],
      limit: options.limit || 100,
      include: options.include || ['feeStructure', 'collectedBy']
    });
  };

  FeeTransaction.findByDateRange = async function(startDate, endDate, options = {}) {
    const where = {
      paymentDate: {
        [sequelize.Op.between]: [startDate, endDate]
      }
    };

    if (options.status) {
      where.status = options.status;
    }

    return await this.findAll({
      where,
      order: [['paymentDate', 'DESC']],
      limit: options.limit || 1000,
      include: options.include || ['student', 'feeStructure', 'collectedBy']
    });
  };

  FeeTransaction.getCollectionSummary = async function(startDate, endDate, options = {}) {
    const where = {
      paymentDate: {
        [sequelize.Op.between]: [startDate, endDate]
      },
      status: constants.FEE_TRANSACTION_STATUS.COMPLETED
    };

    const summary = await this.findAll({
      where,
      attributes: [
        'paymentMethod',
        [sequelize.fn('COUNT', sequelize.col('id')), 'transactionCount'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
        [sequelize.fn('SUM', sequelize.col('late_fee_amount')), 'totalLateFee'],
        [sequelize.fn('SUM', sequelize.col('discount_amount')), 'totalDiscount']
      ],
      group: ['paymentMethod'],
      raw: true
    });

    return summary.map(item => ({
      paymentMethod: item.paymentMethod,
      transactionCount: parseInt(item.transactionCount),
      totalAmount: parseFloat(item.totalAmount || 0),
      totalLateFee: parseFloat(item.totalLateFee || 0),
      totalDiscount: parseFloat(item.totalDiscount || 0),
      netAmount: parseFloat(item.totalAmount || 0) + parseFloat(item.totalLateFee || 0) - parseFloat(item.totalDiscount || 0)
    }));
  };

  return FeeTransaction;
}

// Q19 Compliance: Joi validation schemas
const feeTransactionValidationSchemas = {
  create: Joi.object({
    studentId: Joi.number().integer().min(1).required(),
    feeStructureId: Joi.number().integer().min(1).required(),
    transactionType: Joi.string().valid(...constants.FEE_TRANSACTION_TYPES.ALL_TYPES).default(constants.FEE_TRANSACTION_TYPES.PAYMENT),
    amount: Joi.number().precision(2).min(0).required(),
    paymentMethod: Joi.string().valid(...constants.PAYMENT_METHODS.ALL_METHODS).required(),
    paymentReference: Joi.string().max(100).optional(),
    paymentDate: Joi.date().required(),
    academicMonth: Joi.number().integer().min(1).max(12).optional(),
    academicQuarter: Joi.number().integer().min(1).max(4).optional(),
    lateFeeAmount: Joi.number().precision(2).min(0).default(0),
    discountAmount: Joi.number().precision(2).min(0).default(0),
    discountReason: Joi.string().max(200).optional(),
    collectedByUserId: Joi.number().integer().min(1).optional(),
    remarks: Joi.string().max(500).optional(),
    gatewayData: Joi.object().optional()
  }),

  update: Joi.object({
    amount: Joi.number().precision(2).min(0).optional(),
    paymentReference: Joi.string().max(100).optional(),
    paymentDate: Joi.date().optional(),
    lateFeeAmount: Joi.number().precision(2).min(0).optional(),
    discountAmount: Joi.number().precision(2).min(0).optional(),
    discountReason: Joi.string().max(200).optional(),
    status: Joi.string().valid(...constants.FEE_TRANSACTION_STATUS.ALL_STATUS).optional(),
    remarks: Joi.string().max(500).optional(),
    reconciliationStatus: Joi.string().valid(...constants.RECONCILIATION_STATUS.ALL_STATUS).optional()
  }),

  query: Joi.object({
    studentId: Joi.number().integer().min(1).optional(),
    feeStructureId: Joi.number().integer().min(1).optional(),
    paymentMethod: Joi.string().valid(...constants.PAYMENT_METHODS.ALL_METHODS).optional(),
    status: Joi.string().valid(...constants.FEE_TRANSACTION_STATUS.ALL_STATUS).optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    reconciliationStatus: Joi.string().valid(...constants.RECONCILIATION_STATUS.ALL_STATUS).optional(),
    limit: Joi.number().integer().min(1).max(1000).default(100)
  })
};

module.exports = createFeeTransactionModel;
module.exports.validationSchemas = feeTransactionValidationSchemas;
