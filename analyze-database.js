#!/usr/bin/env node

/**
 * Database Schema Inspection Tool
 * Analyzes actual database structure vs code implementation
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
    host: '140.238.167.36',
    port: 3306,
    user: 'school_erp_admin',
    password: 'Nitin@123#'
};

async function connectToDatabase() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to MySQL database');
        return connection;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return null;
    }
}

async function getDatabaseList(connection) {
    try {
        const [rows] = await connection.execute('SHOW DATABASES');
        return rows
            .map(row => row.Database)
            .filter(name => name.startsWith('school_erp_'));
    } catch (error) {
        console.error('Error getting database list:', error.message);
        return [];
    }
}

async function getTableStructure(connection, database, tableName) {
    try {
        // Get table structure
        const [columns] = await connection.execute(`
            SELECT 
                COLUMN_NAME,
                DATA_TYPE,
                IS_NULLABLE,
                COLUMN_DEFAULT,
                COLUMN_KEY,
                EXTRA,
                COLUMN_COMMENT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
            ORDER BY ORDINAL_POSITION
        `, [database, tableName]);

        // Get foreign keys
        const [foreignKeys] = await connection.execute(`
            SELECT 
                COLUMN_NAME,
                REFERENCED_TABLE_SCHEMA,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME,
                CONSTRAINT_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? 
            AND REFERENCED_TABLE_NAME IS NOT NULL
        `, [database, tableName]);

        // Get indexes
        const [indexes] = await connection.execute(`
            SELECT 
                INDEX_NAME,
                COLUMN_NAME,
                NON_UNIQUE,
                INDEX_TYPE
            FROM INFORMATION_SCHEMA.STATISTICS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
            ORDER BY INDEX_NAME, SEQ_IN_INDEX
        `, [database, tableName]);

        return {
            columns: columns,
            foreignKeys: foreignKeys,
            indexes: indexes
        };
    } catch (error) {
        console.error(`Error getting table structure for ${tableName}:`, error.message);
        return null;
    }
}

async function analyzeDatabaseSchema(connection, database) {
    try {
        console.log(`\n🔍 Analyzing database: ${database}`);
        
        // Get all tables
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME
        `, [database]);

        const schema = {
            database: database,
            tables: {}
        };

        for (const table of tables) {
            const tableName = table.TABLE_NAME;
            console.log(`  📋 Analyzing table: ${tableName} (${table.TABLE_ROWS || 0} rows)`);
            
            const structure = await getTableStructure(connection, database, tableName);
            if (structure) {
                schema.tables[tableName] = {
                    rowCount: table.TABLE_ROWS || 0,
                    dataLength: table.DATA_LENGTH || 0,
                    columns: structure.columns,
                    foreignKeys: structure.foreignKeys,
                    indexes: structure.indexes
                };
            }
        }

        return schema;
    } catch (error) {
        console.error(`Error analyzing database ${database}:`, error.message);
        return null;
    }
}

async function generateSchemaReport(schemas) {
    const report = {
        timestamp: new Date().toISOString(),
        databases: schemas,
        analysis: {
            totalTables: 0,
            totalColumns: 0,
            foreignKeyRelationships: 0,
            gaps: []
        }
    };

    // Calculate totals and identify gaps
    for (const [dbName, schema] of Object.entries(schemas)) {
        const tableCount = Object.keys(schema.tables).length;
        report.analysis.totalTables += tableCount;
        
        for (const [tableName, table] of Object.entries(schema.tables)) {
            report.analysis.totalColumns += table.columns.length;
            report.analysis.foreignKeyRelationships += table.foreignKeys.length;
        }
        
        console.log(`📊 Database ${dbName}: ${tableCount} tables`);
        
        // Check for common missing entities
        const expectedTables = [
            'users', 'schools', 'classes', 'sections', 'students', 
            'teachers', 'subjects', 'staff', 'parents', 'guardians',
            'admissions', 'academic_years', 'attendance', 'exams',
            'grades', 'results', 'fee_configurations', 'fee_transactions',
            'fee_installments', 'timetables', 'assignments', 'homework',
            'events', 'notifications', 'documents', 'custom_field_values'
        ];
        
        const existingTables = Object.keys(schema.tables);
        const missingTables = expectedTables.filter(table => !existingTables.includes(table));
        
        if (missingTables.length > 0) {
            report.analysis.gaps.push({
                database: dbName,
                type: 'missing_tables',
                items: missingTables
            });
        }
    }

    // Save report
    const reportPath = path.join(__dirname, 'database-schema-analysis.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Schema analysis saved to: ${reportPath}`);
    return report;
}

async function checkFrontendGaps(schemas) {
    console.log('\n🔍 Checking Frontend Implementation Gaps...');
    
    // Check for routes
    const routesDir = path.join(__dirname, 'routes', 'web');
    const viewsDir = path.join(__dirname, 'views', 'pages');
    const modelsDir = path.join(__dirname, 'models');
    
    const gaps = {
        missingRoutes: [],
        missingViews: [],
        missingModels: [],
        missingControllers: []
    };

    // Get existing route files
    const existingRoutes = fs.existsSync(routesDir) ? 
        fs.readdirSync(routesDir).map(f => path.basename(f, '.js')) : [];
    
    // Get existing view directories
    const existingViews = fs.existsSync(viewsDir) ? 
        fs.readdirSync(viewsDir) : [];

    // For each database, check implementation gaps
    for (const [dbName, schema] of Object.entries(schemas)) {
        console.log(`\n📋 Checking ${dbName} implementation gaps:`);
        
        for (const tableName of Object.keys(schema.tables)) {
            const entityName = tableName.replace(/s$/, ''); // Remove plural
            
            // Check routes
            if (!existingRoutes.includes(tableName) && !existingRoutes.includes(entityName)) {
                gaps.missingRoutes.push(`${dbName}.${tableName}`);
                console.log(`  ❌ Missing route: ${tableName}`);
            }
            
            // Check views
            if (!existingViews.includes(tableName) && !existingViews.includes(entityName)) {
                gaps.missingViews.push(`${dbName}.${tableName}`);
                console.log(`  ❌ Missing view: ${tableName}`);
            }
        }
    }

    return gaps;
}

async function main() {
    console.log('🚀 Starting Database Schema Analysis...');
    
    const connection = await connectToDatabase();
    if (!connection) {
        process.exit(1);
    }

    try {
        // Get all school ERP databases
        const databases = await getDatabaseList(connection);
        console.log(`Found ${databases.length} school ERP databases:`, databases);

        if (databases.length === 0) {
            console.log('❌ No school ERP databases found!');
            process.exit(1);
        }

        // Analyze each database schema
        const schemas = {};
        for (const database of databases) {
            const schema = await analyzeDatabaseSchema(connection, database);
            if (schema) {
                schemas[database] = schema;
            }
        }

        // Generate comprehensive report
        const report = await generateSchemaReport(schemas);
        
        // Check frontend implementation gaps
        const frontendGaps = await checkFrontendGaps(schemas);
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 DATABASE ANALYSIS SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Databases: ${Object.keys(schemas).length}`);
        console.log(`Total Tables: ${report.analysis.totalTables}`);
        console.log(`Total Columns: ${report.analysis.totalColumns}`);
        console.log(`Foreign Key Relationships: ${report.analysis.foreignKeyRelationships}`);
        
        if (frontendGaps.missingRoutes.length > 0) {
            console.log(`\n❌ Missing Routes: ${frontendGaps.missingRoutes.length}`);
            frontendGaps.missingRoutes.forEach(route => console.log(`   - ${route}`));
        }
        
        if (frontendGaps.missingViews.length > 0) {
            console.log(`\n❌ Missing Views: ${frontendGaps.missingViews.length}`);
            frontendGaps.missingViews.forEach(view => console.log(`   - ${view}`));
        }

        console.log('\n✅ Analysis complete!');

    } catch (error) {
        console.error('❌ Analysis failed:', error.message);
    } finally {
        await connection.end();
    }
}

// Handle script execution
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };
