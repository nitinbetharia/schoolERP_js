# School ERP - Requirements & Decisions Log

## Latest Decisions & Updates

### Core Architecture Decisions (2025-08-16)
1. ✅ **Tech Stack**: Node.js + CommonJS (no TypeScript compilation issues)
2. ✅ **Database**: Two-database structure (master + per-trust databases)
3. ✅ **Authentication**: Unified login with subdomain logic
4. ✅ **RBAC**: Simple JSON config-driven role-based access control
5. ✅ **Validation**: Multi-layer bulletproof validation (Joi + custom)
6. ✅ **Dependencies**: Latest stable versions for long-term support
7. ✅ **Error Handling**: Comprehensive with graceful degradation
8. ✅ **Setup Module**: Wizard engine for initial configuration

### Unified Login Logic (Subdomain-Based)
```
admin.domain.com     → System Admin Login (master database)
system.domain.com    → System Admin Login (master database)
trust1.domain.com    → Trust Login (trust database)
domain.com           → Default Trust Login or redirect
```

### Two-Database Architecture
```
Master Database:
- system_users (SYSTEM_ADMIN, GROUP_ADMIN)
- trusts (trust configurations)
- system_user_sessions
- audit_logs (system-level)

Trust Database:
- users (TRUST_ADMIN, SCHOOL_ADMIN, TEACHER, ACCOUNTANT, PARENT)
- schools, students, fees, attendance, etc.
- user_sessions
- audit_logs (trust-level)
```

### RBAC Configuration
- **File**: `config/rbac.json`
- **Roles**: SYSTEM_ADMIN → GROUP_ADMIN → TRUST_ADMIN → SCHOOL_ADMIN → TEACHER/ACCOUNTANT → PARENT
- **Permissions**: Resource:Action format (e.g., "students:read", "fees:create")
- **Context Rules**: Own-data access for PARENT and TEACHER roles
- **Route Protection**: Path-based access control

### Validation Strategy
1. **Input Layer**: Joi schemas + XSS sanitization
2. **Business Layer**: Custom validation rules
3. **Database Layer**: Constraints and foreign keys
4. **Runtime Layer**: Error recovery and circuit breakers

### Module Requirements (From Original Project)
1. **Authentication Module (AUTH-02-xxx)**
   - ✅ Unified login (system/trust)
   - ✅ Session management
   - ✅ Password security
   - ✅ Account lockout
   - ⏳ Multi-factor authentication
   - ⏳ Password reset

2. **Setup Module (SETUP-01-xxx)**
   - ⏳ Wizard engine for trust setup
   - ⏳ School configuration
   - ⏳ Academic year setup
   - ⏳ Class and section management
   - ⏳ Initial user creation

3. **User Management (USER-03-xxx)**
   - ⏳ User CRUD operations
   - ⏳ Role assignment
   - ⏳ School assignments
   - ⏳ Teacher-class assignments
   - ⏳ Parent-student linking

4. **Student Management (STUD-04-xxx)**
   - ⏳ Student admission workflow
   - ⏳ Student profile management
   - ⏳ Document management
   - ⏳ Transfer/promotion workflows

5. **Fee Management (FEES-05-xxx)**
   - ⏳ Fee structure setup
   - ⏳ Fee collection
   - ⏳ Payment processing
   - ⏳ Receipt generation
   - ⏳ Defaulter tracking

6. **Attendance (ATTD-06-xxx)**
   - ⏳ Daily attendance marking
   - ⏳ Leave management
   - ⏳ Attendance reports

7. **Reports (REPT-07-xxx)**
   - ⏳ Student reports
   - ⏳ Fee collection reports
   - ⏳ Attendance reports
   - ⏳ Custom report builder

8. **Dashboard (DASH-08-xxx)**
   - ⏳ Role-based dashboards
   - ⏳ Real-time statistics
   - ⏳ Quick actions

9. **Communications (COMM-09-xxx)**
   - ⏳ SMS/Email notifications
   - ⏳ Announcements
   - ⏳ Emergency alerts

