# School ERP - Final Architecture Specification (2025-08-18)

## 🎯 Project Status

**Status**: Requirements finalized, ready for development/refactoring  
**Architecture**: Multi-tenant School ERP with bulletproof design  
**Approach**: Sequelize ORM + CommonJS + Express + EJS + Tailwind

## 📋 Complete Tech Stack

### Core Technologies

```json
{
  "runtime": "Node.js 18+",
  "framework": "Express.js 5.1.0",
  "database": "MySQL 8.4 LTS",
  "orm": "Sequelize 6.37+",
  "templating": "EJS 3.1.10",
  "styling": "Tailwind CSS 3.x (CDN)",
  "clientJS": "Alpine.js 3.x",
  "validation": "Joi + Sequelize + custom rules",
  "authentication": "bcryptjs + express-session",
  "logging": "Winston 3.17",
  "caching": "node-cache",
  "fileUploads": "Multer + cloud storage"
}
```

### Architecture Decisions Summary

#### Database Layer

- **ORM Pattern**: `sequelize.define()` - direct, not class-based
- **Primary Keys**: UUIDs for sensitive data, integers for lookup tables
- **Timestamps**: Custom fields (`created_at`, `updated_at`, `deleted_at`)
- **Naming**: `underscored: true` (snake_case DB, camelCase JS)
- **Associations**: Inline with model definitions
- **Validation**: Joi schemas within model files
- **Connection Pool**: `{ max: 15, min: 2, acquire: 60000, idle: 300000 }`

#### Multi-Tenant Strategy

- **Master DB**: `school_erp_system` (system users, trusts, global config)
- **Tenant DBs**: `school_erp_trust_{trust_code}` (isolated per tenant)
- **Detection**: Middleware via subdomain parsing
- **Migration**: Auto-sync in development, manual in production

#### Security & Authentication

- **Passwords**: bcryptjs, salt rounds 12
- **Sessions**: express-session with MySQL store, environment-based config
- **Middleware Order**: helmet → cors → rateLimiter → auth → validation
- **Input Sanitization**: Joi transforms + Sequelize validations

#### Frontend Architecture

- **Templates**: EJS with include-based partials + component data passing
- **Styling**: Tailwind CSS via CDN (no build process)
- **Interactivity**: Alpine.js reactive components
- **Forms**: Server-side validation + client-side Alpine enhancements

#### Development Environment

- **Database**: MySQL with separate databases per tenant
  (`school_erp_trust_{trustCode}`)
- **Configuration**: JSON files per environment + .env for secrets
- **Hot Reload**: nodemon for development
- **File Uploads**: Multer local default + cloud option per tenant

## 🏗️ Model Definition Pattern

```javascript
const { DataTypes } = require('sequelize');
const Joi = require('joi');

const Student = sequelize.define(
  'Student',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    admission_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    student_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: true }
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
      defaultValue: 'ACTIVE'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Student',
    tableName: 'students',
    timestamps: false,
    underscored: true,
    paranoid: false
  }
);

// Inline associations
Student.belongsTo(Class, { foreignKey: 'class_id' });
Student.hasMany(FeePayment, { foreignKey: 'student_id' });

// Validation schemas within model
Student.validationSchema = {
  create: Joi.object({
    studentName: Joi.string().trim().max(100).required(),
    admissionNumber: Joi.string().trim().max(20).required(),
    classId: Joi.number().integer().positive().required()
  }),
  update: Joi.object({
    studentName: Joi.string().trim().max(100),
    status: Joi.string().valid('ACTIVE', 'INACTIVE')
  })
};

module.exports = Student;
```

## 🚦 Route Organization Pattern

```javascript
// routes/student-routes.js
const express = require('express');
const router = express.Router();
const studentController = require('../modules/student/student-controller');
const { requireAuth, validateInput, rateLimiter } = require('../middleware');

// API Routes
router.get(
  '/api/students',
  requireAuth,
  rateLimiter,
  studentController.listStudents
);

router.post(
  '/api/students',
  requireAuth,
  validateInput(Student.validationSchema.create),
  studentController.createStudent
);

// Web Routes
router.get('/web/students', requireAuth, studentController.renderStudentList);

router.get(
  '/web/students/create',
  requireAuth,
  studentController.renderCreateForm
);

module.exports = router;
```

