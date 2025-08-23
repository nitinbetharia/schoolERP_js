#!/usr/bin/env python3
"""
Script to explore the database structure and find user tables
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

def show_tables(database_name):
    """Show all tables in a database"""
    conn = connect_to_database(database_name)
    if not conn:
        return []
    
    cursor = conn.cursor()
    
    try:
        cursor.execute("SHOW TABLES")
        tables = [row[0] for row in cursor.fetchall()]
        return tables
        
    except mysql.connector.Error as err:
        print(f"Error getting tables from {database_name}: {err}")
        return []
    finally:
        cursor.close()
        conn.close()

def describe_table(database_name, table_name):
    """Describe the structure of a table"""
    conn = connect_to_database(database_name)
    if not conn:
        return []
    
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute(f"DESCRIBE {table_name}")
        columns = cursor.fetchall()
        return columns
        
    except mysql.connector.Error as err:
        print(f"Error describing table {table_name} in {database_name}: {err}")
        return []
    finally:
        cursor.close()
        conn.close()

def get_table_data(database_name, table_name, limit=10):
    """Get sample data from a table"""
    conn = connect_to_database(database_name)
    if not conn:
        return []
    
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute(f"SELECT * FROM {table_name} LIMIT {limit}")
        data = cursor.fetchall()
        return data
        
    except mysql.connector.Error as err:
        print(f"Error getting data from {table_name} in {database_name}: {err}")
        return []
    finally:
        cursor.close()
        conn.close()

def main():
    print("=== Database Structure Exploration ===\n")
    
    # Check system database
    print("1. SYSTEM DATABASE (school_erp_system)")
    print("=" * 60)
    
    system_tables = show_tables('school_erp_system')
    if system_tables:
        print("Tables found:")
        for i, table in enumerate(system_tables, 1):
            print(f"  {i}. {table}")
        
        # Look for user-related tables
        user_tables = [t for t in system_tables if 'user' in t.lower() or 'admin' in t.lower()]
        if user_tables:
            print(f"\nUser-related tables: {', '.join(user_tables)}")
            
            for table in user_tables[:3]:  # Limit to first 3 tables
                print(f"\n--- Structure of {table} ---")
                columns = describe_table('school_erp_system', table)
                if columns:
                    table_data = [[col['Field'], col['Type'], col['Null'], col['Key'], col['Default']] 
                                  for col in columns]
                    headers = ['Field', 'Type', 'Null', 'Key', 'Default']
                    print(tabulate(table_data, headers=headers, tablefmt='grid'))
                
                print(f"\n--- Sample data from {table} ---")
                data = get_table_data('school_erp_system', table, 5)
                if data:
                    print(tabulate(data, headers='keys', tablefmt='grid'))
                else:
                    print("No data found")
    else:
        print("No tables found or error accessing database.")
    
    print("\n\n")
    
    # Check trust database
    print("2. TRUST DATABASE (school_erp_trust_demo)")
    print("=" * 60)
    
    trust_tables = show_tables('school_erp_trust_demo')
    if trust_tables:
        print("Tables found:")
        for i, table in enumerate(trust_tables, 1):
            print(f"  {i}. {table}")
        
        # Look for user-related tables
        user_tables = [t for t in trust_tables if 'user' in t.lower() or 'admin' in t.lower()]
        if user_tables:
            print(f"\nUser-related tables: {', '.join(user_tables)}")
            
            for table in user_tables[:3]:  # Limit to first 3 tables
                print(f"\n--- Structure of {table} ---")
                columns = describe_table('school_erp_trust_demo', table)
                if columns:
                    table_data = [[col['Field'], col['Type'], col['Null'], col['Key'], col['Default']] 
                                  for col in columns]
                    headers = ['Field', 'Type', 'Null', 'Key', 'Default']
                    print(tabulate(table_data, headers=headers, tablefmt='grid'))
                
                print(f"\n--- Sample data from {table} ---")
                data = get_table_data('school_erp_trust_demo', table, 5)
                if data:
                    print(tabulate(data, headers='keys', tablefmt='grid'))
                else:
                    print("No data found")
        else:
            print("No user-related tables found. All tables:")
            # Show first few tables with sample data
            for table in trust_tables[:5]:
                print(f"\n--- {table} ---")
                data = get_table_data('school_erp_trust_demo', table, 3)
                if data:
                    print(tabulate(data, headers='keys', tablefmt='grid'))
                else:
                    print("No data found")
    else:
        print("No tables found or error accessing database.")

if __name__ == "__main__":
    main()
