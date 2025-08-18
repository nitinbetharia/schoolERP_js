const db = require('../data/database-service');

class AttendanceService {

  async markAttendance(attendanceData, trustCode) {
    try {
      const sql = `
        INSERT INTO attendance_daily (
          student_id, class_id, section_id, attendance_date, status,
          in_time, out_time, remarks, marked_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          status = VALUES(status),
          in_time = VALUES(in_time),
          out_time = VALUES(out_time),
          remarks = VALUES(remarks),
          marked_by = VALUES(marked_by),
          updated_at = NOW()
      `;

      const result = await db.queryTrust(trustCode, sql, [
        attendanceData.student_id,
        attendanceData.class_id,
        attendanceData.section_id,
        attendanceData.attendance_date,
        attendanceData.status,
        attendanceData.in_time || null,
        attendanceData.out_time || null,
        attendanceData.remarks || null,
        attendanceData.marked_by
      ]);

      // Update attendance summary
      await this.updateAttendanceSummary(
        attendanceData.student_id,
        attendanceData.attendance_date,
        trustCode
      );

      return { attendanceId: result.insertId || result.affectedRows };
    } catch (error) {
      throw new Error(`Failed to mark attendance: ${error.message}`);
    }
  }

  async bulkMarkAttendance(bulkData, trustCode) {
    try {
      return await db.transactionTrust(trustCode, async (connection) => {
        const results = [];

        for (const record of bulkData.attendance_records) {
          const sql = `
            INSERT INTO attendance_daily (
              student_id, class_id, section_id, attendance_date, status,
              in_time, out_time, remarks, marked_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              status = VALUES(status),
              in_time = VALUES(in_time),
              out_time = VALUES(out_time),
              remarks = VALUES(remarks),
              marked_by = VALUES(marked_by),
              updated_at = NOW()
          `;

          const [result] = await connection.execute(sql, [
            record.student_id,
            bulkData.class_id,
            bulkData.section_id,
            bulkData.attendance_date,
            record.status,
            record.in_time || null,
            record.out_time || null,
            record.remarks || null,
            bulkData.marked_by
          ]);

          results.push({
            studentId: record.student_id,
            attendanceId: result.insertId || result.affectedRows,
            status: record.status
          });

          // Update summary for each student
          await this.updateAttendanceSummaryInTransaction(
            record.student_id,
            bulkData.attendance_date,
            connection
          );
        }

        return { marked: results.length, records: results };
      });
    } catch (error) {
      throw new Error(`Failed to bulk mark attendance: ${error.message}`);
    }
  }

  async getDailyAttendance(classId, sectionId, date, trustCode) {
    const sql = `
      SELECT 
        s.id as student_id,
        s.admission_no,
        s.roll_no,
        s.first_name,
        s.last_name,
        ad.status,
        ad.in_time,
        ad.out_time,
        ad.remarks,
        ad.marked_by
      FROM students s
      LEFT JOIN attendance_daily ad ON s.id = ad.student_id 
        AND ad.attendance_date = ?
      WHERE s.class_id = ? AND s.section_id = ? AND s.status = 'ACTIVE'
      ORDER BY s.roll_no ASC, s.first_name ASC
    `;

    return await db.queryTrust(trustCode, sql, [date, classId, sectionId]);
  }

  async getStudentAttendance(studentId, dateRange, trustCode) {
    let sql = `
      SELECT 
        ad.attendance_date,
        ad.status,
        ad.in_time,
        ad.out_time,
        ad.remarks
      FROM attendance_daily ad
      WHERE ad.student_id = ?
    `;

    const params = [studentId];

    if (dateRange.from_date) {
      sql += ' AND ad.attendance_date >= ?';
      params.push(dateRange.from_date);
    }

    if (dateRange.to_date) {
      sql += ' AND ad.attendance_date <= ?';
      params.push(dateRange.to_date);
    }

    sql += ' ORDER BY ad.attendance_date DESC';

    return await db.queryTrust(trustCode, sql, params);
  }

  async getAttendanceReport(filters, trustCode) {
    let sql = `
      SELECT 
        s.id as student_id,
        s.admission_no,
        s.roll_no,
        s.first_name,
        s.last_name,
        c.class_name,
        sec.section_name,
        COUNT(ad.id) as total_days,
        SUM(CASE WHEN ad.status = 'PRESENT' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN ad.status = 'ABSENT' THEN 1 ELSE 0 END) as absent_days,
        SUM(CASE WHEN ad.status = 'LATE' THEN 1 ELSE 0 END) as late_days,
        SUM(CASE WHEN ad.status = 'HALF_DAY' THEN 1 ELSE 0 END) as half_days,
        ROUND((SUM(CASE WHEN ad.status = 'PRESENT' THEN 1 ELSE 0 END) * 100.0 / COUNT(ad.id)), 2) as percentage
      FROM students s
      LEFT JOIN attendance_daily ad ON s.id = ad.student_id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      WHERE s.status = 'ACTIVE'
    `;

    const params = [];

    if (filters.class_id) {
      sql += ' AND s.class_id = ?';
      params.push(filters.class_id);
    }

    if (filters.section_id) {
      sql += ' AND s.section_id = ?';
      params.push(filters.section_id);
    }

    if (filters.school_id) {
      sql += ' AND s.school_id = ?';
      params.push(filters.school_id);
    }

    if (filters.from_date) {
      sql += ' AND ad.attendance_date >= ?';
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      sql += ' AND ad.attendance_date <= ?';
      params.push(filters.to_date);
    }

    sql += ` 
      GROUP BY s.id
      ORDER BY s.class_id ASC, s.section_id ASC, s.roll_no ASC
    `;

    return await db.queryTrust(trustCode, sql, params);
  }

  async updateAttendanceSummary(studentId, attendanceDate, trustCode) {
    const date = new Date(attendanceDate);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    // Get monthly attendance data
    const sql = `
      SELECT 
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) as absent_days,
        SUM(CASE WHEN status = 'LATE' THEN 1 ELSE 0 END) as late_days,
        SUM(CASE WHEN status = 'HALF_DAY' THEN 1 ELSE 0 END) as half_days,
        SUM(CASE WHEN status = 'SICK' THEN 1 ELSE 0 END) as sick_days,
        SUM(CASE WHEN status = 'HOLIDAY' THEN 1 ELSE 0 END) as holiday_days
      FROM attendance_daily
      WHERE student_id = ? 
        AND MONTH(attendance_date) = ? 
        AND YEAR(attendance_date) = ?
    `;

    const result = await db.queryTrust(trustCode, sql, [studentId, month, year]);
    const stats = result[0];

    const percentage = stats.total_days > 0 ? 
      Math.round((stats.present_days * 100) / stats.total_days * 100) / 100 : 0;

    // Update or insert summary
    const updateSql = `
      INSERT INTO attendance_summary (
        student_id, month, year, total_days, present_days, absent_days,
        late_days, half_days, sick_days, holiday_days, percentage
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        total_days = VALUES(total_days),
        present_days = VALUES(present_days),
        absent_days = VALUES(absent_days),
        late_days = VALUES(late_days),
        half_days = VALUES(half_days),
        sick_days = VALUES(sick_days),
        holiday_days = VALUES(holiday_days),
        percentage = VALUES(percentage),
        updated_at = NOW()
    `;

    await db.queryTrust(trustCode, updateSql, [
      studentId, month, year,
      stats.total_days, stats.present_days, stats.absent_days,
      stats.late_days, stats.half_days, stats.sick_days,
      stats.holiday_days, percentage
    ]);
  }

  async updateAttendanceSummaryInTransaction(studentId, attendanceDate, connection) {
    const date = new Date(attendanceDate);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    // Get monthly attendance data
    const sql = `
      SELECT 
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) as absent_days,
        SUM(CASE WHEN status = 'LATE' THEN 1 ELSE 0 END) as late_days,
        SUM(CASE WHEN status = 'HALF_DAY' THEN 1 ELSE 0 END) as half_days,
        SUM(CASE WHEN status = 'SICK' THEN 1 ELSE 0 END) as sick_days,
        SUM(CASE WHEN status = 'HOLIDAY' THEN 1 ELSE 0 END) as holiday_days
      FROM attendance_daily
      WHERE student_id = ? 
        AND MONTH(attendance_date) = ? 
        AND YEAR(attendance_date) = ?
    `;

    const [result] = await connection.execute(sql, [studentId, month, year]);
    const stats = result[0];

    const percentage = stats.total_days > 0 ? 
      Math.round((stats.present_days * 100) / stats.total_days * 100) / 100 : 0;

    // Update or insert summary
    const updateSql = `
      INSERT INTO attendance_summary (
        student_id, month, year, total_days, present_days, absent_days,
        late_days, half_days, sick_days, holiday_days, percentage
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        total_days = VALUES(total_days),
        present_days = VALUES(present_days),
        absent_days = VALUES(absent_days),
        late_days = VALUES(late_days),
        half_days = VALUES(half_days),
        sick_days = VALUES(sick_days),
        holiday_days = VALUES(holiday_days),
        percentage = VALUES(percentage),
        updated_at = NOW()
    `;

    await connection.execute(updateSql, [
      studentId, month, year,
      stats.total_days, stats.present_days, stats.absent_days,
      stats.late_days, stats.half_days, stats.sick_days,
      stats.holiday_days, percentage
    ]);
  }

  // Leave Application Management
  async createLeaveApplication(leaveData, trustCode) {
    try {
      const sql = `
        INSERT INTO leave_applications (
          student_id, leave_type, from_date, to_date, total_days,
          reason, applied_by, medical_certificate
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await db.queryTrust(trustCode, sql, [
        leaveData.student_id,
        leaveData.leave_type,
        leaveData.from_date,
        leaveData.to_date,
        leaveData.total_days,
        leaveData.reason,
        leaveData.applied_by,
        leaveData.medical_certificate || null
      ]);

      return { leaveApplicationId: result.insertId };
    } catch (error) {
      throw new Error(`Failed to create leave application: ${error.message}`);
    }
  }

  async updateLeaveApplication(leaveId, updateData, trustCode) {
    try {
      const sql = `
        UPDATE leave_applications 
        SET status = ?, approved_by = ?, approved_at = ?, remarks = ?
        WHERE id = ?
      `;

      const result = await db.queryTrust(trustCode, sql, [
        updateData.status,
        updateData.approved_by || null,
        updateData.status === 'APPROVED' ? new Date() : null,
        updateData.remarks || null,
        leaveId
      ]);

      if (result.affectedRows === 0) {
        throw new Error('Leave application not found');
      }

      // If approved, mark attendance as leave
      if (updateData.status === 'APPROVED') {
        await this.markLeaveAttendance(leaveId, trustCode);
      }

      return { leaveId, updated: true };
    } catch (error) {
      throw new Error(`Failed to update leave application: ${error.message}`);
    }
  }

  async markLeaveAttendance(leaveId, trustCode) {
    // Get leave details
    const leaveSql = `
      SELECT student_id, from_date, to_date, leave_type
      FROM leave_applications 
      WHERE id = ? AND status = 'APPROVED'
    `;

    const leaves = await db.queryTrust(trustCode, leaveSql, [leaveId]);
    
    if (leaves.length === 0) return;

    const leave = leaves[0];
    
    // Get student's class and section
    const studentSql = `
      SELECT class_id, section_id FROM students WHERE id = ?
    `;
    
    const students = await db.queryTrust(trustCode, studentSql, [leave.student_id]);
    
    if (students.length === 0) return;

    const student = students[0];

    // Mark attendance for each day in the leave period
    const fromDate = new Date(leave.from_date);
    const toDate = new Date(leave.to_date);
    
    for (let date = new Date(fromDate); date <= toDate; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      
      const attendanceSql = `
        INSERT INTO attendance_daily (
          student_id, class_id, section_id, attendance_date, status, remarks, marked_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          status = VALUES(status),
          remarks = VALUES(remarks),
          updated_at = NOW()
      `;

      await db.queryTrust(trustCode, attendanceSql, [
        leave.student_id,
        student.class_id,
        student.section_id,
        dateStr,
        leave.leave_type === 'SICK' ? 'SICK' : 'ABSENT',
        `Leave approved - ${leave.leave_type}`,
        1 // System user
      ]);

      // Update summary
      await this.updateAttendanceSummary(leave.student_id, dateStr, trustCode);
    }
  }

  async getLeaveApplications(filters, trustCode) {
    let sql = `
      SELECT 
        la.id,
        la.leave_type,
        la.from_date,
        la.to_date,
        la.total_days,
        la.reason,
        la.status,
        la.applied_by,
        la.approved_by,
        la.created_at,
        s.admission_no,
        s.first_name,
        s.last_name,
        c.class_name,
        sec.section_name,
        applier.first_name as applied_by_name,
        approver.first_name as approved_by_name
      FROM leave_applications la
      JOIN students s ON la.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN users applier ON la.applied_by = applier.id
      LEFT JOIN users approver ON la.approved_by = approver.id
      WHERE 1=1
    `;

    const params = [];

    if (filters.student_id) {
      sql += ' AND la.student_id = ?';
      params.push(filters.student_id);
    }

    if (filters.status) {
      sql += ' AND la.status = ?';
      params.push(filters.status);
    }

    if (filters.class_id) {
      sql += ' AND s.class_id = ?';
      params.push(filters.class_id);
    }

    if (filters.from_date) {
      sql += ' AND la.from_date >= ?';
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      sql += ' AND la.to_date <= ?';
      params.push(filters.to_date);
    }

    sql += ' ORDER BY la.created_at DESC';

    return await db.queryTrust(trustCode, sql, params);
  }

  async getAttendanceStatistics(filters, trustCode) {
    let sql = `
      SELECT 
        COUNT(DISTINCT s.id) as total_students,
        COUNT(ad.id) as total_attendance_records,
        SUM(CASE WHEN ad.status = 'PRESENT' THEN 1 ELSE 0 END) as total_present,
        SUM(CASE WHEN ad.status = 'ABSENT' THEN 1 ELSE 0 END) as total_absent,
        SUM(CASE WHEN ad.status = 'LATE' THEN 1 ELSE 0 END) as total_late,
        ROUND(AVG(CASE WHEN ad.status = 'PRESENT' THEN 100 ELSE 0 END), 2) as average_attendance
      FROM students s
      LEFT JOIN attendance_daily ad ON s.id = ad.student_id
      WHERE s.status = 'ACTIVE'
    `;

    const params = [];

    if (filters.school_id) {
      sql += ' AND s.school_id = ?';
      params.push(filters.school_id);
    }

    if (filters.class_id) {
      sql += ' AND s.class_id = ?';
      params.push(filters.class_id);
    }

    if (filters.from_date) {
      sql += ' AND ad.attendance_date >= ?';
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      sql += ' AND ad.attendance_date <= ?';
      params.push(filters.to_date);
    }

    const result = await db.queryTrust(trustCode, sql, params);
    return result[0];
  }

  async getClassAttendanceSummary(classId, sectionId, date, trustCode) {
    const sql = `
      SELECT 
        COUNT(*) as total_students,
        SUM(CASE WHEN ad.status = 'PRESENT' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN ad.status = 'ABSENT' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN ad.status = 'LATE' THEN 1 ELSE 0 END) as late_count,
        SUM(CASE WHEN ad.status IS NULL THEN 1 ELSE 0 END) as not_marked_count
      FROM students s
      LEFT JOIN attendance_daily ad ON s.id = ad.student_id AND ad.attendance_date = ?
      WHERE s.class_id = ? AND s.section_id = ? AND s.status = 'ACTIVE'
    `;

    const result = await db.queryTrust(trustCode, sql, [date, classId, sectionId]);
    const summary = result[0];

    summary.attendance_percentage = summary.total_students > 0 ? 
      Math.round((summary.present_count * 100) / summary.total_students * 100) / 100 : 0;

    return summary;
  }

  async getLowAttendanceStudents(threshold, filters, trustCode) {
    let sql = `
      SELECT 
        s.id as student_id,
        s.admission_no,
        s.first_name,
        s.last_name,
        c.class_name,
        sec.section_name,
        as_summary.percentage as attendance_percentage,
        as_summary.total_days,
        as_summary.present_days,
        as_summary.absent_days
      FROM students s
      JOIN attendance_summary as_summary ON s.id = as_summary.student_id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      WHERE s.status = 'ACTIVE' 
        AND as_summary.percentage < ?
    `;

    const params = [threshold];

    if (filters.school_id) {
      sql += ' AND s.school_id = ?';
      params.push(filters.school_id);
    }

    if (filters.class_id) {
      sql += ' AND s.class_id = ?';
      params.push(filters.class_id);
    }

    if (filters.month) {
      sql += ' AND as_summary.month = ?';
      params.push(filters.month);
    }

    if (filters.year) {
      sql += ' AND as_summary.year = ?';
      params.push(filters.year);
    }

    sql += ' ORDER BY as_summary.percentage ASC, s.first_name ASC';

    return await db.queryTrust(trustCode, sql, params);
  }
}

module.exports = new AttendanceService();