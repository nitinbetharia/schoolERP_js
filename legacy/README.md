# 🗄️ Legacy Files Directory

## ⚠️ **IMPORTANT - DO NOT USE THESE FILES**

This directory contains **deprecated/legacy files** that have been **REPLACED**
during the refactoring process to comply with the **Single Source of Truth**
technical decisions.

## 📋 **Rules:**

1. ✅ **Files here are for REFERENCE ONLY** - Do not use in production
2. ❌ **DO NOT import/require** any files from this directory
3. 📚 **Keep for emergency reference** - In case anything breaks during
   refactoring
4. 🗑️ **Safe to delete** after successful refactoring completion
5. 🔄 **Files moved here** were replaced by compliant implementations

## 📂 **Directory Structure:**

```text
legacy/
├── README.md (this file)
├── config/           # Old configuration files
├── models/           # Old model implementations
├── services/         # Old service implementations
├── scripts/          # Old script implementations
└── utils/            # Old utility implementations
```

## 📋 **Legacy File Log:**

| Date       | File Moved                         | Reason                           | Replaced By                         | Q&A Violation                                         |
| ---------- | ---------------------------------- | -------------------------------- | ----------------------------------- | ----------------------------------------------------- |
| 2025-08-18 | `models/tenant/Class.js`           | Class-based model + wrong schema | `models/Class.js`                   | Q12: Must use sequelize.define() + Q14: Wrong PK type |
| 2025-08-18 | `config/app-config.js`             | JS config file usage             | `config/app-config.json`            | Q29: JSON config files + .env for secrets only        |
| 2025-08-18 | `config\database.js`               | Raw MySQL usage                  | `config/sequelize.js`               | Q1: Must use Sequelize ORM                            |
| 2025-08-18 | `config/database.js`               | Raw MySQL usage                  | `config/sequelize.js`               | Q1: Must use Sequelize ORM                            |
| 2025-08-18 | `modules/data/database-service.js` | Raw MySQL                        | `modules/data/sequelize-service.js` | Q1: Must use Sequelize ORM                            |

## 🔧 **Refactoring Process:**

When a file is moved to legacy:

1. **Original file** → Moved to `legacy/` with same directory structure
2. **New compliant file** → Created in original location
3. **README updated** → Log entry added above
4. **All imports updated** → Point to new implementation

## 🚨 **If Something Breaks:**

1. **Check git history** for recent changes
2. **Compare legacy file** with new implementation
3. **Identify missing functionality** and add to new file
4. **DO NOT revert** to legacy files - fix the new implementation

## ✅ **After Successful Refactoring:**

- [ ] All tests pass
- [ ] All functionality works
- [ ] No imports from legacy directory
- [ ] Safe to delete this entire directory

---

**Generated:** August 18, 2025  
**Purpose:** School ERP Refactoring - Single Source of Truth Compliance  
**Status:** Active Refactoring Process
