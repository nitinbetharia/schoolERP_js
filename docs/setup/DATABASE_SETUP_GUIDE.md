# Database Management Guide

This guide covers the comprehensive database management system for the School
ERP application.

## Overview

The School ERP system uses a **multi-tenant architecture** with two main
database types:

- **Master Database**: Manages system-wide data (trusts, system users,
  configuration)
- **Trust Databases**: Individual databases for each school trust/organization

## Quick Start

### 1. Initial Setup

```bash
# Install dependencies
npm install

# Set up databases with seed data
npm run first-setup
```

### 2. Default Login Credentials

After setup, you can login with:

- **Email**: `nitin@gmail.com`
- **Password**: `nitin@123`

## Available Scripts

### Setup Scripts

```bash
# Complete initial setup (recommended for first time)
npm run first-setup

# Setup database only
npm run setup

# Create database structure only (no seed data)
npm run db:migrate

# Insert seed data only (assumes tables exist)
npm run db:seed

# Check database status and structure
npm run db:status
```

### Reset Scripts

```bash
# Full database reset (drops everything and recreates)
npm run reset-db:full

# Reset table structure only (keeps databases)
npm run reset-db:structure

# Reset data only (keeps table structure)
npm run reset-db:data

# Force reset without confirmation (USE WITH CAUTION!)
npm run reset-db:force
```

### Backup Scripts

```bash
# Create full backup (all databases and data)
npm run backup:full

# Create schema-only backup (structure without data)
npm run backup:schema

# Clean old backup files (older than 30 days)
npm run backup:clean
```

## Database Schema

### Master Database Tables

#### Core System Tables

- `system_users` - System administrators and super users
- `trusts` - School trusts/organizations
- `system_config` - Global system configuration
- `system_audit_logs` - System-level audit trail

#### Enhanced Configuration Tables

- `custom_field_definitions` - Custom field configurations
- `custom_field_values` - Custom field data
- `form_configurations` - Dynamic form builders
- `payment_gateways` - Payment gateway configurations
- `payment_method_configs` - Payment method settings

#### Communication System

- `notification_templates` - Email/SMS templates
- `notifications_queue` - Notification delivery queue
- `sms_configurations` - SMS provider settings
- `email_configurations` - Email provider settings

#### Reporting & Backup

- `report_templates` - Report generation templates
- `generated_reports` - Generated report history
- `backup_configurations` - Backup schedule settings
- `backup_history` - Backup execution logs

### Trust Database Tables

#### Core Academic Tables

- `users` - Trust-level users (admins, teachers, parents)
- `students` - Student records
- `classes` - Class and section management
- `academic_years` - Academic year configuration
- `schools` - School information within trust

#### Fee Management

- `fee_structures` - Fee structure definitions
- `fee_receipts` - Fee payment receipts
- `fee_categories` - Fee category management
- `payment_transactions` - Payment transaction logs

#### Attendance & Communication

- `attendance_records` - Student attendance data
- `communication_logs` - Trust-level communications
- `communication_recipients` - Communication delivery tracking
- `trust_config` - Trust-specific configuration

#### Audit & Security

- `trust_audit_logs` - Trust-level audit trail
- `user_sessions` - User session management

## Environment Configuration

Ensure your `.env` file contains:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_MASTER_NAME=school_erp_master

# Optional: Custom trust database name
# DB_TRUST_DEFAULT=school_erp_trust_default
```

## Advanced Usage

### Manual Database Operations

#### Creating Additional Trust Databases

```javascript
const DatabaseSetup = require('./scripts/setup-database');
const setup = new DatabaseSetup();

// Create new trust database
await setup.createTrustDatabase('school_erp_trust_newschool', trustId);
```

#### Custom Backup Operations

```bash
# Backup specific database only
node scripts/backup-database.js full

# Schema backup for migration purposes
node scripts/backup-database.js schema

# Clean backups older than 60 days
node scripts/backup-database.js clean 60
```

#### Database Reset with Options

```bash
# Reset specific components
node scripts/reset-database.js full      # Complete reset
node scripts/reset-database.js structure # Table structure only
node scripts/reset-database.js data     # Data only

# Force reset (no confirmation)
node scripts/reset-database.js full --force
```

## Backup Management

### Automatic Backups

- Backups are stored in `./backups/` directory
- Files are compressed using ZIP format
- Checksums are calculated for integrity verification
- Backup history is logged to the master database

### Backup Types

1. **Full Backup**: Complete database dump with all data
2. **Schema Backup**: Table structures only (for migration)
3. **Incremental Backup**: Changes since last backup (planned feature)

### Backup Retention

- Default retention: 30 days
- Configurable via backup scripts
- Automatic cleanup of old backups

## Security Features

### Database Security

- Foreign key constraints for data integrity
- CHECK constraints for data validation
- Indexed columns for performance
- UTF8MB4 character set for full Unicode support

### Authentication Security

- bcryptjs password hashing with salt
- Session management with expiration
- Login attempt tracking and account locking
- Role-based access control (RBAC)

### Audit Trail

- System-level and trust-level audit logs
- User action tracking
- IP address and user agent logging
- Comprehensive change tracking

## Performance Optimization

### Database Indexing

- Primary keys on all tables
- Foreign key indexes
- Custom indexes on frequently queried columns
- Composite indexes for complex queries

### Connection Management

- Connection pooling ready
- Prepared statements for security
- Multiple database connection support
- Efficient connection reuse

## Troubleshooting

### Common Issues

#### Connection Errors

```bash
# Verify database connection using MySQL Shell
mysqlsh --uri=mysql://username:password@host:port

# Check if MySQL service is running
# Windows: services.msc -> MySQL80
# Linux: systemctl status mysql
```

#### Permission Issues

```sql
-- Grant required permissions
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

#### Schema Sync Issues

```bash
# Reset and recreate everything
npm run reset-db:force

# Check current schema
npm run db:status
```

### Error Recovery

#### Corrupted Database

```bash
# Create backup if possible
npm run backup:full

# Reset from schema
npm run reset-db:structure
npm run db:seed
```

#### Missing Tables

```bash
# Recreate schema only
npm run db:migrate
```

#### Data Corruption

```bash
# Restore from backup
# Manual restore process:
# 1. Extract backup ZIP file
# 2. Import SQL files using mysqlsh command
# 3. Verify data integrity
```

## Migration Guide

### Upgrading Database Schema

1. Create backup before migration
2. Update database-schema.sql file
3. Run migration script
4. Verify schema changes
5. Test application functionality

### Adding New Features

1. Update schema file with new tables
2. Add seed data for new features
3. Update service files to use new tables
4. Test thoroughly before production

## Production Considerations

### Performance Monitoring

- Monitor query performance
- Track database size growth
- Set up backup alerts
- Monitor disk space usage

### Scaling Considerations

- Database partitioning for large datasets
- Read replicas for query performance
- Connection pooling optimization
- Index optimization

### Backup Strategy

- Multiple backup locations
- Regular backup testing
- Disaster recovery procedures
- Point-in-time recovery capabilities

## Support and Maintenance

### Regular Maintenance Tasks

- Weekly backup verification
- Monthly performance review
- Quarterly security audit
- Annual disaster recovery testing

### Monitoring Checklist

- [ ] Database connection health
- [ ] Backup completion status
- [ ] Disk space availability
- [ ] Query performance metrics
- [ ] Error log review

## Additional Resources

- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Node.js MySQL2 Documentation](https://www.npmjs.com/package/mysql2)
- [Database Design Best Practices](https://dev.mysql.com/doc/refman/8.0/en/optimization.html)

---

**Note**: Always test database operations in a development environment before
applying to production.
