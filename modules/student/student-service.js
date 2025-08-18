const db = require('../data/database-service');
const workflowEngine = require('./workflow-engine');

class StudentService {

  async createStudent(studentData, trustCode) {
    try {
      return await db.transactionTrust(trustCode, async (connection) => {
        // Generate admission number if not provided
        let admissionNo = studentData.admission_no;
        if (!admissionNo) {
          admissionNo = await this.generateAdmissionNumber(studentData.school_id, trustCode);
        }

        const sql = `
          INSERT INTO students (
            admission_no, roll_no, first_name, last_name, date_of_birth, gender,
            blood_group, religion, caste, category, nationality, mother_tongue,
            address, city, state, postal_code, class_id, section_id, school_id,
            academic_year_id, admission_date, previous_school, transport_required,
            bus_route, medical_conditions, status, photo_url
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await connection.execute(sql, [
          admissionNo,
          studentData.roll_no || null,
          studentData.first_name,
          studentData.last_name,
          studentData.date_of_birth,
          studentData.gender,
          studentData.blood_group || null,
          studentData.religion || null,
          studentData.caste || null,
          studentData.category || 'GENERAL',
          studentData.nationality || 'Indian',
          studentData.mother_tongue || null,
          studentData.address || null,
          studentData.city,
          studentData.state,
          studentData.postal_code,
          studentData.class_id,
          studentData.section_id,
          studentData.school_id,
          studentData.academic_year_id,
          studentData.admission_date,
          studentData.previous_school || null,
          studentData.transport_required || false,
          studentData.bus_route || null,
          studentData.medical_conditions || null,
          studentData.status || 'ACTIVE',
          studentData.photo_url || null
        ]);

        const studentId = result.insertId;

        // Link parents if provided
        if (studentData.parents && studentData.parents.length > 0) {
          await this.linkParents(studentId, studentData.parents, trustCode, connection);
        }

        return { studentId, admissionNo };
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.message.includes('admission_no')) {
          throw new Error('Admission number already exists');
        }
        if (error.message.includes('roll_no')) {
          throw new Error('Roll number already exists for this class/section');
        }
      }
      throw new Error(`Failed to create student: ${error.message}`);
    }
  }

  async updateStudent(studentId, studentData, trustCode) {
    try {
      return await db.transactionTrust(trustCode, async (connection) => {
        // Build dynamic update query
        const updateFields = [];
        const params = [];

        const allowedFields = [
          'roll_no', 'first_name', 'last_name', 'blood_group', 'religion',
          'caste', 'category', 'nationality', 'mother_tongue', 'address',
          'city', 'state', 'postal_code', 'class_id', 'section_id',
          'previous_school', 'transport_required', 'bus_route',
          'medical_conditions', 'status', 'photo_url'
        ];

        for (const field of allowedFields) {
          if (studentData[field] !== undefined) {
            updateFields.push(`${field} = ?`);
            params.push(studentData[field]);
          }
        }

        if (updateFields.length === 0) {
          throw new Error('No valid fields to update');
        }

        params.push(studentId);

        const sql = `
          UPDATE students 
          SET ${updateFields.join(', ')}, updated_at = NOW()
          WHERE id = ?
        `;

        const [result] = await connection.execute(sql, params);

        if (result.affectedRows === 0) {
          throw new Error('Student not found or no changes made');
        }

        // Update parent links if provided
        if (studentData.parents !== undefined) {
          await this.updateParentLinks(studentId, studentData.parents, trustCode, connection);
        }

        return { studentId, updated: true };
      });
    } catch (error) {
      throw new Error(`Failed to update student: ${error.message}`);
    }
  }

  async getStudentById(studentId, trustCode) {
    const sql = `
      SELECT s.*, c.class_name, sec.section_name, sch.school_name, 
             ay.year_name as academic_year,
             GROUP_CONCAT(
               CONCAT(u.first_name, ' ', u.last_name, ':', sp.relationship, ':', sp.is_primary_contact)
               SEPARATOR ','
             ) as parents
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN schools sch ON s.school_id = sch.id
      LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
      LEFT JOIN student_parents sp ON s.id = sp.student_id
      LEFT JOIN users u ON sp.parent_id = u.id
      WHERE s.id = ?
      GROUP BY s.id
    `;

    const students = await db.queryTrust(trustCode, sql, [studentId]);
    
    if (students.length === 0) {
      return null;
    }

    const student = students[0];
    
    // Parse parents information
    if (student.parents) {
      student.parents = student.parents.split(',').map(parentInfo => {
        const [name, relationship, isPrimary] = parentInfo.split(':');
        return {
          name,
          relationship,
          isPrimaryContact: isPrimary === '1'
        };
      });
    } else {
      student.parents = [];
    }

    return student;
  }

  async getStudents(filters, trustCode) {
    let sql = `
      SELECT s.id, s.admission_no, s.roll_no, s.first_name, s.last_name,
             s.date_of_birth, s.gender, s.status, s.admission_date,
             c.class_name, sec.section_name, sch.school_name
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN schools sch ON s.school_id = sch.id
      WHERE 1=1
    `;

    const params = [];

    // Apply filters
    if (filters.status) {
      sql += ' AND s.status = ?';
      params.push(filters.status);
    }

    if (filters.school_id) {
      sql += ' AND s.school_id = ?';
      params.push(filters.school_id);
    }

    if (filters.class_id) {
      sql += ' AND s.class_id = ?';
      params.push(filters.class_id);
    }

    if (filters.section_id) {
      sql += ' AND s.section_id = ?';
      params.push(filters.section_id);
    }

    if (filters.academic_year_id) {
      sql += ' AND s.academic_year_id = ?';
      params.push(filters.academic_year_id);
    }

    if (filters.search) {
      sql += ` AND (
        s.first_name LIKE ? OR s.last_name LIKE ? OR 
        s.admission_no LIKE ? OR s.roll_no LIKE ? OR
        CONCAT(s.first_name, ' ', s.last_name) LIKE ?
      )`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Sorting
    const sortField = filters.sortBy || 'first_name';
    const sortOrder = filters.sortOrder || 'ASC';
    sql += ` ORDER BY s.${sortField} ${sortOrder}`;

    // Pagination
    if (filters.limit) {
      sql += ` LIMIT ${parseInt(filters.limit)}`;
      if (filters.offset) {
        sql += ` OFFSET ${parseInt(filters.offset)}`;
      }
    }

    return await db.queryTrust(trustCode, sql, params);
  }

  async generateAdmissionNumber(schoolId, trustCode) {
    // Get school code
    const schoolSql = 'SELECT school_code FROM schools WHERE id = ?';
    const schools = await db.queryTrust(trustCode, schoolSql, [schoolId]);
    
    if (schools.length === 0) {
      throw new Error('School not found');
    }

    const schoolCode = schools[0].school_code;
    const year = new Date().getFullYear().toString();
    
    // Get next sequence number
    const sql = `
      SELECT COALESCE(MAX(CAST(SUBSTRING(admission_no, LENGTH(?) + 5) AS UNSIGNED)), 0) + 1 as next_seq
      FROM students 
      WHERE admission_no LIKE CONCAT(?, '/', ?, '/%')
    `;

    const result = await db.queryTrust(trustCode, sql, [schoolCode, schoolCode, year]);
    const sequence = result[0].next_seq.toString().padStart(4, '0');
    
    return `${schoolCode}/${year}/${sequence}`;
  }

  async generateRollNumber(classId, sectionId, trustCode) {
    const sql = `
      SELECT COALESCE(MAX(CAST(roll_no AS UNSIGNED)), 0) + 1 as next_roll
      FROM students 
      WHERE class_id = ? AND section_id = ? AND roll_no REGEXP '^[0-9]+$'
    `;

    const result = await db.queryTrust(trustCode, sql, [classId, sectionId]);
    return result[0].next_roll.toString();
  }

  async linkParents(studentId, parents, trustCode, connection) {
    for (const parent of parents) {
      // Check if parent user exists
      let parentId = parent.parent_id;
      
      if (!parentId && parent.email) {
        // Try to find existing parent by email
        const [existingParents] = await connection.execute(
          'SELECT id FROM users WHERE email = ? AND role = "PARENT"',
          [parent.email]
        );
        
        if (existingParents.length > 0) {
          parentId = existingParents[0].id;
        }
      }

      if (parentId) {
        const linkSql = `
          INSERT INTO student_parents (student_id, parent_id, relationship, is_primary_contact)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            relationship = VALUES(relationship),
            is_primary_contact = VALUES(is_primary_contact)
        `;

        await connection.execute(linkSql, [
          studentId,
          parentId,
          parent.relationship,
          parent.is_primary_contact || false
        ]);
      }
    }
  }

  async updateParentLinks(studentId, parents, trustCode, connection) {
    // Remove existing links
    await connection.execute(
      'DELETE FROM student_parents WHERE student_id = ?',
      [studentId]
    );

    // Add new links
    if (parents && parents.length > 0) {
      await this.linkParents(studentId, parents, trustCode, connection);
    }
  }

  // Admission workflow methods
  async startAdmissionProcess(applicationData, trustCode) {
    return await workflowEngine.startWorkflow(
      'student_admission',
      applicationData,
      trustCode
    );
  }

  async processAdmissionStep(workflowId, stepId, stepData, trustCode) {
    return await workflowEngine.processStep(
      workflowId,
      stepId,
      stepData,
      trustCode
    );
  }

  async getAdmissionWorkflow(workflowId, trustCode) {
    return await workflowEngine.getWorkflow(workflowId, trustCode);
  }

  async transferStudent(studentId, transferData, trustCode) {
    try {
      return await db.transactionTrust(trustCode, async (connection) => {
        // Create transfer record
        const transferSql = `
          INSERT INTO student_transfers (
            student_id, from_school_id, to_school_id, from_class_id,
            to_class_id, transfer_date, reason, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [transferResult] = await connection.execute(transferSql, [
          studentId,
          transferData.from_school_id,
          transferData.to_school_id,
          transferData.from_class_id,
          transferData.to_class_id,
          transferData.transfer_date,
          transferData.reason,
          transferData.created_by
        ]);

        const transferId = transferResult.insertId;

        // If approved immediately (same trust transfer)
        if (transferData.auto_approve) {
          await this.approveTransfer(transferId, transferData.created_by, connection);
        }

        return { transferId };
      });
    } catch (error) {
      throw new Error(`Failed to initiate transfer: ${error.message}`);
    }
  }

  async approveTransfer(transferId, approvedBy, connection) {
    // Update transfer status
    const updateSql = `
      UPDATE student_transfers 
      SET status = 'APPROVED', approved_by = ?, updated_at = NOW()
      WHERE id = ?
    `;

    await connection.execute(updateSql, [approvedBy, transferId]);

    // Get transfer details
    const [transfers] = await connection.execute(
      'SELECT * FROM student_transfers WHERE id = ?',
      [transferId]
    );

    const transfer = transfers[0];

    // Update student record
    const studentUpdateSql = `
      UPDATE students 
      SET school_id = ?, class_id = ?
      WHERE id = ?
    `;

    await connection.execute(studentUpdateSql, [
      transfer.to_school_id,
      transfer.to_class_id,
      transfer.student_id
    ]);

    return true;
  }

  async promoteStudents(promotionData, trustCode) {
    try {
      return await db.transactionTrust(trustCode, async (connection) => {
        const results = [];

        for (const promotion of promotionData.students) {
          const sql = `
            UPDATE students 
            SET class_id = ?, section_id = ?, academic_year_id = ?
            WHERE id = ?
          `;

          const [result] = await connection.execute(sql, [
            promotion.new_class_id,
            promotion.new_section_id,
            promotionData.new_academic_year_id,
            promotion.student_id
          ]);

          results.push({
            studentId: promotion.student_id,
            promoted: result.affectedRows > 0
          });
        }

        return { promoted: results };
      });
    } catch (error) {
      throw new Error(`Failed to promote students: ${error.message}`);
    }
  }

  async getStudentsByClass(classId, sectionId, trustCode) {
    const sql = `
      SELECT s.id, s.admission_no, s.roll_no, s.first_name, s.last_name,
             s.date_of_birth, s.gender, s.status
      FROM students s
      WHERE s.class_id = ? AND s.section_id = ? AND s.status = 'ACTIVE'
      ORDER BY s.roll_no ASC, s.first_name ASC
    `;

    return await db.queryTrust(trustCode, sql, [classId, sectionId]);
  }

  async getStudentStats(trustCode, filters = {}) {
    let sql = `
      SELECT 
        s.status,
        s.gender,
        c.class_name,
        sch.school_name,
        COUNT(*) as count
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN schools sch ON s.school_id = sch.id
      WHERE 1=1
    `;

    const params = [];

    if (filters.school_id) {
      sql += ' AND s.school_id = ?';
      params.push(filters.school_id);
    }

    if (filters.academic_year_id) {
      sql += ' AND s.academic_year_id = ?';
      params.push(filters.academic_year_id);
    }

    sql += ' GROUP BY s.status, s.gender, c.class_name, sch.school_name';

    return await db.queryTrust(trustCode, sql, params);
  }

  async searchStudents(query, trustCode, filters = {}) {
    let sql = `
      SELECT s.id, s.admission_no, s.roll_no, s.first_name, s.last_name,
             s.status, c.class_name, sec.section_name, sch.school_name
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN schools sch ON s.school_id = sch.id
      WHERE (
        s.first_name LIKE ? OR s.last_name LIKE ? OR 
        s.admission_no LIKE ? OR s.roll_no LIKE ? OR
        CONCAT(s.first_name, ' ', s.last_name) LIKE ?
      )
    `;

    const searchTerm = `%${query}%`;
    const params = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];

    if (filters.status) {
      sql += ' AND s.status = ?';
      params.push(filters.status);
    }

    if (filters.school_id) {
      sql += ' AND s.school_id = ?';
      params.push(filters.school_id);
    }

    sql += ' ORDER BY s.first_name ASC LIMIT 50';

    return await db.queryTrust(trustCode, sql, params);
  }
}

module.exports = new StudentService();