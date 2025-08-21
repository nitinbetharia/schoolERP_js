const { logger } = require("../../utils/logger");

/**
 * Database Migration Script for Attendance Module
 * Creates StudentAttendance and TeacherAttendance tables with proper constraints
 * Following copilot instructions: CommonJS, async/await, proper error handling
 */

async function createAttendanceTables(sequelize) {
  const transaction = await sequelize.transaction();

  try {
    logger.info("Starting attendance tables creation...");

    // Create StudentAttendance table
    await sequelize.query(
      `
         CREATE TABLE IF NOT EXISTS student_attendance (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            school_id INT NOT NULL,
            class_id INT,
            attendance_date DATE NOT NULL,
            status ENUM('PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'SICK', 'HALF_DAY') NOT NULL DEFAULT 'PRESENT',
            period ENUM('FULL_DAY', 'MORNING', 'AFTERNOON', 'PERIOD_1', 'PERIOD_2', 'PERIOD_3', 'PERIOD_4', 'PERIOD_5', 'PERIOD_6', 'PERIOD_7', 'PERIOD_8') DEFAULT 'FULL_DAY',
            arrival_time TIME,
            departure_time TIME,
            reason TEXT,
            marked_by INT NOT NULL,
            marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            modified_by INT,
            academic_year INT NOT NULL,
            is_holiday BOOLEAN DEFAULT FALSE,
            additional_info JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            
            INDEX idx_student_attendance_date (school_id, attendance_date),
            INDEX idx_student_attendance_student (student_id, attendance_date),
            INDEX idx_student_attendance_class (class_id, attendance_date),
            INDEX idx_student_attendance_year (academic_year, school_id),
            INDEX idx_student_attendance_status (status, attendance_date, school_id),
            
            UNIQUE KEY unique_student_date_attendance (student_id, attendance_date),
            
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL ON UPDATE CASCADE,
            FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
            FOREIGN KEY (modified_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
         ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `,
      { transaction },
    );

    logger.info("StudentAttendance table created successfully");

    // Create TeacherAttendance table
    await sequelize.query(
      `
         CREATE TABLE IF NOT EXISTS teacher_attendance (
            id INT AUTO_INCREMENT PRIMARY KEY,
            teacher_id INT NOT NULL,
            school_id INT NOT NULL,
            attendance_date DATE NOT NULL,
            status ENUM('PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'SICK', 'LEAVE', 'HALF_DAY') NOT NULL DEFAULT 'PRESENT',
            check_in_time TIME,
            check_out_time TIME,
            scheduled_start TIME DEFAULT '08:00:00',
            scheduled_end TIME DEFAULT '16:00:00',
            minutes_late INT DEFAULT 0,
            early_departure_minutes INT DEFAULT 0,
            total_hours_worked DECIMAL(4,2),
            overtime_hours DECIMAL(4,2) DEFAULT 0,
            leave_type ENUM('SICK', 'CASUAL', 'EARNED', 'MATERNITY', 'PATERNITY', 'EMERGENCY', 'OTHER'),
            reason TEXT,
            marked_by INT NOT NULL,
            marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            modified_by INT,
            academic_year INT NOT NULL,
            is_holiday BOOLEAN DEFAULT FALSE,
            is_substitute BOOLEAN DEFAULT FALSE,
            substituting_for INT,
            location VARCHAR(100),
            device_info JSON,
            additional_info JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            
            INDEX idx_teacher_attendance_date (school_id, attendance_date),
            INDEX idx_teacher_attendance_teacher (teacher_id, attendance_date),
            INDEX idx_teacher_attendance_year (academic_year, school_id),
            INDEX idx_teacher_attendance_status (status, attendance_date, school_id),
            INDEX idx_teacher_attendance_leave (leave_type, attendance_date, school_id),
            INDEX idx_teacher_attendance_hours (total_hours_worked, overtime_hours, attendance_date),
            
            UNIQUE KEY unique_teacher_date_attendance (teacher_id, attendance_date),
            
            FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
            FOREIGN KEY (modified_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
            FOREIGN KEY (substituting_for) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
         ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `,
      { transaction },
    );

    logger.info("TeacherAttendance table created successfully");

    // Create attendance summary view for reporting
    await sequelize.query(
      `
         CREATE OR REPLACE VIEW attendance_daily_summary AS
         SELECT 
            s.school_id,
            s.attendance_date,
            s.academic_year,
            COUNT(DISTINCT s.student_id) as total_students,
            COUNT(DISTINCT CASE WHEN s.status IN ('PRESENT', 'LATE') THEN s.student_id END) as students_present,
            COUNT(DISTINCT CASE WHEN s.status IN ('ABSENT', 'SICK') THEN s.student_id END) as students_absent,
            COUNT(DISTINCT t.teacher_id) as total_teachers,
            COUNT(DISTINCT CASE WHEN t.status IN ('PRESENT', 'LATE', 'HALF_DAY') THEN t.teacher_id END) as teachers_present,
            COUNT(DISTINCT CASE WHEN t.status IN ('ABSENT', 'SICK', 'LEAVE') THEN t.teacher_id END) as teachers_absent,
            ROUND(AVG(CASE WHEN s.status IN ('PRESENT', 'LATE') THEN 1 ELSE 0 END) * 100, 2) as student_attendance_percentage,
            ROUND(AVG(CASE WHEN t.status IN ('PRESENT', 'LATE', 'HALF_DAY') THEN 1 ELSE 0 END) * 100, 2) as teacher_attendance_percentage
         FROM student_attendance s
         LEFT JOIN teacher_attendance t ON s.school_id = t.school_id AND s.attendance_date = t.attendance_date
         WHERE s.is_holiday = FALSE
         GROUP BY s.school_id, s.attendance_date, s.academic_year;
      `,
      { transaction },
    );

    logger.info("Attendance daily summary view created successfully");

    // Create triggers for automatic calculation of worked hours
    await sequelize.query(
      `
         DROP TRIGGER IF EXISTS calculate_teacher_hours_before_update;
      `,
      { transaction },
    );

    await sequelize.query(
      `
         CREATE TRIGGER calculate_teacher_hours_before_update
         BEFORE UPDATE ON teacher_attendance
         FOR EACH ROW
         BEGIN
            IF NEW.check_in_time IS NOT NULL AND NEW.check_out_time IS NOT NULL THEN
               SET NEW.total_hours_worked = TIME_TO_SEC(TIMEDIFF(NEW.check_out_time, NEW.check_in_time)) / 3600;
               
               SET NEW.overtime_hours = GREATEST(0, 
                  NEW.total_hours_worked - (TIME_TO_SEC(TIMEDIFF(NEW.scheduled_end, NEW.scheduled_start)) / 3600)
               );
               
               SET NEW.minutes_late = GREATEST(0, 
                  TIME_TO_SEC(TIMEDIFF(NEW.check_in_time, NEW.scheduled_start)) / 60
               );
               
               SET NEW.early_departure_minutes = GREATEST(0, 
                  TIME_TO_SEC(TIMEDIFF(NEW.scheduled_end, NEW.check_out_time)) / 60
               );
            END IF;
         END;
      `,
      { transaction },
    );

    await sequelize.query(
      `
         DROP TRIGGER IF EXISTS calculate_teacher_hours_before_insert;
      `,
      { transaction },
    );

    await sequelize.query(
      `
         CREATE TRIGGER calculate_teacher_hours_before_insert
         BEFORE INSERT ON teacher_attendance
         FOR EACH ROW
         BEGIN
            IF NEW.check_in_time IS NOT NULL AND NEW.check_out_time IS NOT NULL THEN
               SET NEW.total_hours_worked = TIME_TO_SEC(TIMEDIFF(NEW.check_out_time, NEW.check_in_time)) / 3600;
               
               SET NEW.overtime_hours = GREATEST(0, 
                  NEW.total_hours_worked - (TIME_TO_SEC(TIMEDIFF(NEW.scheduled_end, NEW.scheduled_start)) / 3600)
               );
               
               SET NEW.minutes_late = GREATEST(0, 
                  TIME_TO_SEC(TIMEDIFF(NEW.check_in_time, NEW.scheduled_start)) / 60
               );
               
               SET NEW.early_departure_minutes = GREATEST(0, 
                  TIME_TO_SEC(TIMEDIFF(NEW.scheduled_end, NEW.check_out_time)) / 60
               );
            END IF;
         END;
      `,
      { transaction },
    );

    logger.info("Database triggers created successfully");

    await transaction.commit();
    logger.info("Attendance module database migration completed successfully");

    return {
      success: true,
      message: "Attendance tables created successfully",
      tables_created: ["student_attendance", "teacher_attendance"],
      views_created: ["attendance_daily_summary"],
      triggers_created: [
        "calculate_teacher_hours_before_insert",
        "calculate_teacher_hours_before_update",
      ],
    };
  } catch (error) {
    await transaction.rollback();
    logger.error("Error creating attendance tables", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Drop attendance tables (for rollback)
 * @param {Object} sequelize - Sequelize instance
 * @returns {Object} Result of the operation
 */
async function dropAttendanceTables(sequelize) {
  const transaction = await sequelize.transaction();

  try {
    logger.info("Dropping attendance tables...");

    // Drop triggers first
    await sequelize.query(
      "DROP TRIGGER IF EXISTS calculate_teacher_hours_before_insert;",
      { transaction },
    );
    await sequelize.query(
      "DROP TRIGGER IF EXISTS calculate_teacher_hours_before_update;",
      { transaction },
    );

    // Drop view
    await sequelize.query("DROP VIEW IF EXISTS attendance_daily_summary;", {
      transaction,
    });

    // Drop tables (foreign key constraints will be handled automatically)
    await sequelize.query("DROP TABLE IF EXISTS teacher_attendance;", {
      transaction,
    });
    await sequelize.query("DROP TABLE IF EXISTS student_attendance;", {
      transaction,
    });

    await transaction.commit();
    logger.info("Attendance tables dropped successfully");

    return {
      success: true,
      message: "Attendance tables dropped successfully",
    };
  } catch (error) {
    await transaction.rollback();
    logger.error("Error dropping attendance tables", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Check if attendance tables exist
 * @param {Object} sequelize - Sequelize instance
 * @returns {Object} Status of tables
 */
async function checkAttendanceTables(sequelize) {
  try {
    const [results] = await sequelize.query(`
         SELECT TABLE_NAME 
         FROM INFORMATION_SCHEMA.TABLES 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME IN ('student_attendance', 'teacher_attendance')
      `);

    return {
      student_attendance: results.some(
        (row) => row.TABLE_NAME === "student_attendance",
      ),
      teacher_attendance: results.some(
        (row) => row.TABLE_NAME === "teacher_attendance",
      ),
      all_present: results.length === 2,
    };
  } catch (error) {
    logger.error("Error checking attendance tables", {
      error: error.message,
    });
    throw error;
  }
}

module.exports = {
  createAttendanceTables,
  dropAttendanceTables,
  checkAttendanceTables,
};
