/**
 * Update Trust User Password Script
 * Updates the demo trust user password with proper bcrypt hashing
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const { logSystem, logError } = require('../utils/logger');

// Database configuration
const DB_CONFIG = {
    host: '140.238.167.36',
    port: 3306,
    user: 'school_erp_admin',
    password: 'Nitin@123#',
    charset: 'utf8mb4'
};

async function updateTrustUserPassword() {
    let connection;
    
    try {
        console.log('🔧 Updating demo trust user password...');

        // Connect to the trust database
        connection = await mysql.createConnection({
            ...DB_CONFIG,
            database: 'school_erp_trust_demo'
        });

        console.log('✅ Connected to trust database');

        // Get the current user
        const [users] = await connection.execute(`
            SELECT id, email, full_name, role 
            FROM users 
            WHERE email = 'admin@demo.school'
        `);

        if (users.length === 0) {
            throw new Error('Demo trust user not found');
        }

        const user = users[0];
        console.log(`✅ Found user: ${user.full_name} (${user.email}) - ${user.role}`);

        // Hash the new password using bcrypt with 12 salt rounds (same as in the auth middleware)
        const newPassword = 'admin123';
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        console.log('✅ Password hashed successfully');

        // Update the user's password
        await connection.execute(`
            UPDATE users 
            SET password_hash = ?, updated_at = NOW() 
            WHERE id = ?
        `, [hashedPassword, user.id]);

        console.log('✅ Password updated successfully!');
        console.log('');
        console.log('=== UPDATED TRUST USER CREDENTIALS ===');
        console.log('Email: admin@demo.school');
        console.log('Username: admin (from email prefix)');
        console.log('Password: admin123');
        console.log('Role: SCHOOL_ADMIN');
        console.log('Database: school_erp_trust_demo');
        console.log('');
        console.log('🎉 You can now login to the trust with these credentials!');

        // Log the action
        logSystem('Trust user password updated', {
            userId: user.id,
            email: user.email,
            role: user.role,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logError(error, { context: 'update-trust-password' });
        console.error('❌ Failed to update password:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run if executed directly
if (require.main === module) {
    updateTrustUserPassword()
        .then(() => {
            console.log('\n✅ Password update completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Password update failed:', error.message);
            process.exit(1);
        });
}

module.exports = { updateTrustUserPassword };