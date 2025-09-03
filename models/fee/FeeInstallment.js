const { DataTypes } = require('sequelize');

/**
 * FeeInstallment Model
 * Manages fee installment plans and payment tracking
 */

module.exports = (sequelize, _tenant) => {
   const FeeInstallment = sequelize.define(
      'FeeInstallment',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
         },
         student_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'Students',
               key: 'id',
            },
         },
         fee_config_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'FeeConfigurations',
               key: 'id',
            },
         },
         installment_number: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Sequence number of installment (1, 2, 3, etc.)',
         },
         amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Original installment amount',
         },
         paid_amount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.00,
            comment: 'Amount already paid',
         },
         penalty_amount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.00,
            comment: 'Calculated penalty amount',
         },
         penalty_paid: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.00,
            comment: 'Penalty amount paid',
         },
         due_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: 'Due date for this installment',
         },
         payment_date: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Date when payment was made',
         },
         penalty_rate: {
            type: DataTypes.DECIMAL(5, 2),
            defaultValue: 2.00,
            comment: 'Monthly penalty rate as percentage',
         },
         status: {
            type: DataTypes.ENUM('pending', 'partial', 'paid', 'overdue', 'waived'),
            defaultValue: 'pending',
            allowNull: false,
         },
         notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Additional notes about the installment',
         },
         created_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'User who created this installment',
         },
         updated_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'User who last updated this installment',
         },
         created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
         },
         updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
         },
      },
      {
         tableName: 'fee_installments',
         timestamps: false,
         indexes: [
            {
               name: 'idx_fee_installment_student',
               fields: ['student_id'],
            },
            {
               name: 'idx_fee_installment_due_date',
               fields: ['due_date'],
            },
            {
               name: 'idx_fee_installment_status',
               fields: ['status'],
            },
            {
               name: 'idx_fee_installment_overdue',
               fields: ['due_date', 'status'],
               where: {
                  status: ['pending', 'partial'],
               },
            },
         ],
      }
   );

   // Instance Methods
   FeeInstallment.prototype.calculatePenalty = function() {
      const today = new Date();
      const dueDate = new Date(this.due_date);
      const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

      if (daysOverdue <= 0) {
         return 0;
      }

      const monthsOverdue = Math.ceil(daysOverdue / 30);
      return (this.amount * (this.penalty_rate / 100)) * monthsOverdue;
   };

   FeeInstallment.prototype.getRemainingAmount = function() {
      return this.amount - (this.paid_amount || 0);
   };

   FeeInstallment.prototype.getTotalDue = function() {
      const remainingAmount = this.getRemainingAmount();
      const penaltyAmount = this.calculatePenalty();
      return remainingAmount + penaltyAmount;
   };

   FeeInstallment.prototype.isOverdue = function() {
      const today = new Date();
      const dueDate = new Date(this.due_date);
      return today > dueDate && this.status !== 'paid';
   };

   // Class Methods
   FeeInstallment.findOverdueInstallments = async function(studentId = null) {
      const where = {
         due_date: {
            [sequelize.Sequelize.Op.lt]: new Date(),
         },
         status: ['pending', 'partial'],
      };

      if (studentId) {
         where.student_id = studentId;
      }

      return await this.findAll({
         where,
         include: [
            {
               model: sequelize.models.Student,
               attributes: ['id', 'first_name', 'last_name', 'roll_number'],
            },
         ],
         order: [['due_date', 'ASC']],
      });
   };

   FeeInstallment.getInstallmentSummary = async function(studentId) {
      const result = await this.findAll({
         where: { student_id: studentId },
         attributes: [
            [sequelize.fn('COUNT', sequelize.col('id')), 'total_installments'],
            [sequelize.fn('SUM', sequelize.col('amount')), 'total_amount'],
            [sequelize.fn('SUM', sequelize.col('paid_amount')), 'total_paid'],
            [
               sequelize.fn('COUNT', 
                  sequelize.literal("CASE WHEN status = 'paid' THEN 1 END")
               ), 
               'paid_installments'
            ],
            [
               sequelize.fn('COUNT', 
                  sequelize.literal(
                     "CASE WHEN status IN ('pending', 'partial') AND due_date < NOW() THEN 1 END"
                  )
               ), 
               'overdue_installments'
            ],
         ],
      });

      return result[0] || {};
   };

   // Hooks
   FeeInstallment.addHook('beforeSave', (installment, _options) => {
      // Auto-update status based on payments
      if (installment.paid_amount >= installment.amount) {
         installment.status = 'paid';
      } else if (installment.paid_amount > 0) {
         installment.status = 'partial';
      }

      // Mark as overdue if past due date
      if (installment.isOverdue() && installment.status === 'pending') {
         installment.status = 'overdue';
      }

      installment.updated_at = new Date();
   });

   return FeeInstallment;
};
