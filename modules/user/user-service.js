const db = require('../data/database-service');
const authService = require('../auth/auth-service');

class UserService {
  
  async createUser(userData, trustCode) {
    try {
      return await db.transactionTrust(trustCode, async (connection) => {
        // Hash password
        const hashedPassword = await authService.hashPassword(userData.password);
        
        // Generate employee ID if not provided
        let employeeId = userData.employee_id;
        if (!employeeId && ['TEACHER', 'ACCOUNTANT', 'SCHOOL_ADMIN', 'TRUST_ADMIN'].includes(userData.role)) {
          employeeId = await this.generateEmployeeId(userData.role, trustCode);
        }

        const sql = `
          INSERT INTO users (
            employee_id, first_name, last_name, email, phone, password_hash,
            role, status, school_id, department, designation, date_of_joining,
            date_of_birth, gender, address, city, state, postal_code,
            emergency_contact_name, emergency_contact_phone
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await connection.execute(sql, [
          employeeId,
          userData.first_name,
          userData.last_name,
          userData.email,
          userData.phone,
          hashedPassword,
          userData.role,
          userData.status || 'ACTIVE',
          userData.school_id || null,
          userData.department || null,
          userData.designation || null,
          userData.date_of_joining || null,
          userData.date_of_birth || null,
          userData.gender || null,
          userData.address || null,
          userData.city || null,
          userData.state || null,
          userData.postal_code || null,
          userData.emergency_contact_name || null,
          userData.emergency_contact_phone || null
        ]);

        const userId = result.insertId;

        // Create school assignments if provided
        if (userData.school_assignments && userData.school_assignments.length > 0) {
          await this.createSchoolAssignments(userId, userData.school_assignments, userData.role, connection);
        }

        return { userId, employeeId };
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.message.includes('email')) {
          throw new Error('Email address already exists');
        }
        if (error.message.includes('employee_id')) {
          throw new Error('Employee ID already exists');
        }
      }
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  async updateUser(userId, userData, trustCode) {
    try {
      return await db.transactionTrust(trustCode, async (connection) => {
        // Build dynamic update query
        const updateFields = [];
        const params = [];

        const allowedFields = [
          'first_name', 'last_name', 'phone', 'status', 'school_id',
          'department', 'designation', 'date_of_joining', 'date_of_birth',
          'gender', 'address', 'city', 'state', 'postal_code',
          'emergency_contact_name', 'emergency_contact_phone'
        ];

        for (const field of allowedFields) {
          if (userData[field] !== undefined) {
            updateFields.push(`${field} = ?`);
            params.push(userData[field]);
          }
        }

        if (updateFields.length === 0) {
          throw new Error('No valid fields to update');
        }

        params.push(userId);

        const sql = `
          UPDATE users 
          SET ${updateFields.join(', ')}, updated_at = NOW()
          WHERE id = ?
        `;

        const [result] = await connection.execute(sql, params);

        if (result.affectedRows === 0) {
          throw new Error('User not found or no changes made');
        }

        // Update school assignments if provided
        if (userData.school_assignments !== undefined) {
          await this.updateSchoolAssignments(userId, userData.school_assignments, connection);
        }

        return { userId, updated: true };
      });
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  async getUserById(userId, trustCode) {
    const sql = `
      SELECT u.*, 
             GROUP_CONCAT(CONCAT(usa.school_id, ':', usa.role) SEPARATOR ',') as school_assignments
      FROM users u
      LEFT JOIN user_school_assignments usa ON u.id = usa.user_id AND usa.status = 'ACTIVE'
      WHERE u.id = ?
      GROUP BY u.id
    `;

    const users = await db.queryTrust(trustCode, sql, [userId]);
    
    if (users.length === 0) {
      return null;
    }

    const user = users[0];
    
    // Parse school assignments
    if (user.school_assignments) {
      user.school_assignments = user.school_assignments.split(',').map(assignment => {
        const [schoolId, role] = assignment.split(':');
        return { schoolId: parseInt(schoolId), role };
      });
    } else {
      user.school_assignments = [];
    }

    // Remove sensitive data
    delete user.password_hash;
    delete user.password_reset_token;

    return user;
  }

  async getUsers(filters, trustCode) {
    let sql = `
      SELECT u.id, u.employee_id, u.first_name, u.last_name, u.email, 
             u.phone, u.role, u.status, u.school_id, u.department, 
             u.designation, u.date_of_joining, u.last_login, u.created_at,
             s.school_name
      FROM users u
      LEFT JOIN schools s ON u.school_id = s.id
      WHERE 1=1
    `;

    const params = [];

    // Apply filters
    if (filters.role) {
      sql += ' AND u.role = ?';
      params.push(filters.role);
    }

    if (filters.status) {
      sql += ' AND u.status = ?';
      params.push(filters.status);
    }

    if (filters.school_id) {
      sql += ' AND u.school_id = ?';
      params.push(filters.school_id);
    }

    if (filters.search) {
      sql += ` AND (
        u.first_name LIKE ? OR u.last_name LIKE ? OR 
        u.email LIKE ? OR u.employee_id LIKE ?
      )`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Sorting
    const sortField = filters.sortBy || 'first_name';
    const sortOrder = filters.sortOrder || 'ASC';
    sql += ` ORDER BY u.${sortField} ${sortOrder}`;

    // Pagination
    if (filters.limit) {
      sql += ` LIMIT ${parseInt(filters.limit)}`;
      if (filters.offset) {
        sql += ` OFFSET ${parseInt(filters.offset)}`;
      }
    }

    return await db.queryTrust(trustCode, sql, params);
  }

  async deleteUser(userId, trustCode) {
    try {
      return await db.transactionTrust(trustCode, async (connection) => {
        // Check if user can be deleted (no critical dependencies)
        const dependencies = await this.checkUserDependencies(userId, connection);
        
        if (dependencies.canDelete === false) {
          throw new Error(`Cannot delete user: ${dependencies.reason}`);
        }

        // Soft delete - set status to INACTIVE
        const sql = `
          UPDATE users 
          SET status = 'INACTIVE', updated_at = NOW()
          WHERE id = ?
        `;

        const [result] = await connection.execute(sql, [userId]);

        if (result.affectedRows === 0) {
          throw new Error('User not found');
        }

        // Deactivate school assignments
        await connection.execute(
          'UPDATE user_school_assignments SET status = "INACTIVE" WHERE user_id = ?',
          [userId]
        );

        return { userId, deleted: true };
      });
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  async generateEmployeeId(role, trustCode) {
    const prefix = this.getRolePrefix(role);
    const year = new Date().getFullYear().toString().slice(-2);
    
    // Get next sequence number
    const sql = `
      SELECT COALESCE(MAX(CAST(SUBSTRING(employee_id, 4) AS UNSIGNED)), 0) + 1 as next_seq
      FROM users 
      WHERE employee_id LIKE '${prefix}${year}%'
    `;

    const result = await db.queryTrust(trustCode, sql);
    const sequence = result[0].next_seq.toString().padStart(4, '0');
    
    return `${prefix}${year}${sequence}`;
  }

  getRolePrefix(role) {
    const prefixes = {
      'TRUST_ADMIN': 'TA',
      'SCHOOL_ADMIN': 'SA',
      'TEACHER': 'TR',
      'ACCOUNTANT': 'AC'
    };
    return prefixes[role] || 'US';
  }

  async createSchoolAssignments(userId, assignments, userRole, connection) {
    for (const assignment of assignments) {
      const sql = `
        INSERT INTO user_school_assignments (user_id, school_id, role, assigned_by)
        VALUES (?, ?, ?, ?)
      `;
      
      await connection.execute(sql, [
        userId,
        assignment.schoolId,
        assignment.role || userRole,
        assignment.assignedBy || userId
      ]);
    }
  }

  async updateSchoolAssignments(userId, assignments, connection) {
    // Deactivate existing assignments
    await connection.execute(
      'UPDATE user_school_assignments SET status = "INACTIVE" WHERE user_id = ?',
      [userId]
    );

    // Create new assignments
    if (assignments && assignments.length > 0) {
      await this.createSchoolAssignments(userId, assignments, null, connection);
    }
  }

  async checkUserDependencies(userId, connection) {
    // Check if user has active student relationships (for parents)
    const [studentLinks] = await connection.execute(
      'SELECT COUNT(*) as count FROM student_parents WHERE parent_id = ?',
      [userId]
    );

    if (studentLinks[0].count > 0) {
      return {
        canDelete: false,
        reason: 'User has linked students'
      };
    }

    // Check if user has created critical records
    const [admissions] = await connection.execute(
      'SELECT COUNT(*) as count FROM admissions WHERE created_by = ? OR approved_by = ?',
      [userId, userId]
    );

    const [feeReceipts] = await connection.execute(
      'SELECT COUNT(*) as count FROM fee_receipts WHERE collected_by = ?',
      [userId]
    );

    if (admissions[0].count > 0 || feeReceipts[0].count > 0) {
      return {
        canDelete: false,
        reason: 'User has created critical records that cannot be orphaned'
      };
    }

    return { canDelete: true };
  }

  async getUsersByRole(role, trustCode, schoolId = null) {
    let sql = `
      SELECT id, employee_id, first_name, last_name, email, phone, 
             department, designation, status
      FROM users 
      WHERE role = ? AND status = 'ACTIVE'
    `;
    
    const params = [role];

    if (schoolId) {
      sql += ' AND school_id = ?';
      params.push(schoolId);
    }

    sql += ' ORDER BY first_name ASC';

    return await db.queryTrust(trustCode, sql, params);
  }

  async assignUserToSchool(userId, schoolId, role, assignedBy, trustCode) {
    const sql = `
      INSERT INTO user_school_assignments (user_id, school_id, role, assigned_by)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        status = 'ACTIVE', 
        assigned_by = VALUES(assigned_by),
        assigned_at = CURRENT_TIMESTAMP
    `;

    await db.queryTrust(trustCode, sql, [userId, schoolId, role, assignedBy]);
    return true;
  }

  async removeUserFromSchool(userId, schoolId, trustCode) {
    const sql = `
      UPDATE user_school_assignments 
      SET status = 'INACTIVE'
      WHERE user_id = ? AND school_id = ?
    `;

    const result = await db.queryTrust(trustCode, sql, [userId, schoolId]);
    return result.affectedRows > 0;
  }

  async getUserSchoolAssignments(userId, trustCode) {
    const sql = `
      SELECT usa.school_id, usa.role, usa.assigned_at, usa.status,
             s.school_name, s.school_code
      FROM user_school_assignments usa
      JOIN schools s ON usa.school_id = s.id
      WHERE usa.user_id = ?
      ORDER BY usa.assigned_at DESC
    `;

    return await db.queryTrust(trustCode, sql, [userId]);
  }

  async getUserStats(trustCode, schoolId = null) {
    let sql = `
      SELECT 
        role,
        status,
        COUNT(*) as count
      FROM users
      WHERE 1=1
    `;

    const params = [];

    if (schoolId) {
      sql += ' AND school_id = ?';
      params.push(schoolId);
    }

    sql += ' GROUP BY role, status ORDER BY role';

    return await db.queryTrust(trustCode, sql, params);
  }

  async searchUsers(query, trustCode, filters = {}) {
    let sql = `
      SELECT u.id, u.employee_id, u.first_name, u.last_name, u.email, 
             u.phone, u.role, u.status, s.school_name
      FROM users u
      LEFT JOIN schools s ON u.school_id = s.id
      WHERE (
        u.first_name LIKE ? OR u.last_name LIKE ? OR 
        u.email LIKE ? OR u.employee_id LIKE ? OR
        CONCAT(u.first_name, ' ', u.last_name) LIKE ?
      )
    `;

    const searchTerm = `%${query}%`;
    const params = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];

    if (filters.role) {
      sql += ' AND u.role = ?';
      params.push(filters.role);
    }

    if (filters.status) {
      sql += ' AND u.status = ?';
      params.push(filters.status);
    }

    sql += ' ORDER BY u.first_name ASC LIMIT 50';

    return await db.queryTrust(trustCode, sql, params);
  }
}

module.exports = new UserService();