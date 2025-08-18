const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../data/database-service');

class AuthService {
  constructor() {
    this.maxLoginAttempts = 5;
    this.lockoutTime = 15 * 60 * 1000; // 15 minutes
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
  }

  async hashPassword(password) {
    return bcrypt.hash(password, 12);
  }

  async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  async authenticateSystemUser(username, password) {
    try {
      // Ensure database is initialized
      await db.init();

      const user = await this.getSystemUserByUsername(username);
      if (!user) {
        // More specific error message for development
        throw new Error('User not found. Please check your email address.');
      }

      await this.checkAccountLockout(user, 'system');

      const isValid = await this.verifyPassword(password, user.password_hash);
      if (!isValid) {
        await this.handleFailedLogin(user.id, 'system');
        throw new Error('Incorrect password. Please try again.');
      }

      await this.handleSuccessfulLogin(user.id, 'system');
      return this.sanitizeUser(user);
    } catch (error) {
      throw error;
    }
  }

  async authenticateTrustUser(email, password, trustCode) {
    try {
      const user = await this.getTrustUserByEmail(email, trustCode);
      if (!user) {
        throw new Error('Invalid credentials');
      }

      await this.checkAccountLockout(user, 'trust', trustCode);

      const isValid = await this.verifyPassword(password, user.password_hash);
      if (!isValid) {
        await this.handleFailedLogin(user.id, 'trust', trustCode);
        throw new Error('Invalid credentials');
      }

      await this.handleSuccessfulLogin(user.id, 'trust', trustCode);
      return this.sanitizeUser(user);
    } catch (error) {
      throw error;
    }
  }

  async getSystemUserByUsername(username) {
    const sql = `
      SELECT id, email, password_hash, first_name, last_name, role, is_active
      FROM system_users 
      WHERE email = ? AND is_active = 1
    `;

    const users = await db.querySystem(sql, [username]);
    return users[0] || null;
  }

  async getTrustUserByEmail(email, trustCode) {
    const sql = `
      SELECT id, email, password_hash, first_name, last_name, role, 
             status, school_id, failed_login_attempts, locked_until, last_login
      FROM users 
      WHERE email = ? AND status = 'ACTIVE'
    `;

    const users = await db.queryTrust(trustCode, sql, [email]);
    return users[0] || null;
  }

  async checkAccountLockout(user, userType, trustCode = null) {
    // For system users, check if account is active
    if (userType === 'system' && !user.is_active) {
      throw new Error('Account is inactive.');
    }

    // Skip lockout checks for now since the table doesn't have these columns
    // TODO: Add proper lockout mechanism if needed
  }

  async handleFailedLogin(userId, userType, trustCode = null) {
    // Skip failed login tracking for now since the table doesn't have these columns
    // TODO: Add proper failed login tracking if needed
    console.log(`Failed login attempt for user ${userId} (${userType})`);
  }

  async handleSuccessfulLogin(userId, userType, trustCode = null) {
    // Update last login timestamp
    const sql = `
      UPDATE ${userType === 'system' ? 'system_users' : 'users'}
      SET updated_at = NOW()
      WHERE id = ?
    `;

    if (userType === 'system') {
      await db.querySystem(sql, [userId]);
    } else {
      await db.queryTrust(trustCode, sql, [userId]);
    }
  }

  async lockAccount(userId, lockUntil, userType, trustCode = null) {
    // Skip account locking for now since the table doesn't have these columns
    // TODO: Add proper account locking if needed
    console.log(`Account lock requested for user ${userId} (${userType})`);
  }

  async createPasswordResetToken(email, userType, trustCode = null) {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    const sql = `
      UPDATE ${userType === 'system' ? 'system_users' : 'users'}
      SET password_reset_token = ?, password_reset_expires = ?
      WHERE email = ?
    `;

    if (userType === 'system') {
      await db.querySystem(sql, [token, expires, email]);
    } else {
      await db.queryTrust(trustCode, sql, [token, expires, email]);
    }

    return token;
  }

  async resetPassword(token, newPassword, userType, trustCode = null) {
    const user = await this.getUserByResetToken(token, userType, trustCode);
    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    if (new Date() > new Date(user.password_reset_expires)) {
      throw new Error('Reset token has expired');
    }

    const hashedPassword = await this.hashPassword(newPassword);

    const sql = `
      UPDATE ${userType === 'system' ? 'system_users' : 'users'}
      SET password_hash = ?, password_reset_token = NULL, password_reset_expires = NULL
      WHERE id = ?
    `;

    if (userType === 'system') {
      await db.querySystem(sql, [hashedPassword, user.id]);
    } else {
      await db.queryTrust(trustCode, sql, [hashedPassword, user.id]);
    }

    return true;
  }

