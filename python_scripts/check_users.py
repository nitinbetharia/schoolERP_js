#!/usr/bin/env python3
"""
Script to check users in the School ERP system and trust databases
"""

import mysql.connector
from tabulate import tabulate
import sys

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
        print(f"Error connecting to database {database_name}: {err}")
        return None

def get_system_users():
    """Get all users from the system database"""
    conn = connect_to_database('school_erp_system')
    if not conn:
        return []
    
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Check if SystemUsers table exists
        cursor.execute("SHOW TABLES LIKE 'SystemUsers'")
        if not cursor.fetchone():
            print("SystemUsers table not found in system database")
            return []
        
        # Get all system users
        query = """
        SELECT 
            id,
            username,
            email,
            role,
            first_name,
            last_name,
            is_active,
            created_at,
            last_login
        FROM SystemUsers 
        ORDER BY role, username
        """
        
        cursor.execute(query)
        users = cursor.fetchall()
        
        return users
        
    except mysql.connector.Error as err:
        print(f"Error querying system users: {err}")
        return []
    finally:
        cursor.close()
        conn.close()

def get_trust_databases():
    """Get list of all trust databases"""
    conn = connect_to_database('information_schema')
    if not conn:
        return []
    
    cursor = conn.cursor()
    
    try:
        query = """
        SELECT SCHEMA_NAME 
        FROM INFORMATION_SCHEMA.SCHEMATA 
        WHERE SCHEMA_NAME LIKE 'school_erp_trust_%'
        ORDER BY SCHEMA_NAME
        """
        
        cursor.execute(query)
        databases = [row[0] for row in cursor.fetchall()]
        
        return databases
        
    except mysql.connector.Error as err:
        print(f"Error getting trust databases: {err}")
        return []
    finally:
        cursor.close()
        conn.close()

def get_trust_users(database_name):
    """Get all users from a specific trust database"""
    conn = connect_to_database(database_name)
    if not conn:
        return []
    
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Check if Users table exists
        cursor.execute("SHOW TABLES LIKE 'Users'")
        if not cursor.fetchone():
            return []
        
        # Get all trust users
        query = """
        SELECT 
            id,
            username,
            email,
            role,
            first_name,
            last_name,
            is_active,
            created_at,
            last_login
        FROM Users 
        ORDER BY role, username
        """
        
        cursor.execute(query)
        users = cursor.fetchall()
        
        # Add database name to each user record
        for user in users:
            user['database'] = database_name
            trust_code = database_name.replace('school_erp_trust_', '')
            user['trust_code'] = trust_code
        
        return users
        
    except mysql.connector.Error as err:
        print(f"Error querying users from {database_name}: {err}")
        return []
    finally:
        cursor.close()
        conn.close()

def get_trust_info():
    """Get trust information from system database"""
    conn = connect_to_database('school_erp_system')
    if not conn:
        return {}
    
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Check if Trusts table exists
        cursor.execute("SHOW TABLES LIKE 'Trusts'")
        if not cursor.fetchone():
            return {}
        
        query = """
        SELECT 
            trust_code,
            name,
            is_active,
            created_at
        FROM Trusts 
        ORDER BY trust_code
        """
        
        cursor.execute(query)
        trusts = cursor.fetchall()
        
        # Convert to dictionary for easy lookup
        trust_dict = {trust['trust_code']: trust for trust in trusts}
        
        return trust_dict
        
    except mysql.connector.Error as err:
        print(f"Error querying trust info: {err}")
        return {}
    finally:
        cursor.close()
        conn.close()

def format_datetime(dt):
    """Format datetime for display"""
    if dt is None:
        return "Never"
    return dt.strftime("%Y-%m-%d %H:%M:%S") if dt else "Never"

def main():
    print("=== School ERP Database Users Report ===\n")
    
    # Get system users
    print("1. SYSTEM DATABASE USERS")
    print("=" * 50)
    
    system_users = get_system_users()
    if system_users:
        table_data = []
        for user in system_users:
            table_data.append([
                user['id'],
                user['username'],
                user['email'] or 'N/A',
                user['role'],
                f"{user['first_name'] or ''} {user['last_name'] or ''}".strip() or 'N/A',
                'Active' if user['is_active'] else 'Inactive',
                format_datetime(user['created_at']),
                format_datetime(user['last_login'])
            ])
        
        headers = ['ID', 'Username', 'Email', 'Role', 'Full Name', 'Status', 'Created', 'Last Login']
        print(tabulate(table_data, headers=headers, tablefmt='grid'))
        print(f"\nTotal System Users: {len(system_users)}")
    else:
        print("No system users found or error accessing database.")
    
    print("\n")
    
    # Get trust information
    trust_info = get_trust_info()
    
    # Get trust databases and users
    print("2. TRUST DATABASE USERS")
    print("=" * 50)
    
    trust_databases = get_trust_databases()
    if trust_databases:
        all_trust_users = []
        
        for db_name in trust_databases:
            trust_code = db_name.replace('school_erp_trust_', '')
            trust_name = trust_info.get(trust_code, {}).get('name', f'Trust {trust_code}')
            
            print(f"\n--- {trust_name} (Database: {db_name}) ---")
            
            trust_users = get_trust_users(db_name)
            if trust_users:
                table_data = []
                for user in trust_users:
                    table_data.append([
                        user['id'],
                        user['username'],
                        user['email'] or 'N/A',
                        user['role'],
                        f"{user['first_name'] or ''} {user['last_name'] or ''}".strip() or 'N/A',
                        'Active' if user['is_active'] else 'Inactive',
                        format_datetime(user['created_at']),
                        format_datetime(user['last_login'])
                    ])
                
                headers = ['ID', 'Username', 'Email', 'Role', 'Full Name', 'Status', 'Created', 'Last Login']
                print(tabulate(table_data, headers=headers, tablefmt='grid'))
                print(f"Users in {trust_name}: {len(trust_users)}")
                
                all_trust_users.extend(trust_users)
            else:
                print("No users found in this trust database.")
        
        if all_trust_users:
            print(f"\nTotal Trust Users across all databases: {len(all_trust_users)}")
        
    else:
        print("No trust databases found.")
    
    # Summary
    print("\n")
    print("3. SUMMARY")
    print("=" * 50)
    print(f"System Users: {len(system_users) if system_users else 0}")
    print(f"Trust Databases: {len(trust_databases)}")
    print(f"Total Trust Users: {len(all_trust_users) if 'all_trust_users' in locals() else 0}")
    print(f"Grand Total Users: {(len(system_users) if system_users else 0) + (len(all_trust_users) if 'all_trust_users' in locals() else 0)}")

if __name__ == "__main__":
    main()