## Simplicity Principles

### Code Organization
- **DRY Principle**: Reusable utilities and components
- **Single Responsibility**: Each module has one clear purpose
- **Consistent Patterns**: Same structure across all modules
- **Clear Naming**: Self-documenting code and variables

### Error Handling
- **Fail Safe**: Always handle errors gracefully
- **User Friendly**: Clear error messages for users
- **Developer Friendly**: Detailed logs for debugging
- **Recovery**: Automatic retry for transient failures

### Maintenance Considerations
- **Documentation**: Inline comments and README files
- **Testing**: Unit and integration tests
- **Monitoring**: Health checks and performance metrics
- **Updates**: Easy dependency updates and patches

## Tailwind Components Strategy

### Reusable Components
1. **Form Components**
   - Input fields with validation styling
   - Select dropdowns with search
   - Date pickers
   - File upload areas

2. **Layout Components**
   - Dashboard cards
   - Data tables with pagination
   - Modal dialogs
   - Alert messages

3. **Navigation Components**
   - Sidebar navigation
   - Breadcrumbs
   - Tab navigation
   - Action buttons

### CSS Organization
```
public/css/
├── components/         # Reusable component styles
├── layouts/           # Layout-specific styles
├── utilities/         # Custom utility classes
└── app.css           # Main compiled CSS
```

## Security Requirements

### Authentication Security
- Password hashing with bcrypt (12+ rounds)
- Session-based authentication
- Account lockout after failed attempts
- Session timeout and rotation

### Authorization Security
- Role-based access control
- Permission-based resource access
- Context-aware authorization
- Audit logging for all actions

### Input Security
- XSS prevention via sanitization
- SQL injection prevention via parameterized queries
- Rate limiting on all endpoints
- CSRF protection for forms

### Data Security
- Sensitive data masking in logs
- Encrypted database connections
- Secure session storage
- Regular security audits

## Performance Requirements

### Response Time Targets
- Page loads: < 2 seconds
- API responses: < 500ms
- Database queries: < 100ms
- File uploads: < 5 seconds per MB

### Scalability Targets
- 1000+ concurrent users per trust
- 50,000+ students per trust
- 1M+ fee transactions per year
- 99.9% uptime requirement

### Resource Limits
- Memory usage: < 512MB per process
- CPU usage: < 70% average
- Database connections: < 50 concurrent
- File storage: Configurable limits

## Deployment Requirements

### Environment Support
- Development: Local with Docker
- Staging: Cloud VM with monitoring
- Production: Load-balanced VMs
- Backup: Automated daily backups

### Monitoring Requirements
- Application performance monitoring
- Database performance monitoring
- Error tracking and alerting
- User activity analytics

### Backup Requirements
- Daily automated database backups
- Weekly full system backups
- Point-in-time recovery capability
- Backup verification and testing

## Browser Support

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Mobile Support
- Responsive design for tablets
- Basic mobile browser support
- Touch-friendly interface elements
- Mobile-optimized forms

## Compliance Requirements

### Data Protection
- GDPR compliance for EU users
- Data retention policies
- Right to data deletion
- Privacy policy compliance

### Educational Compliance
- Student data protection
- Parental consent management
- Academic record security
- Regulatory reporting support

## Future Considerations

### Planned Enhancements
- **Mobile app development** (requires comprehensive API documentation)
- Advanced analytics and reporting
- AI-powered insights and recommendations
- Third-party integrations (payment gateways, SMS providers)
- Multi-language support

### API Documentation Strategy
- OpenAPI/Swagger documentation for all endpoints
- Interactive API explorer for developers
- SDK generation for mobile app development
- Postman collections for testing
- Rate limiting and authentication guides

### Technology Evolution
- Regular dependency updates and security patches
- Performance optimizations and caching strategies
- Security enhancements and compliance updates
- Feature expansions based on user feedback

---

*This document is updated as requirements evolve and decisions are made during development.*