  async getUserByResetToken(token, userType, trustCode = null) {
    const sql = `
      SELECT id, password_reset_expires
      FROM ${userType === 'system' ? 'system_users' : 'users'}
      WHERE password_reset_token = ?
    `;

    let users;
    if (userType === 'system') {
      users = await db.querySystem(sql, [token]);
    } else {
      users = await db.queryTrust(trustCode, sql, [token]);
    }

    return users[0] || null;
  }

  async changePassword(userId, currentPassword, newPassword, userType, trustCode = null) {
    // Get current user
    const sql = `
      SELECT password_hash
      FROM ${userType === 'system' ? 'system_users' : 'users'}
      WHERE id = ?
    `;

    let users;
    if (userType === 'system') {
      users = await db.querySystem(sql, [userId]);
    } else {
      users = await db.queryTrust(trustCode, sql, [userId]);
    }

    const user = users[0];
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValid = await this.verifyPassword(currentPassword, user.password_hash);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    // Update password
    const hashedPassword = await this.hashPassword(newPassword);
    const updateSql = `
      UPDATE ${userType === 'system' ? 'system_users' : 'users'}
      SET password_hash = ?
      WHERE id = ?
    `;

    if (userType === 'system') {
      await db.querySystem(updateSql, [hashedPassword, userId]);
    } else {
      await db.queryTrust(trustCode, updateSql, [hashedPassword, userId]);
    }

    return true;
  }

  sanitizeUser(user) {
    const { password_hash, password_reset_token, ...sanitized } = user;

    // Handle both column naming conventions
    if (user.full_name) {
      const nameParts = user.full_name.split(' ');
      sanitized.firstName = nameParts[0] || '';
      sanitized.lastName = nameParts.slice(1).join(' ') || '';
    } else if (user.first_name && user.last_name) {
      sanitized.firstName = user.first_name;
      sanitized.lastName = user.last_name;
    }

    // Handle status field variations
    if (user.is_active !== undefined) {
      sanitized.status = user.is_active ? 'ACTIVE' : 'INACTIVE';
    } else if (user.status) {
      sanitized.status = user.status;
    }

    return sanitized;
  }

  generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  async createSession(userId, userType, trustCode, ipAddress, userAgent) {
    const sessionId = this.generateSessionToken();
    const expires = Math.floor((Date.now() + this.sessionTimeout) / 1000);

    const sessionData = {
      userId,
      userType,
      trustCode,
      ipAddress,
      userAgent,
      createdAt: new Date().toISOString()
    };

    const sql = `
      INSERT INTO system_sessions (session_id, user_id, user_type, ip_address, user_agent, data, expires)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await db.querySystem(sql, [
      sessionId,
      userId,
      userType,
      ipAddress,
      userAgent,
      JSON.stringify(sessionData),
      expires
    ]);

    return sessionId;
  }

  async getSession(sessionId) {
    const sql = `
      SELECT session_id, user_id, user_type, data, expires
      FROM system_sessions
      WHERE session_id = ? AND expires > UNIX_TIMESTAMP()
    `;

    const sessions = await db.querySystem(sql, [sessionId]);
    if (!sessions[0]) {
      return null;
    }

    const session = sessions[0];
    session.data = JSON.parse(session.data);
    return session;
  }

  async updateSession(sessionId) {
    const newExpires = Math.floor((Date.now() + this.sessionTimeout) / 1000);

    const sql = `
      UPDATE system_sessions
      SET expires = ?, updated_at = NOW()
      WHERE session_id = ?
    `;

    await db.querySystem(sql, [newExpires, sessionId]);
  }

  async destroySession(sessionId) {
    const sql = `DELETE FROM system_sessions WHERE session_id = ?`;
    await db.querySystem(sql, [sessionId]);
  }

  async cleanupExpiredSessions() {
    const sql = `DELETE FROM system_sessions WHERE expires < UNIX_TIMESTAMP()`;
    const result = await db.querySystem(sql);
    return result.affectedRows || 0;
  }

  // Unified login method for the route
  async login(email, password, loginType = 'TRUST', trustCode = null) {
    try {
      let user;
      let userType;

      // Simple fix: if trustCode looks like localhost or system context, treat as SYSTEM login
      const isSystemContext =
        !trustCode ||
        trustCode === 'localhost:3000' ||
        trustCode === 'localhost' ||
        trustCode === 'system' ||
        loginType === 'SYSTEM';

      if (isSystemContext) {
        user = await this.authenticateSystemUser(email, password);
        userType = 'system';
        trustCode = null;
      } else {
        user = await this.authenticateTrustUser(email, password, trustCode);
        userType = 'trust';
      }

      // Add permissions and other user data
      const permissions = await this.getUserPermissions(user.id, userType, trustCode);

      return {
        user: {
          ...user,
          permissions
        },
        redirectUrl: loginType === 'SYSTEM' ? '/admin/dashboard' : '/dashboard'
      };
    } catch (error) {
      throw error;
    }
  }

  // System login method
  async systemLogin(email, password) {
    return this.login(email, password, 'SYSTEM', null);
  }

  // Get user by ID
  async getUserById(userId, trustCode = null) {
    try {
      const sql = `
        SELECT id, email, first_name, last_name, role, status, school_id, last_login
        FROM users 
        WHERE id = ? AND status = 'ACTIVE'
      `;

      const users = await db.queryTrust(trustCode, sql, [userId]);
      return users[0] ? this.sanitizeUser(users[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Get user profile
  async getUserProfile(userId, trustCode = null) {
    try {
      const user = await this.getUserById(userId, trustCode);
      if (!user) {
        throw new Error('User not found');
      }

      // Get additional profile information if needed
      return user;
    } catch (error) {
      throw error;
    }
  }

  // Update user profile
  async updateUserProfile(userId, profileData, trustCode = null) {
    try {
      const { first_name, last_name, phone, ...otherData } = profileData;

      const sql = `
        UPDATE users 
        SET first_name = ?, last_name = ?, phone = ?, updated_at = NOW()
        WHERE id = ? AND status = 'ACTIVE'
      `;

      await db.queryTrust(trustCode, sql, [first_name, last_name, phone, userId]);

      return this.getUserById(userId, trustCode);
    } catch (error) {
      throw error;
    }
  }

  // Get user permissions
  async getUserPermissions(userId, userType = 'trust', trustCode = null) {
    try {
      // For now, return basic permissions based on role
      // This should be enhanced with a proper RBAC system

      let user;
      if (userType === 'system') {
        const sql = `SELECT role FROM system_users WHERE id = ?`;
        const users = await db.querySystem(sql, [userId]);
        user = users[0];
      } else {
        // Only query trust database if we have a trustCode
        if (!trustCode) {
          return [];
        }
        const sql = `SELECT role FROM users WHERE id = ?`;
        const users = await db.queryTrust(trustCode, sql, [userId]);
        user = users[0];
      }

      if (!user) {
        return [];
      }

      // Basic role-based permissions
      const rolePermissions = {
        SYSTEM_ADMIN: ['*'], // Full access - can access any trust
        GROUP_ADMIN: ['group.*', 'trust.*', 'school.*', 'user.*', 'student.*'],
        TRUST_ADMIN: ['trust.*', 'school.*', 'user.*', 'student.*'],
        SCHOOL_ADMIN: ['school.*', 'user.*', 'student.*'],
        TEACHER: ['student.view', 'student.edit', 'attendance.*'],
        ACCOUNTANT: ['fee.*', 'report.*'],
        PARENT: ['student.view'],
        STUDENT: ['profile.view']
      };

      return rolePermissions[user.role] || [];
    } catch (error) {
      throw error;
    }
  }

  // Update last activity
  async updateLastActivity(userId, trustCode = null) {
    try {
      const sql = `
        UPDATE users 
        SET last_activity = NOW()
        WHERE id = ?
      `;

      await db.queryTrust(trustCode, sql, [userId]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Change password method wrapper (updated signature)
  async changePasswordWrapper(userId, currentPassword, newPassword, trustCode = null) {
    return this.changePassword(userId, currentPassword, newPassword, 'trust', trustCode);
  }

  // Initiate password reset
  async initiatePasswordReset(email, trustCode = null) {
    try {
      const token = await this.createPasswordResetToken(email, 'trust', trustCode);

      // Here you would normally send an email with the reset token
      // For now, we'll just log it (in development) or return success

      console.log(`Password reset token for ${email}: ${token}`);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Reset password method wrapper (updated signature)
  async resetPasswordWrapper(token, newPassword, trustCode = null) {
    return this.resetPassword(token, newPassword, 'trust', trustCode);
  }
}

module.exports = new AuthService();
