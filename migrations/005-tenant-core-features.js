/**
 * Tenant Database Migration - Core Operational Features
 * Creates tables: admissions, attendance_daily, attendance_summary,
 * subjects, documents, student_parents, student_transfers
 *
 * Notes:
 * - Idempotent: checks existence before creating.
 * - No destructive changes to existing schema.
 */

const { DataTypes } = require('sequelize');
const { logger } = require('../utils/logger');

async function tableExists(queryInterface, tableName) {
   const sql =
      'SELECT COUNT(*) AS cnt ' +
      'FROM information_schema.tables ' +
      'WHERE table_schema = DATABASE() AND table_name = :t';
   const [rows] = await queryInterface.sequelize.query(sql, {
      replacements: { t: tableName },
   });
   const cnt = Array.isArray(rows) ? rows[0].cnt : rows.cnt;
   return Number(cnt) > 0;
}

async function createAdmissions(queryInterface) {
   const name = 'admissions';
   if (await tableExists(queryInterface, name)) {
      return 'skipped:' + name;
   }

   await queryInterface.createTable(
      name,
      {
         id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
         application_no: { type: DataTypes.STRING(20), allowNull: false, unique: true },
         student_id: { type: DataTypes.INTEGER, allowNull: true },
         class_id: { type: DataTypes.INTEGER, allowNull: false },
         school_id: { type: DataTypes.INTEGER, allowNull: false },
         academic_year_id: { type: DataTypes.INTEGER, allowNull: false },
         application_date: { type: DataTypes.DATEONLY, allowNull: false },
         admission_date: { type: DataTypes.DATEONLY, allowNull: true },
         status: {
            type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED', 'WAITING'),
            allowNull: false,
            defaultValue: 'PENDING',
         },
         documents_verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
         interview_scheduled: { type: DataTypes.DATEONLY, allowNull: true },
         interview_notes: { type: DataTypes.TEXT, allowNull: true },
         rejection_reason: { type: DataTypes.TEXT, allowNull: true },
         created_by: { type: DataTypes.INTEGER, allowNull: false },
         approved_by: { type: DataTypes.INTEGER, allowNull: true },
         created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
         updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      },
      { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' }
   );

   // Indexes and FKs
   await queryInterface.addIndex(name, ['student_id'], { name: 'fk_admissions_student' });
   await queryInterface.addIndex(name, ['class_id'], { name: 'fk_admissions_class' });
   await queryInterface.addIndex(name, ['school_id'], { name: 'fk_admissions_school' });
   await queryInterface.addIndex(name, ['academic_year_id'], {
      name: 'fk_admissions_academic_year',
   });
   await queryInterface.addIndex(name, ['created_by'], { name: 'fk_admissions_created_by' });
   await queryInterface.addIndex(name, ['approved_by'], { name: 'fk_admissions_approved_by' });
   await queryInterface.addIndex(name, ['status'], { name: 'idx_admissions_status' });

   await queryInterface.addConstraint(name, {
      fields: ['student_id'],
      type: 'foreign key',
      name: 'fk_admissions_student',
      references: { table: 'students', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
   });
   await queryInterface.addConstraint(name, {
      fields: ['class_id'],
      type: 'foreign key',
      name: 'fk_admissions_class',
      references: { table: 'classes', field: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
   });
   await queryInterface.addConstraint(name, {
      fields: ['school_id'],
      type: 'foreign key',
      name: 'fk_admissions_school',
      references: { table: 'schools', field: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
   });
   await queryInterface.addConstraint(name, {
      fields: ['academic_year_id'],
      type: 'foreign key',
      name: 'fk_admissions_academic_year',
      references: { table: 'academic_years', field: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
   });
   await queryInterface.addConstraint(name, {
      fields: ['created_by'],
      type: 'foreign key',
      name: 'fk_admissions_created_by',
      references: { table: 'users', field: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
   });
   await queryInterface.addConstraint(name, {
      fields: ['approved_by'],
      type: 'foreign key',
      name: 'fk_admissions_approved_by',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
   });

   return `created:${name}`;
}

async function createAttendanceDaily(queryInterface) {
   const name = 'attendance_daily';
   if (await tableExists(queryInterface, name)) {
      return 'skipped:' + name;
   }

   await queryInterface.createTable(
      name,
      {
         id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
         student_id: { type: DataTypes.INTEGER, allowNull: false },
         class_id: { type: DataTypes.INTEGER, allowNull: false },
         section_id: { type: DataTypes.INTEGER, allowNull: false },
         attendance_date: { type: DataTypes.DATEONLY, allowNull: false },
         status: {
            type: DataTypes.ENUM('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'SICK', 'HOLIDAY'),
            allowNull: false,
         },
         in_time: { type: DataTypes.TIME, allowNull: true },
         out_time: { type: DataTypes.TIME, allowNull: true },
         remarks: { type: DataTypes.STRING(255), allowNull: true },
         marked_by: { type: DataTypes.INTEGER, allowNull: false },
         created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
         updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      },
      { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' }
   );

   await queryInterface.addConstraint(name, {
      fields: ['student_id', 'attendance_date'],
      type: 'unique',
      name: 'uk_attendance_daily',
   });
   await queryInterface.addIndex(name, ['student_id'], { name: 'fk_attendance_daily_student' });
   await queryInterface.addIndex(name, ['class_id'], { name: 'fk_attendance_daily_class' });
   await queryInterface.addIndex(name, ['section_id'], { name: 'fk_attendance_daily_section' });
   await queryInterface.addIndex(name, ['marked_by'], { name: 'fk_attendance_daily_marked_by' });
   await queryInterface.addIndex(name, ['attendance_date'], { name: 'idx_attendance_daily_date' });
   await queryInterface.addIndex(name, ['status'], { name: 'idx_attendance_daily_status' });

   await queryInterface.addConstraint(name, {
      fields: ['student_id'],
      type: 'foreign key',
      name: 'fk_attendance_daily_student',
      references: { table: 'students', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
   });
   await queryInterface.addConstraint(name, {
      fields: ['class_id'],
      type: 'foreign key',
      name: 'fk_attendance_daily_class',
      references: { table: 'classes', field: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
   });
   await queryInterface.addConstraint(name, {
      fields: ['section_id'],
      type: 'foreign key',
      name: 'fk_attendance_daily_section',
      references: { table: 'sections', field: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
   });
   await queryInterface.addConstraint(name, {
      fields: ['marked_by'],
      type: 'foreign key',
      name: 'fk_attendance_daily_marked_by',
      references: { table: 'users', field: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
   });

   return `created:${name}`;
}

async function createAttendanceSummary(queryInterface) {
   const name = 'attendance_summary';
   if (await tableExists(queryInterface, name)) {
      return 'skipped:' + name;
   }

   await queryInterface.createTable(
      name,
      {
         id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
         student_id: { type: DataTypes.INTEGER, allowNull: false },
         month: { type: DataTypes.INTEGER, allowNull: false },
         year: { type: DataTypes.INTEGER, allowNull: false },
         total_days: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
         present_days: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
         absent_days: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
         late_days: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
         half_days: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
         sick_days: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
         holiday_days: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
         percentage: { type: DataTypes.DECIMAL(5, 2), allowNull: true, defaultValue: 0.0 },
         updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      },
      { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' }
   );

   await queryInterface.addConstraint(name, {
      fields: ['student_id', 'month', 'year'],
      type: 'unique',
      name: 'uk_attendance_summary',
   });
   await queryInterface.addIndex(name, ['student_id'], { name: 'fk_attendance_summary_student' });
   await queryInterface.addIndex(name, ['month', 'year'], {
      name: 'idx_attendance_summary_month_year',
   });
   await queryInterface.addConstraint(name, {
      fields: ['student_id'],
      type: 'foreign key',
      name: 'fk_attendance_summary_student',
      references: { table: 'students', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
   });

   return `created:${name}`;
}

async function createSubjects(queryInterface) {
   const name = 'subjects';
   if (await tableExists(queryInterface, name)) {
      return 'skipped:' + name;
   }

   await queryInterface.createTable(
      name,
      {
         id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
         subject_name: { type: DataTypes.STRING(100), allowNull: false },
         subject_code: { type: DataTypes.STRING(20), allowNull: false },
         class_id: { type: DataTypes.INTEGER, allowNull: false },
         is_mandatory: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
         marks_total: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 100 },
         pass_marks: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 35 },
         status: {
            type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
            allowNull: false,
            defaultValue: 'ACTIVE',
         },
         created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
         updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      },
      { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' }
   );

   await queryInterface.addConstraint(name, {
      fields: ['subject_code', 'class_id'],
      type: 'unique',
      name: 'uk_subjects_code_class',
   });
   await queryInterface.addIndex(name, ['class_id'], { name: 'fk_subjects_class' });
   await queryInterface.addConstraint(name, {
      fields: ['class_id'],
      type: 'foreign key',
      name: 'fk_subjects_class',
      references: { table: 'classes', field: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
   });

   return `created:${name}`;
}

async function createDocuments(queryInterface) {
   const name = 'documents';
   if (await tableExists(queryInterface, name)) {
      return 'skipped:' + name;
   }

   await queryInterface.createTable(
      name,
      {
         id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
         entity_type: {
            type: DataTypes.ENUM('STUDENT', 'USER', 'ADMISSION', 'APPLICATION'),
            allowNull: false,
         },
         entity_id: { type: DataTypes.INTEGER, allowNull: false },
         document_type: { type: DataTypes.STRING(100), allowNull: false },
         document_name: { type: DataTypes.STRING(255), allowNull: false },
         file_path: { type: DataTypes.STRING(500), allowNull: false },
         file_size: { type: DataTypes.BIGINT, allowNull: true },
         mime_type: { type: DataTypes.STRING(100), allowNull: true },
         uploaded_by: { type: DataTypes.INTEGER, allowNull: false },
         verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
         verified_by: { type: DataTypes.INTEGER, allowNull: true },
         verified_at: { type: DataTypes.DATE, allowNull: true },
         created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
         updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      },
      { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' }
   );

   await queryInterface.addIndex(name, ['entity_type', 'entity_id'], {
      name: 'idx_documents_entity',
   });
   await queryInterface.addIndex(name, ['uploaded_by'], { name: 'fk_documents_uploaded_by' });
   await queryInterface.addIndex(name, ['verified_by'], { name: 'fk_documents_verified_by' });

   await queryInterface.addConstraint(name, {
      fields: ['uploaded_by'],
      type: 'foreign key',
      name: 'fk_documents_uploaded_by',
      references: { table: 'users', field: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
   });
   await queryInterface.addConstraint(name, {
      fields: ['verified_by'],
      type: 'foreign key',
      name: 'fk_documents_verified_by',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
   });

   return `created:${name}`;
}

async function createStudentParents(queryInterface) {
   const name = 'student_parents';
   if (await tableExists(queryInterface, name)) {
      return 'skipped:' + name;
   }

   await queryInterface.createTable(
      name,
      {
         id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
         student_id: { type: DataTypes.INTEGER, allowNull: false },
         parent_id: { type: DataTypes.INTEGER, allowNull: false },
         relationship: {
            type: DataTypes.ENUM('FATHER', 'MOTHER', 'GUARDIAN', 'OTHER'),
            allowNull: false,
         },
         is_primary_contact: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
         created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
         updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      },
      { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' }
   );

   await queryInterface.addConstraint(name, {
      fields: ['student_id', 'parent_id'],
      type: 'unique',
      name: 'uk_student_parents',
   });
   await queryInterface.addIndex(name, ['student_id'], { name: 'fk_student_parents_student' });
   await queryInterface.addIndex(name, ['parent_id'], { name: 'fk_student_parents_parent' });
   await queryInterface.addConstraint(name, {
      fields: ['student_id'],
      type: 'foreign key',
      name: 'fk_student_parents_student',
      references: { table: 'students', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
   });
   await queryInterface.addConstraint(name, {
      fields: ['parent_id'],
      type: 'foreign key',
      name: 'fk_student_parents_parent',
      references: { table: 'users', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
   });

   return `created:${name}`;
}

async function createStudentTransfers(queryInterface) {
   const name = 'student_transfers';
   if (await tableExists(queryInterface, name)) {
      return 'skipped:' + name;
   }

   await queryInterface.createTable(
      name,
      {
         id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
         student_id: { type: DataTypes.INTEGER, allowNull: false },
         from_school_id: { type: DataTypes.INTEGER, allowNull: false },
         to_school_id: { type: DataTypes.INTEGER, allowNull: false },
         from_class_id: { type: DataTypes.INTEGER, allowNull: false },
         to_class_id: { type: DataTypes.INTEGER, allowNull: false },
         transfer_date: { type: DataTypes.DATEONLY, allowNull: false },
         reason: { type: DataTypes.TEXT, allowNull: true },
         status: {
            type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
            allowNull: false,
            defaultValue: 'PENDING',
         },
         approved_by: { type: DataTypes.INTEGER, allowNull: true },
         created_by: { type: DataTypes.INTEGER, allowNull: false },
         created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
         updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      },
      { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' }
   );

   await queryInterface.addIndex(name, ['student_id'], { name: 'fk_student_transfers_student' });
   await queryInterface.addIndex(name, ['from_school_id'], {
      name: 'fk_student_transfers_from_school',
   });
   await queryInterface.addIndex(name, ['to_school_id'], {
      name: 'fk_student_transfers_to_school',
   });
   await queryInterface.addIndex(name, ['from_class_id'], {
      name: 'fk_student_transfers_from_class',
   });
   await queryInterface.addIndex(name, ['to_class_id'], { name: 'fk_student_transfers_to_class' });
   await queryInterface.addIndex(name, ['approved_by'], {
      name: 'fk_student_transfers_approved_by',
   });
   await queryInterface.addIndex(name, ['created_by'], { name: 'fk_student_transfers_created_by' });

   await queryInterface.addConstraint(name, {
      fields: ['student_id'],
      type: 'foreign key',
      name: 'fk_student_transfers_student',
      references: { table: 'students', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
   });
   await queryInterface.addConstraint(name, {
      fields: ['from_school_id'],
      type: 'foreign key',
      name: 'fk_student_transfers_from_school',
      references: { table: 'schools', field: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
   });
   await queryInterface.addConstraint(name, {
      fields: ['to_school_id'],
      type: 'foreign key',
      name: 'fk_student_transfers_to_school',
      references: { table: 'schools', field: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
   });
   await queryInterface.addConstraint(name, {
      fields: ['from_class_id'],
      type: 'foreign key',
      name: 'fk_student_transfers_from_class',
      references: { table: 'classes', field: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
   });
   await queryInterface.addConstraint(name, {
      fields: ['to_class_id'],
      type: 'foreign key',
      name: 'fk_student_transfers_to_class',
      references: { table: 'classes', field: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
   });
   await queryInterface.addConstraint(name, {
      fields: ['approved_by'],
      type: 'foreign key',
      name: 'fk_student_transfers_approved_by',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
   });
   await queryInterface.addConstraint(name, {
      fields: ['created_by'],
      type: 'foreign key',
      name: 'fk_student_transfers_created_by',
      references: { table: 'users', field: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
   });

   return `created:${name}`;
}

async function up(queryInterface, _Sequelize) {
   const transaction = await queryInterface.sequelize.transaction();
   try {
      logger.info('Starting tenant core features migration');

      const results = [];
      results.push(await createAdmissions(queryInterface));
      results.push(await createAttendanceDaily(queryInterface));
      results.push(await createAttendanceSummary(queryInterface));
      results.push(await createSubjects(queryInterface));
      results.push(await createDocuments(queryInterface));
      results.push(await createStudentParents(queryInterface));
      results.push(await createStudentTransfers(queryInterface));

      await transaction.commit();
      logger.info('Tenant core features migration completed', { results });
      return { success: true, results };
   } catch (error) {
      await transaction.rollback();
      logger.error('Tenant core features migration failed', { error });
      throw error;
   }
}

async function down(queryInterface, _Sequelize) {
   // Note: Provided for completeness; not intended to be run in production.
   const names = [
      'student_transfers',
      'student_parents',
      'documents',
      'subjects',
      'attendance_summary',
      'attendance_daily',
      'admissions',
   ];
   for (const n of names) {
      // drop if exists
      if (await tableExists(queryInterface, n)) {
         await queryInterface.dropTable(n);
      }
   }
}

module.exports = { up, down };
