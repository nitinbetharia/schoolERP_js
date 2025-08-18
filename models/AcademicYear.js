/**
 * AcademicYear Model - Q&A Compliant Implementation
 * Following Q12 (sequelize.define), Q14 (INTEGER PK), Q16 (underscored), Q19 (Joi validation)
 * Matches exactly with academic_years table schema
 */

const { DataTypes } = require('sequelize');
const Joi = require('joi');

module.exports = sequelize => {
  // Q12 Compliant: Direct sequelize.define() (not class-based)
  const AcademicYear = sequelize.define(
    'AcademicYear',
    {
      // Q14 Compliant: INTEGER primary key
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },

      // Academic year identification
      yearName: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        field: 'year_name'
      },

      // Date range
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'start_date'
      },

      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'end_date'
      },

      // Current year flag
      isCurrent: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_current'
      },

      // Status
      status: {
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'COMPLETED'),
        allowNull: false,
        defaultValue: 'ACTIVE',
        validate: {
          isIn: [['ACTIVE', 'INACTIVE', 'COMPLETED']]
        }
      },

      // Q16 Compliant: Timestamps handled by Sequelize with underscored: true
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
      sequelize,
      modelName: 'AcademicYear',
      tableName: 'academic_years',
      // Q16 Compliant: underscored naming
      underscored: true,
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['year_name']
        },
        {
          fields: ['is_current']
        },
        {
          fields: ['status']
        },
        {
          fields: ['start_date']
        },
        {
          fields: ['end_date']
        }
      ]
    }
  );

  // Q19 Compliant: Joi validation schemas within model
  AcademicYear.validationSchemas = {
    create: Joi.object({
      yearName: Joi.string().min(1).max(20).required(),
      startDate: Joi.date().required(),
      endDate: Joi.date().greater(Joi.ref('startDate')).required(),
      isCurrent: Joi.boolean().default(false),
      status: Joi.string().valid('ACTIVE', 'INACTIVE', 'COMPLETED').default('ACTIVE')
    }),

    update: Joi.object({
      yearName: Joi.string().min(1).max(20).optional(),
      startDate: Joi.date().optional(),
      endDate: Joi.date()
        .when('startDate', {
          is: Joi.exist(),
          then: Joi.date().greater(Joi.ref('startDate')),
          otherwise: Joi.date()
        })
        .optional(),
      isCurrent: Joi.boolean().optional(),
      status: Joi.string().valid('ACTIVE', 'INACTIVE', 'COMPLETED').optional()
    })
  };

  // Q19 Compliant: Validation methods
  AcademicYear.sanitizeInput = (data, schema = 'create') => {
    const { error, value } = AcademicYear.validationSchemas[schema].validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map(detail => detail.message).join(', ');
      throw new Error(`Validation failed: ${details}`);
    }

    return value;
  };

  // Business logic methods
  AcademicYear.findCurrent = async () => {
    return await AcademicYear.findOne({
      where: {
        isCurrent: true,
        status: 'ACTIVE'
      }
    });
  };

  AcademicYear.findActive = async () => {
    return await AcademicYear.findAll({
      where: { status: 'ACTIVE' },
      order: [['startDate', 'DESC']]
    });
  };

  AcademicYear.findByName = async yearName => {
    return await AcademicYear.findOne({
      where: { yearName }
    });
  };

  AcademicYear.findByDateRange = async date => {
    return await AcademicYear.findOne({
      where: {
        startDate: { [sequelize.Sequelize.Op.lte]: date },
        endDate: { [sequelize.Sequelize.Op.gte]: date },
        status: 'ACTIVE'
      }
    });
  };

  AcademicYear.setCurrentYear = async yearId => {
    const transaction = await sequelize.transaction();

    try {
      // First, unset all current flags
      await AcademicYear.update(
        { isCurrent: false },
        {
          where: { isCurrent: true },
          transaction
        }
      );

      // Then set the new current year
      await AcademicYear.update(
        { isCurrent: true },
        {
          where: { id: yearId },
          transaction
        }
      );

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  AcademicYear.prototype.isActive = function () {
    const now = new Date();
    const startDate = new Date(this.startDate);
    const endDate = new Date(this.endDate);

    return this.status === 'ACTIVE' && now >= startDate && now <= endDate;
  };

  AcademicYear.prototype.getDurationInDays = function () {
    const startDate = new Date(this.startDate);
    const endDate = new Date(this.endDate);
    const diffTime = Math.abs(endDate - startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  AcademicYear.prototype.getProgress = function () {
    const now = new Date();
    const startDate = new Date(this.startDate);
    const endDate = new Date(this.endDate);

    if (now < startDate) return 0;
    if (now > endDate) return 100;

    const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
    const elapsedDays = (now - startDate) / (1000 * 60 * 60 * 24);

    return Math.round((elapsedDays / totalDays) * 100);
  };

  // Q13 Compliant: Associations defined inline
  AcademicYear.associate = models => {
    // AcademicYear has many Classes
    AcademicYear.hasMany(models.Class, {
      foreignKey: 'academicYearId',
      as: 'classes'
    });

    // AcademicYear has many Students
    AcademicYear.hasMany(models.Student, {
      foreignKey: 'academicYearId',
      as: 'students'
    });
  };

  return AcademicYear;
};
