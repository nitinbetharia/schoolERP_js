# 🗄️ Legacy Service Files Backup

**Date**: August 19, 2025  
**Purpose**: Backup of service files that violate Q1 (Sequelize ORM only)

## ⚠️ **WARNING - DO NOT USE THESE FILES**

These files contain **raw SQL queries** that violate our **Q1 decision**
(Sequelize ORM only).

They are kept here for **reference only** while we build **ORM-compliant
replacements**.

## 📋 **Files in this backup:**

- Services with raw SQL queries
- Routes that depend on legacy services
- Any other Q1 violating code

## 🔄 **Next Steps:**

1. Build new ORM-based services using `modules/data/database-service.js`
2. Follow Q57-Q58 patterns (async/await + try-catch)
3. Use Q59 business constants
4. Test with existing Q&A compliant models

**Safe to delete after successful ORM migration completion.**
