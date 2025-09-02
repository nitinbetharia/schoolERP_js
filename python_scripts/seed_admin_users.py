#!/usr/bin/env python3
"""
Script to seed admin users with consistent credentials (admin/admin123)
across system, demo, and maroon databases
"""

import mysql.connector
import bcrypt
import sys
from datetime import datetime
from tabulate import tabulate

# Database configuration
DB_CONFIG = {
    'host': '140.238.167.36',
    'port': 3306,
    'user': 'school_erp_admin',
    'password': 'Nitin@123#',
    'charset': 'utf8mb4',
    'autocommit': True
}

def connect_to_database(database_name):
    """Connect to a specific database"""
    config = DB_CONFIG.copy()
    config['database'] = database_name
    
    try:
        conn = mysql.connector.connect(**config)
        return conn
    except mysql.connector.Error as err:
        print(f"❌ Error connecting to database {database_name}: {err}")
        return None

def hash_password(password):
    """Hash password using bcrypt with 12 rounds (matching Node.js app)"""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def clear_existing_users(conn, table_name, database_name):
    """Clear all existing users from a table"""
    cursor = conn.cursor()
    try:
        cursor.execute(f"DELETE FROM {table_name}")
        affected_rows = cursor.rowcount
        print(f"🗑️  Cleared {affected_rows} existing users from {database_name}.{table_name}")
    except mysql.connector.Error as err:
        print(f"❌ Error clearing {database_name}.{table_name}: {err}")
    finally:
        cursor.close()

def seed_system_admin(conn):
    """Seed system admin user"""
    cursor = conn.cursor()
    try:
        hashed_password = hash_password('admin123')
        current_time = datetime.now()
        
        query = """
        INSERT INTO system_users (
            username, password_hash, full_name, role, status, 
            created_at, updated_at
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s
        )
        """
        
        values = (
            'admin',
            hashed_password,
            'System Administrator',
            'SYSTEM_ADMIN',
            'ACTIVE',
            current_time,
            current_time
        )
        
        cursor.execute(query, values)
        print("✅ Created system admin: admin/admin123")
        
    except mysql.connector.Error as err:
        print(f"❌ Error creating system admin: {err}")
    finally:
        cursor.close()

def seed_tenant_admin(conn, database_name, trust_name):
    """Seed tenant admin user"""
    cursor = conn.cursor()
    try:
        hashed_password = hash_password('admin123')
        current_time = datetime.now()
        
        # Check if table has username column or email column
        cursor.execute("DESCRIBE users")
        columns = [column[0] for column in cursor.fetchall()]
        
        if 'username' in columns:
            # Maroon-style table structure
            query = """
            INSERT INTO users (
                username, email, password_hash, first_name, last_name, 
                user_type, is_active, created_at, updated_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
            """
            
            values = (
                'admin',
                'admin@' + database_name.split('_')[-1] + '.school',
                hashed_password,
                'Trust',
                'Administrator',
                'ADMIN',
                1,
                current_time,
                current_time
            )
        else:
            # Demo-style table structure (email-based)
            query = """
            INSERT INTO users (
                email, password_hash, role, status, full_name, 
                created_at, updated_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s
            )
            """
            
            values = (
                'admin@' + database_name.split('_')[-1] + '.school',
                hashed_password,
                'TRUST_ADMIN',
                'ACTIVE',
                f'{trust_name} Administrator',
                current_time,
                current_time
            )
        
        cursor.execute(query, values)
        print(f"✅ Created {trust_name} admin: admin/admin123")
        
    except mysql.connector.Error as err:
        print(f"❌ Error creating {trust_name} admin: {err}")
    finally:
        cursor.close()

def verify_users():
    """Verify all created users"""
    print("\n🔍 VERIFICATION - All Created Users:")
    print("=" * 60)
    
    databases = [
        ('school_erp_system', 'system_users', 'System'),
        ('school_erp_trust_demo', 'users', 'Demo Trust'),
        ('school_erp_trust_maroon', 'users', 'Maroon Trust')
    ]
    
    for db_name, table_name, display_name in databases:
        conn = connect_to_database(db_name)
        if not conn:
            continue
            
        cursor = conn.cursor()
        try:
            if table_name == 'system_users':
                cursor.execute("SELECT username, full_name, role, status FROM system_users")
                headers = ['Username', 'Full Name', 'Role', 'Status']
            else:
                # Check table structure first
                cursor.execute("DESCRIBE users")
                columns = [column[0] for column in cursor.fetchall()]
                
                if 'username' in columns:
                    cursor.execute("SELECT username, email, first_name, last_name, user_type, is_active FROM users")
                    headers = ['Username', 'Email', 'First Name', 'Last Name', 'Type', 'Active']
                else:
                    cursor.execute("SELECT email, full_name, role, status FROM users")
                    headers = ['Email', 'Full Name', 'Role', 'Status']
            
            users = cursor.fetchall()
            
            print(f"\n📋 {display_name} ({db_name}):")
            if users:
                print(tabulate(users, headers=headers, tablefmt='grid'))
            else:
                print("   No users found")
                
        except mysql.connector.Error as err:
            print(f"❌ Error verifying {display_name}: {err}")
        finally:
            cursor.close()
            conn.close()

def main():
    """Main seeding function"""
    print("🌱 SEEDING ADMIN USERS WITH CONSISTENT CREDENTIALS")
    print("=" * 60)
    print("Creating admin/admin123 in all databases...")
    print()
    
    # 1. Seed System Admin
    print("1️⃣ Processing System Database...")
    system_conn = connect_to_database('school_erp_system')
    if system_conn:
        clear_existing_users(system_conn, 'system_users', 'school_erp_system')
        seed_system_admin(system_conn)
        system_conn.close()
    
    # 2. Seed Demo Trust Admin
    print("\n2️⃣ Processing Demo Trust Database...")
    demo_conn = connect_to_database('school_erp_trust_demo')
    if demo_conn:
        clear_existing_users(demo_conn, 'users', 'school_erp_trust_demo')
        seed_tenant_admin(demo_conn, 'school_erp_trust_demo', 'Demo Trust')
        demo_conn.close()
    
    # 3. Seed Maroon Trust Admin
    print("\n3️⃣ Processing Maroon Trust Database...")
    maroon_conn = connect_to_database('school_erp_trust_maroon')
    if maroon_conn:
        clear_existing_users(maroon_conn, 'users', 'school_erp_trust_maroon')
        seed_tenant_admin(maroon_conn, 'school_erp_trust_maroon', 'Maroon Trust')
        maroon_conn.close()
    
    # 4. Verify all users
    verify_users()
    
    print("\n" + "=" * 60)
    print("🎉 SEEDING COMPLETE!")
    print("\n📝 LOGIN CREDENTIALS:")
    print("   System Admin (localhost:3000): admin / admin123")
    print("   Demo Trust (demo.localhost:3000): admin@demo.school / admin123")
    print("   Maroon Trust (maroon.localhost:3000): admin@maroon.school / admin123")
    print("\n🔐 All passwords are properly hashed with bcrypt (12 rounds)")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️ Seeding interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        sys.exit(1)
