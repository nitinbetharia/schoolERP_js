# School ERP - Simple & Maintainable

A straightforward school management system built for reliability and ease of maintenance.

## Quick Start

### Prerequisites

- Node.js 18+
- MySQL 8.0+

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 3. Setup database
npm run setup

# 4. Start development server
npm run dev

# 5. Open browser
http://localhost:3000
```

## Tech Stack

**Backend:**

- Node.js + Express.js
- MySQL + Sequelize ORM
- Joi validation
- bcryptjs authentication
- Sessions with MySQL store

**Frontend:**

- EJS templates
- Bootstrap 5 CSS
- Vanilla JavaScript

**Features:**

- Multi-tenant architecture (separate databases)
- PDF generation (reports, receipts)
- Excel exports (student lists, fee reports)
- Email system (welcome, reminders, receipts)
- Secure authentication & validation

## Project Structure

```
schoolERP_js/
├── server.js              # Main application entry
├── controllers/           # Request handlers
├── services/             # Business logic
├── models/               # Database models (multi-tenant)
├── routes/               # Express routes
├── utils/                # Utilities (PDF, Excel, Email)
├── middleware/           # Authentication, tenant detection
├── views/                # EJS templates
└── public/               # Static files
```

## Development Commands

```bash
npm run dev          # Start development server
npm run setup        # Initialize database
npm test             # Run tests
npm run lint         # Code linting
```

## Core Concepts

### Multi-Tenant Architecture

- **System Database**: `school_erp_system` (trusts, system users)
- **Tenant Databases**: `school_erp_trust_{code}` (school data per trust)

### Authentication

- **System Admin**: admin@system.local / admin123
- **Trust Admin**: admin@demo.school / password123

### Key Features

- Student management with UDISE+ compliance
- Fee collection with PDF receipts
- Attendance tracking
- Excel exports for reporting
- Email notifications and reminders

## API Endpoints

```
# Students
GET    /api/v1/students           # List students
POST   /api/v1/students           # Create student
GET    /api/v1/students/:id       # Get student details
PUT    /api/v1/students/:id       # Update student

# Exports
GET    /api/v1/students/export/pdf    # PDF report
GET    /api/v1/students/export/excel  # Excel export
POST   /api/v1/students/:id/email     # Send email

# Fees
GET    /api/v1/fees               # Fee structures
POST   /api/v1/fees/collect       # Collect payment
GET    /api/v1/fees/receipt/:id   # Generate receipt PDF
```

## Environment Variables

```bash
# Database
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password

# Application
SESSION_SECRET=your_session_secret
NODE_ENV=development

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

## Security Features

- Password hashing with bcryptjs
- Input validation with Joi schemas
- SQL injection prevention (Sequelize ORM)
- XSS protection
- CSRF protection
- Secure session management

## Getting Help

For development questions:

1. Check this README
2. Review code comments
3. Check `/docs/DEVELOPER_GUIDE.md`
4. See `/docs/FILE_SIZE_STANDARDS.md` for code organization guidelines

## Code Quality Standards

This project follows industry-standard file size guidelines:

- **Optimal Range**: 150-300 lines per file for maximum maintainability
- **Maximum Acceptable**: 400 lines per file
- **Critical Threshold**: 500+ lines require immediate refactoring

For detailed guidelines, see [File Size Standards](docs/FILE_SIZE_STANDARDS.md).

---

**Built for maintainability and reliability** 🚀
