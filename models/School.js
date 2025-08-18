/**
 * School Model - Q&A Compliant Implementation
 * Following Q12 (sequelize.define), Q14 (INTEGER PK), Q16 (underscored), Q19 (Joi validation)
 * Matches exactly with schools table schema
 */

const { DataTypes } = require('sequelize');
const Joi = require('joi');

module.exports = sequelize => {
  // Q12 Compliant: Direct sequelize.define() (not class-based)
  const School = sequelize.define(
    'School',
    {
      // Q14 Compliant: INTEGER primary key
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },

      // School identification
      schoolName: {
        type: DataTypes.STRING(200),
        allowNull: false,
        field: 'school_name'
      },

      schoolCode: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        field: 'school_code'
      },

      // Address information
      address: {
        type: DataTypes.TEXT,
        allowNull: true
      },

      city: {
        type: DataTypes.STRING(100),
        allowNull: true
      },

      state: {
        type: DataTypes.STRING(100),
        allowNull: true
      },

      postalCode: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'postal_code'
      },

      // Contact information
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true
      },

      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          isEmail: true
        }
      },

      website: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          isUrl: true
        }
      },

      // Principal information
      principalName: {
        type: DataTypes.STRING(200),
        allowNull: true,
        field: 'principal_name'
      },

      principalEmail: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'principal_email',
        validate: {
          isEmail: true
        }
      },

      principalPhone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'principal_phone'
      },

      // Academic information
      affiliationNumber: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'affiliation_number'
      },

      board: {
        type: DataTypes.STRING(100),
        allowNull: true
      },

      // Media
      logoUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'logo_url',
        validate: {
          isUrl: true
        }
      },

      // Status
      status: {
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
        allowNull: false,
        defaultValue: 'ACTIVE',
        validate: {
          isIn: [['ACTIVE', 'INACTIVE']]
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
      modelName: 'School',
      tableName: 'schools',
      // Q16 Compliant: underscored naming
      underscored: true,
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['school_code']
        },
        {
          fields: ['status']
        },
        {
          fields: ['city']
        },
        {
          fields: ['state']
        }
      ]
    }
  );

  // Q19 Compliant: Joi validation schemas within model
  School.validationSchemas = {
    create: Joi.object({
      schoolName: Joi.string().min(1).max(200).required(),
      schoolCode: Joi.string().min(1).max(20).required(),
      address: Joi.string().optional().allow(null),
      city: Joi.string().max(100).optional().allow(null),
      state: Joi.string().max(100).optional().allow(null),
      postalCode: Joi.string().max(20).optional().allow(null),
      phone: Joi.string().max(20).optional().allow(null),
      email: Joi.string().email().max(255).optional().allow(null),
      website: Joi.string().uri().max(255).optional().allow(null),
      principalName: Joi.string().max(200).optional().allow(null),
      principalEmail: Joi.string().email().max(255).optional().allow(null),
      principalPhone: Joi.string().max(20).optional().allow(null),
      affiliationNumber: Joi.string().max(100).optional().allow(null),
      board: Joi.string().max(100).optional().allow(null),
      logoUrl: Joi.string().uri().max(500).optional().allow(null),
      status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE')
    }),

    update: Joi.object({
      schoolName: Joi.string().min(1).max(200).optional(),
      schoolCode: Joi.string().min(1).max(20).optional(),
      address: Joi.string().optional().allow(null),
      city: Joi.string().max(100).optional().allow(null),
      state: Joi.string().max(100).optional().allow(null),
      postalCode: Joi.string().max(20).optional().allow(null),
      phone: Joi.string().max(20).optional().allow(null),
      email: Joi.string().email().max(255).optional().allow(null),
      website: Joi.string().uri().max(255).optional().allow(null),
      principalName: Joi.string().max(200).optional().allow(null),
      principalEmail: Joi.string().email().max(255).optional().allow(null),
      principalPhone: Joi.string().max(20).optional().allow(null),
      affiliationNumber: Joi.string().max(100).optional().allow(null),
      board: Joi.string().max(100).optional().allow(null),
      logoUrl: Joi.string().uri().max(500).optional().allow(null),
      status: Joi.string().valid('ACTIVE', 'INACTIVE').optional()
    })
  };

  // Q19 Compliant: Validation methods
  School.sanitizeInput = (data, schema = 'create') => {
    const { error, value } = School.validationSchemas[schema].validate(data, {
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
  School.findByCode = async schoolCode => {
    return await School.findOne({
      where: { schoolCode }
    });
  };

  School.findActive = async () => {
    return await School.findAll({
      where: { status: 'ACTIVE' },
      order: [['schoolName', 'ASC']]
    });
  };

  School.findByLocation = async (city, state = null) => {
    const whereClause = {
      city,
      status: 'ACTIVE'
    };

    if (state) {
      whereClause.state = state;
    }

    return await School.findAll({
      where: whereClause,
      order: [['schoolName', 'ASC']]
    });
  };

  School.prototype.getFullAddress = function () {
    const parts = [this.address, this.city, this.state, this.postalCode].filter(Boolean);
    return parts.join(', ');
  };

  School.prototype.getPrincipalContact = function () {
    return {
      name: this.principalName,
      email: this.principalEmail,
      phone: this.principalPhone
    };
  };

  // Q13 Compliant: Associations defined inline
  School.associate = models => {
    // School has many Users
    School.hasMany(models.User, {
      foreignKey: 'schoolId',
      as: 'users'
    });

    // School has many Classes
    School.hasMany(models.Class, {
      foreignKey: 'schoolId',
      as: 'classes'
    });

    // School has many Students
    School.hasMany(models.Student, {
      foreignKey: 'schoolId',
      as: 'students'
    });
  };

  return School;
};
