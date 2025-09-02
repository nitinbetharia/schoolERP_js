# Developer Guide - School ERP

Simple guidelines for maintaining and extending the School ERP system.

## Core Principles

1. **Simple Functions** - No factories, no classes, just functions
2. **Multi-tenant DB** - Separate databases per trust (working pattern)
3. **DRY Code** - Reusable utilities for common tasks
4. **Security First** - Validate everything, hash passwords, prevent injection

## Essential Patterns

### **1. Controllers (Simple Functions)**

```javascript
// controllers/studentController.js
const studentService = require('../services/studentService');

async function createStudent(req, res) {
  try {
    const student = await studentService.createStudent(req.tenantCode, req.body);
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
}

module.exports = { createStudent, getStudent, updateStudent };
```

### **2. Services (Business Logic)**

```javascript
// services/studentService.js
const { getTenantModels } = require('../models');

async function createStudent(tenantCode, studentData) {
  const models = await getTenantModels(tenantCode);
  return await models.Student.create(studentData);
}

module.exports = { createStudent, getStudent, updateStudent };
```

### **3. Models (Keep Current Pattern)**

```javascript
// models/Student.js - Keep existing pattern
const { DataTypes } = require('sequelize');
const Joi = require('joi');

function defineStudent(sequelize) {
  const Student = sequelize.define('Student', { /* fields */ });
  return Student;
}

const studentValidationSchemas = {
  create: Joi.object({ /* validation */ })
};

module.exports = { defineStudent, studentValidationSchemas };
```

### **4. Routes with Features**

```javascript
// routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const pdfService = require('../utils/pdfService');

router.get('/', studentController.getStudents);
router.post('/', studentController.createStudent);

// PDF Export
router.get('/export/pdf', async (req, res) => {
  const students = await studentController.getStudentsData(req.tenantCode);
  const pdfPath = await pdfService.generateStudentReport(students);
  res.download(pdfPath, 'students.pdf');
});
```

## Key Technologies

### **Backend Stack**
- **Express.js** - Web framework
- **Sequelize** - Database ORM  
- **Joi** - Input validation
- **bcryptjs** - Password hashing
- **MySQL** - Database

### **Essential Features**
- **PDFKit** - PDF generation
- **ExcelJS** - Excel exports
- **Nodemailer** - Email sending

## File Organization

```
controllers/     # HTTP request handlers (simple functions)
services/        # Business logic (reusable functions)  
models/          # Database models (keep current multi-tenant)
utils/           # Utilities (PDF, Excel, Email)
routes/          # Express routes
middleware/      # Keep current (tenant, auth, error)
views/           # EJS templates
```

## Common Tasks

### **Add New Feature**
1. Create service function
2. Create controller function
3. Add route
4. Add validation schema
5. Test multi-tenant functionality

### **Add Export Feature**
1. Create utility function in `/utils`
2. Add route endpoint  
3. Test with sample data

### **Add Email Feature**
1. Use `emailService.js` template functions
2. Create specific email function
3. Add route endpoint

## Security Checklist

- ✅ Validate all inputs with Joi schemas
- ✅ Hash passwords with bcryptjs
- ✅ Use Sequelize (prevents SQL injection)
- ✅ Validate tenant access in middleware
- ✅ Sanitize file paths for exports
- ✅ Use HTTPS in production

## Testing Strategy

```bash
# Test multi-tenant functionality
npm run test:tenants

# Test specific feature
npm run test -- --grep "student"

# Test exports
npm run test:exports
```

## Troubleshooting

### **Database Issues**
- Check tenant detection middleware
- Verify database connections
- Check model initialization

### **Export Issues**  
- Verify file permissions
- Check temporary file cleanup
- Test with small datasets first

### **Email Issues**
- Check SMTP credentials
- Test with simple text emails first
- Verify email templates

---

**Keep it simple, keep it working** 💪