# CRITICAL INSTRUCTION: MySQL Shell Usage

## 🚨 **MANDATORY CHANGE - USE MYSQLSH INSTEAD OF MYSQL**

**Date**: August 18, 2025  
**Priority**: CRITICAL  
**Affects**: All database scripts and documentation

---

## 📋 **REQUIRED CHANGES**

### **❌ OLD COMMAND (Do not use):**

```bash
mysql -h host -u user -p database
```

### **✅ NEW COMMAND (Always use):**

```bash
mysqlsh --uri=mysql://user:password@host:port/database

# Or with individual parameters:
mysqlsh --host=host --port=port --user=user --password
```

---

## 🔧 **AFFECTED FILES THAT NEED UPDATING**

### **Scripts to Update:**

- `scripts/setup-system-database.js` ❌ CRITICAL
- `scripts/setup-multi-tenant.js` ❌ CRITICAL
- `scripts/create-tenant.js` ❌ CRITICAL
- `scripts/backup-tenant.js` ❌ CRITICAL
- `scripts/migrate-system-database.js` ❌ CRITICAL
- All other database setup scripts

### **Documentation to Update:**

- `docs/setup/DATABASE_SETUP_GUIDE.md` ✅ PARTIALLY UPDATED
- `docs/developer/TROUBLESHOOTING.md`
- Any README files with database commands

---

## 💻 **INSTALLATION INSTRUCTIONS**

### **MySQL Shell Installation:**

**Windows:**

```bash
# MySQL Shell is included with MySQL 8.0+
# If not installed, download from MySQL official website
# https://dev.mysql.com/downloads/shell/
```

**Linux/macOS:**

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install mysql-shell

# CentOS/RHEL
sudo yum install mysql-shell

# macOS with Homebrew
brew install mysql-shell
```

---

## 🔍 **VERIFICATION**

### **Test MySQL Shell Installation:**

```bash
# Check if mysqlsh is available
mysqlsh --version

# Expected output: MySQL Shell 8.x.x
```

### **Test Connection:**

```bash
# Test connection to our database
mysqlsh --uri=mysql://username:password@140.238.167.36:3306

# Should connect successfully without errors
```

---

## 📝 **SCRIPT UPDATE PATTERN**

### **Before (mysql command):**

```bash
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DATABASE < script.sql
```

### **After (mysqlsh command):**

```bash
mysqlsh --uri=mysql://$DB_USER:$DB_PASSWORD@$DB_HOST:3306/$DATABASE --file=script.sql
```

### **JavaScript Execution Pattern:**

```javascript
// Instead of spawning mysql process
const mysql = spawn('mysql', [
  '-h',
  host,
  '-u',
  user,
  '-p' + password,
  database
]);

// Use mysqlsh with proper parameters
const mysqlsh = spawn('mysqlsh', [
  `--uri=mysql://${user}:${password}@${host}:${port}/${database}`,
  '--file=' + sqlFile
]);
```

---

## ⚠️ **IMMEDIATE ACTION REQUIRED**

Before continuing development on ANY machine:

1. **✅ Verify mysqlsh is installed**
2. **❌ Update all affected scripts**
3. **❌ Test all database operations**
4. **❌ Update remaining documentation**

**Status**: 🟡 PARTIALLY COMPLETE - Documentation updated, scripts need fixing

---

**REMEMBER**: This change is critical for cross-platform compatibility and
future development!