## 🎨 Frontend Template Pattern

```html
<!-- views/students/list.ejs -->
<%- include('../partials/header', { title: 'Students' }) %>

<div x-data="studentManager()">
  <div class="bg-white shadow rounded-lg p-6">
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Students</h1>

    <!-- Search/Filter -->
    <div class="mb-4">
      <input
        type="text"
        x-model="search"
        placeholder="Search students..."
        class="border rounded px-4 py-2 w-full"
      />
    </div>

    <!-- Student List -->
    <div class="grid gap-4">
      <template x-for="student in filteredStudents" :key="student.id">
        <%- include('../components/student-card', { student: 'student' }) %>
      </template>
    </div>
  </div>
</div>

<script>
  function studentManager() {
    return {
      students: <%- JSON.stringify(students) %>,
      search: '',
      get filteredStudents() {
        return this.students.filter(s =>
          s.student_name.toLowerCase().includes(this.search.toLowerCase())
        );
      }
    }
  }
</script>

<%- include('../partials/footer') %>
```

## 📊 Error Handling Pattern

```javascript
// Structured error responses
const errorResponse = {
  success: false,
  error: {
    code: 'VALIDATION_FAILED',
    message: 'Invalid input provided',
    details: { field: 'email', reason: 'Invalid format' },
    timestamp: new Date().toISOString()
  }
};

// Winston logging configuration
const logger = winston.createLogger({
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5
    }),
    new winston.transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
    })
  ]
});
```

## ⚡ Performance & Caching

```javascript
// node-cache configuration
const NodeCache = require('node-cache');
const cache = new NodeCache({
  stdTTL: 600, // 10 minutes
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false
});

// Tenant-specific caching
const cacheKey = `${req.tenant.code}:students:list`;
let students = cache.get(cacheKey);
if (!students) {
  students = await Student.findAll({ where: { status: 'ACTIVE' } });
  cache.set(cacheKey, students);
}
```

## 🔧 Configuration Management

```javascript
// config/index.js
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Load environment-specific config
const env = process.env.NODE_ENV || 'development';
const configFile = path.join(__dirname, `${env}.json`);
const config = require(configFile);

// Merge with environment variables for secrets
module.exports = {
  ...config,
  database: {
    ...config.database,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST || config.database.host
  },
  session: {
    ...config.session,
    secret: process.env.SESSION_SECRET
  }
};
```

## 📁 Final Project Structure

```
school-erp/
├── config/                 # Environment configurations
│   ├── development.json    # Dev-specific settings
│   ├── production.json     # Prod-specific settings
│   └── index.js           # Config loader
├── middleware/             # Express middleware
├── modules/               # Business logic modules
│   ├── auth/              # Authentication
│   ├── student/           # Student management
│   ├── user/             # User management
│   └── data/             # Database services
├── routes/               # Express routes
├── views/               # EJS templates
│   ├── partials/        # Reusable template parts
│   └── components/      # Data-driven components
├── public/             # Static assets
├── logs/              # Application logs
├── uploads/           # File uploads (local)
├── scripts/           # Utility scripts
├── tests/            # Test files
├── .env              # Environment secrets
└── server.js         # Application entry point
```

## ✅ Next Steps

1. **Update existing models** to follow the finalized pattern
2. **Refactor routes** to use module-based organization
3. **Implement Alpine.js** components for interactivity
4. **Set up Winston logging** with daily rotation
5. **Configure Sequelize** with proper connection pooling
6. **Update authentication** to use bcryptjs with salt rounds 12
7. **Implement caching** with node-cache
8. **Create environment configs** (development.json, production.json)

---

**Architecture Status**: ✅ FINALIZED  
**Documentation**: ✅ COMPLETE  
**Ready for**: Development/Refactoring  
**Last Updated**: August 18, 2025
