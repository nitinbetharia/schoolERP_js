# GitHub Copilot Instructions - School ERP System

## Core Development Rules

**Simple Function-Based Architecture** - No factories, no classes, just functions

### **Essential Patterns**

**✅ ALWAYS USE:**
- `const module = require('path')` - CommonJS modules  
- `function myFunction() { }` - Simple functions, not factories
- `async/await` with `try-catch` blocks
- Multi-tenant database structure (separate DBs per trust)
- Joi validation schemas in model files

**❌ NEVER USE:**
- `import/export` statements  
- ES6 classes
- Factory functions returning objects
- Custom validation in routes (reuse model schemas)

### **Controller Pattern**

```javascript
// ✅ CORRECT - Simple function exports
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

### **Service Pattern**

```javascript
// ✅ CORRECT - Simple business logic functions
const { getTenantModels } = require('../models');

async function createStudent(tenantCode, studentData) {
  const models = await getTenantModels(tenantCode);
  return await models.Student.create(studentData);
}

module.exports = { createStudent, getStudent };
```

### **Multi-Tenant Database**

```javascript
// ✅ CORRECT - Keep existing multi-tenant pattern
const models = await getTenantModels(req.tenantCode);
const student = await models.Student.create(studentData);
```

### **Validation Pattern**

```javascript
// ✅ CORRECT - Reuse model validation schemas
const { studentValidationSchemas } = require('../models/Student');
const { validators } = require('../utils/errors');

router.post('/students', 
  validators.validateBody(studentValidationSchemas.create),
  studentController.createStudent
);
```

### **Essential Features**

**PDF Generation:**
```javascript
const pdfService = require('../utils/pdfService');
const pdfPath = await pdfService.generateStudentReport(students);
res.download(pdfPath, 'students.pdf');
```

**Excel Export:**
```javascript
const excelService = require('../utils/excelService');
const excelPath = await excelService.generateStudentList(students);
res.download(excelPath, 'students.xlsx');
```

**Email Sending:**
```javascript
const emailService = require('../utils/emailService');
await emailService.sendWelcomeEmail(user.email, user.name, tempPassword);
```

## Security Requirements

- ✅ Hash passwords with bcryptjs (12 rounds)
- ✅ Validate all inputs with Joi schemas
- ✅ Use Sequelize ORM (prevents SQL injection)
- ✅ Implement proper session management

## File Structure

```
controllers/     # Simple function exports
services/        # Business logic functions
models/          # Keep current multi-tenant structure
utils/           # PDF, Excel, Email utilities
routes/          # Express routes
middleware/      # Keep current (tenant, auth)
```

**Keep it simple, keep it working** 💪