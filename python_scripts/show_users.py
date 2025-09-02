#!/usr/bin/env python3
"""
Script to show all users from the School ERP system and trust databases
"""

import mysql.connector
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
        print(f"Error connecting to database {database_name}: {err}")
        return None

def get_system_users():
    """Get all users from the system database"""
    conn = connect_to_database('school_erp_system')
    if not conn:
        return []
    
    cursor = conn.cursor(dictionary=True)
    
    try:
        query = """
        SELECT 
            id,
            username,
            email,
            full_name,
            role,
            status,
            last_login_at,
            login_attempts,
            created_at,
            updated_at
        FROM system_users 
        ORDER BY id
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

def get_trust_users():
    """Get all users from the trust database"""
    conn = connect_to_database('school_erp_trust_demo')
    if not conn:
        return []
    
    cursor = conn.cursor(dictionary=True)
    
    try:
        query = """
        SELECT 
            id,
            email,
            full_name,
            role,
            status,
            created_at,
            updated_at
        FROM users 
        ORDER BY id
        """
        
        cursor.execute(query)
        users = cursor.fetchall()
        
        return users
        
    except mysql.connector.Error as err:
        print(f"Error querying trust users: {err}")
        return []
    finally:
        cursor.close()
        conn.close()

def get_trust_info():
    """Get trust information"""
    conn = connect_to_database('school_erp_system')
    if not conn:
        return {}
    
    cursor = conn.cursor(dictionary=True)
    
    try:
        query = """
        SELECT 
            id,
            trust_code,
            name,
            status,
            created_at
        FROM trusts 
        ORDER BY trust_code
        """
        
        cursor.execute(query)
        trusts = cursor.fetchall()
        
        return trusts
        
    except mysql.connector.Error as err:
        print(f"Error querying trust info: {err}")
        return []
    finally:
        cursor.close()
        conn.close()

def format_datetime(dt):
    """Format datetime for display"""
    if dt is None:
        return "Never"
    return dt.strftime("%Y-%m-%d %H:%M:%S") if dt else "Never"

def main():
    print("=== SCHOOL ERP USERS REPORT ===")
    print(f"Report generated on: {format_datetime(__import__('datetime').datetime.now())}\n")
    
    # Get trust information first
    print("TRUST INFORMATION")
    print("=" * 80)
    trusts = get_trust_info()
    if trusts:
        trust_table = []
        for trust in trusts:
            trust_table.append([
                trust['id'],
                trust['trust_code'],
                trust['name'],
                trust['status'],
                format_datetime(trust['created_at'])
            ])
        
        headers = ['ID', 'Trust Code', 'Name', 'Status', 'Created']
        print(tabulate(trust_table, headers=headers, tablefmt='grid'))
        print(f"Total Trusts: {len(trusts)}")
    else:
        print("No trust information found")
    
    print("\n\n")
    
    # Get system users
    print("SYSTEM USERS (System Administrators)")
    print("=" * 80)
    
    system_users = get_system_users()
    if system_users:
        system_table = []
        for user in system_users:
            # Mask password hash for security
            system_table.append([
                user['id'],
                user['username'],
                user['email'],
                user['full_name'] or 'N/A',
                user['role'],
                user['status'],
                format_datetime(user['last_login_at']),
                user['login_attempts'] or 0,
                format_datetime(user['created_at'])
            ])
        
        headers = ['ID', 'Username', 'Email', 'Full Name', 'Role', 'Status', 'Last Login', 'Login Attempts', 'Created']
        print(tabulate(system_table, headers=headers, tablefmt='grid'))
        print(f"Total System Users: {len(system_users)}")
        
        # Show login status
        active_users = [u for u in system_users if u['status'] == 'ACTIVE']
        recently_logged_in = [u for u in system_users if u['last_login_at'] and 
                             ((__import__('datetime').datetime.now() - u['last_login_at']).days < 7)]
        
        print(f"Active Users: {len(active_users)}")
        print(f"Recently Logged In (last 7 days): {len(recently_logged_in)}")
    else:
        print("No system users found")
    
    print("\n\n")
    
    # Get trust users  
    print("TRUST USERS (Demo Trust - demo.localhost:3000)")
    print("=" * 80)
    
    trust_users = get_trust_users()
    if trust_users:
        trust_table = []
        for user in trust_users:
            trust_table.append([
                user['id'],
                user['email'],
                user['full_name'] or 'N/A', 
                user['role'],
                user['status'],
                format_datetime(user['created_at']),
                format_datetime(user['updated_at'])
            ])
        
        headers = ['ID', 'Email', 'Full Name', 'Role', 'Status', 'Created', 'Updated']
        print(tabulate(trust_table, headers=headers, tablefmt='grid'))
        print(f"Total Trust Users: {len(trust_users)}")
        
        # Show role distribution
        role_counts = {}
        for user in trust_users:
            role = user['role']
            role_counts[role] = role_counts.get(role, 0) + 1
        
        if role_counts:
            print("\nRole Distribution:")
            for role, count in role_counts.items():
                print(f"  {role}: {count}")
    else:
        print("No trust users found")
    
    print("\n\n")
    
    # Summary
    print("SUMMARY")
    print("=" * 80)
    total_system = len(system_users) if system_users else 0
    total_trust = len(trust_users) if trust_users else 0
    
    print(f"System Database Users: {total_system}")
    print(f"Trust Database Users: {total_trust}")
    print(f"Grand Total Users: {total_system + total_trust}")
    
    if system_users:
        print(f"\nSystem User Credentials Found:")
        for user in system_users:
            print(f"  • {user['username']} ({user['email']}) - {user['role']}")
    
    if trust_users:
        print(f"\nTrust User Credentials Found:")
        for user in trust_users:
            # Extract username from email (before @)
            username = user['email'].split('@')[0] if '@' in user['email'] else user['email']
            print(f"  • {username} ({user['email']}) - {user['role']}")

if __name__ == "__main__":
    main()
