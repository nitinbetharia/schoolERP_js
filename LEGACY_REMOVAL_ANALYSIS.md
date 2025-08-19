# 🗂️ **LEGACY CODE REMOVAL ANALYSIS**

**Date**: August 19, 2025  
**Purpose**: Identify Q1 violating files (raw SQL) for removal/refactoring

## 📊 **FILES BY CATEGORY**

### ✅ **KEEP (Q&A Compliant)**

- `modules/data/database-service.js` - **CORE INFRASTRUCTURE** (✅ Proper ORM
  integration)
- `modules/auth/rbac-service.js` - **RECENTLY FIXED** (✅ Q59 compliant)
- `modules/data/migration-service.js` - **INFRASTRUCTURE** (migration framework)

### ❌ **REMOVE/REFACTOR (Q1 Violations - Raw SQL)**

#### **High Priority - Raw SQL Services**

- `modules/user/user-service.js` - Multiple raw SQL queries
- `modules/student/student-service.js` - Multiple raw SQL queries
- `modules/fees/fees-service.js` - Raw SQL queries
- `modules/dashboard/dashboard-service.js` - Raw SQL queries
- `modules/communication/communication-service.js` - Raw SQL queries
- `modules/attendance/attendance-service.js` - Raw SQL queries
- `modules/reports/reports-service.js` - Raw SQL queries
- `modules/reports/enhanced-reports-service.js` - Direct mysql2 usage
- `modules/setup/setup-service.js` - Raw SQL queries
- `modules/fees/payment-gateway-service.js` - Raw SQL queries
- `modules/dashboard/system-dashboard-service.js` - Raw SQL queries
- `modules/auth/auth-service.js` - Raw SQL queries

### 🔄 **REFACTOR CANDIDATES**

- All route files that depend on legacy services
- Controllers that use raw SQL services

## 📋 **REMOVAL STRATEGY**

1. **Move to legacy folder** (for reference)
2. **Create ORM-based replacements** following database-service.js pattern
3. **Update routes/controllers** to use new services
4. **Test with existing models**

## ✅ **IMMEDIATE ACTION PLAN**

### **✅ PHASE 1 COMPLETE - Legacy Cleanup**

1. ✅ Move legacy services to backup (12 files)
2. ✅ Document broken routes (BROKEN_ROUTES_LIST.md)
3. ✅ Move Q1-violating scripts to backup (8 files)
4. ✅ Legacy folder created and organized

### **🟡 PHASE 2 STARTING - Core Foundation**

1. **Fix System Database Issue** (Q&A violation - empty system DB)
2. **Complete Core Models** (5/9 done per session summary)
3. **Add Model Associations** (Q13 implementation)
4. **Fix Any Remaining Q59 Violations** (286 violations mentioned in session
   summary)
