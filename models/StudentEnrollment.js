const { DataTypes } = require('sequelize');

/**
 * Student Enrollment Model
 * Tracks student enrollment history and class promotions
 */
const defineStudentEnrollment = (sequelize) => {
   const StudentEnrollment = sequelize.define(
      'StudentEnrollment',
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
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
         },
         school_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'schools',
               key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
         },
         class_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'classes',
               key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
         },
         section_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
               model: 'sections',
               key: 'id',
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
         },
         academic_year: {
            type: DataTypes.STRING(20),
            allowNull: false,
            comment: 'Academic year like "2024-25"',
         },
         enrollment_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: 'Date when student was enrolled in this class',
         },
         end_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: 'Date when student completed this class (promotion/transfer)',
         },
         roll_number: {
            type: DataTypes.STRING(20),
            allowNull: true,
            comment: 'Roll number assigned for this enrollment',
         },
         status: {
            type: DataTypes.ENUM(
               'ACTIVE',
               'PROMOTED',
               'TRANSFERRED',
               'DROPPED',
               'COMPLETED',
            ),
            defaultValue: 'ACTIVE',
            comment: 'Status of this enrollment record',
         },
         promotion_status: {
            type: DataTypes.ENUM(
               'PROMOTED',
               'DETAINED',
               'PASSED',
               'FAILED',
               'PENDING',
            ),
            allowNull: true,
            comment: 'Result of this academic year',
         },
         final_grade: {
            type: DataTypes.STRING(10),
            allowNull: true,
            comment: 'Final grade/percentage for this year',
         },
         attendance_percentage: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            comment: 'Overall attendance percentage for this enrollment',
         },
         remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Remarks about this enrollment period',
         },
         created_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
         },
         updated_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
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
         tableName: 'student_enrollments',
         timestamps: true,
         createdAt: 'created_at',
         updatedAt: 'updated_at',
         indexes: [
            {
               name: 'enrollment_student_idx',
               fields: ['student_id'],
            },
            {
               name: 'enrollment_school_idx',
               fields: ['school_id'],
            },
            {
               name: 'enrollment_class_section_idx',
               fields: ['class_id', 'section_id'],
            },
            {
               name: 'enrollment_roll_class_idx',
               fields: ['roll_number', 'class_id', 'section_id', 'academic_year'],
               unique: true,
            },
         ],
      },
   );

   return StudentEnrollment;
};

module.exports = { defineStudentEnrollment };
