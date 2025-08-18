/**
 * Class Model
 * Manages class information in tenant database
 */

const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');

class Class extends BaseModel {
  static init(sequelize) {
    return super.init(
      {
        ...BaseModel.getCommonAttributes(),
        class_name: {
          type: DataTypes.STRING(100),
          allowNull: false,
          validate: {
            notEmpty: true,
            len: [1, 100]
          }
        },
        class_code: {
          type: DataTypes.STRING(20),
          allowNull: true,
          unique: true
        },
        class_order: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        capacity: {
          type: DataTypes.INTEGER,
          allowNull: true
        },
        academic_year_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'academic_years',
            key: 'id'
          }
        },
        class_teacher_id: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          }
        }
      },
      {
        sequelize,
        modelName: 'Class',
        tableName: 'classes',
        ...BaseModel.getCommonOptions(),
        indexes: [
          {
            unique: true,
            fields: ['class_code']
          },
          {
            fields: ['academic_year_id']
          },
          {
            fields: ['class_order']
          },
          {
            fields: ['is_active', 'is_deleted']
          }
        ]
      }
    );
  }

  /**
   * Define associations
   */
  static associate(models) {
    Class.belongsTo(models.AcademicYear, { foreignKey: 'academic_year_id', as: 'academicYear' });
    Class.belongsTo(models.User, { foreignKey: 'class_teacher_id', as: 'classTeacher' });

    Class.hasMany(models.Section, { foreignKey: 'class_id', as: 'sections' });
    Class.hasMany(models.Student, { foreignKey: 'class_id', as: 'students' });
    Class.hasMany(models.Subject, { foreignKey: 'class_id', as: 'subjects' });
  }

  /**
   * Get current student count
   */
  async getCurrentStudentCount() {
    const Student = this.sequelize.models.Student;
    return await Student.count({
      where: {
        class_id: this.id,
        status: 'active',
        is_active: true,
        is_deleted: false
      }
    });
  }

  /**
   * Get sections for this class
   */
  async getSections() {
    const Section = this.sequelize.models.Section;
    return await Section.findAll({
      where: {
        class_id: this.id,
        is_active: true,
        is_deleted: false
      },
      order: [['section_name', 'ASC']]
    });
  }

  /**
   * Override toJSON to include computed fields
   */
  toJSON() {
    const values = super.toJSON();
    return values;
  }
}

module.exports = Class;
