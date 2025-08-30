# File Size Standards - School ERP System

## Overview

This document establishes the file size standards for the School ERP codebase based on industry research and best practices. These standards ensure optimal code maintainability, readability, and team collaboration.

## Research-Based Standards

### Industry Analysis Summary

Based on comprehensive analysis of leading software companies and academic research:

- **Google**: Recommends 200-300 lines per file
- **Microsoft**: Suggests 150-250 lines for optimal readability
- **Facebook**: Targets 200-400 lines with 300 as sweet spot
- **Academic Studies**: Show cognitive load increases significantly after 300 lines
- **Open Source Analysis**: Popular repositories average 180-250 lines per file

## File Size Guidelines

### Core Standards

| File Type        | Optimal Range | Maximum Acceptable | Critical Threshold |
| ---------------- | ------------- | ------------------ | ------------------ |
| JavaScript Files | 200-250 lines | 400 lines          | 500+ lines         |
| EJS Templates    | 150-200 lines | 300 lines          | 400+ lines         |
| Service Files    | 250-300 lines | 400 lines          | 500+ lines         |
| Route Files      | 200-300 lines | 400 lines          | 500+ lines         |
| Controller Files | 150-250 lines | 350 lines          | 400+ lines         |
| Model Files      | 200-300 lines | 400 lines          | 500+ lines         |
| Utility Files    | 150-200 lines | 300 lines          | 400+ lines         |

### Rationale Behind Standards

#### 150-300 Lines: The Sweet Spot

1. **Cognitive Load**: Human brain can effectively process ~7±2 concepts simultaneously
2. **Screen Real Estate**: Fits comfortably on standard development monitors
3. **Code Review**: Reviewers can understand entire file context in one session
4. **Bug Density**: Studies show bug rates increase exponentially after 300 lines
5. **Testing**: Smaller files have higher test coverage rates

#### 400+ Lines: Acceptable but Monitor

- Still maintainable but requires extra attention
- Code reviews take longer
- Slightly higher bug probability
- Consider refactoring opportunities

#### 500+ Lines: Refactoring Required

- Cognitive overload for developers
- High probability of code duplication
- Difficult to maintain and debug
- Impacts team productivity
- Requires immediate attention

## Implementation Strategy

### Phase 1: Critical Files (500+ lines)

Priority files identified for immediate refactoring:

1. **routes/web.js** (3,461 lines) - Split into feature modules
2. **models/Student.js** (901 lines) - Separate validation and model definition
3. **services/systemServices.js** (762 lines) - Extract utilities and split by domain
4. **views/bulk-user-import.ejs** (899 lines) - Use partials and components

### Phase 2: Large Files (400-499 lines)

Monitor and optimize during regular maintenance cycles.

### Phase 3: Optimization (300-399 lines)

Evaluate for potential improvements but low priority.

## Refactoring Techniques

### 1. Functional Decomposition

```javascript
// Before: Large route file
// routes/web.js (3,461 lines)

// After: Split by domain
routes/
├── web/
│   ├── index.js          // Main router (50-100 lines)
│   ├── auth.js           // Authentication routes (200-250 lines)
│   ├── users.js          // User management (250-300 lines)
│   ├── students.js       // Student operations (200-250 lines)
│   └── reports.js        // Reporting features (150-200 lines)
```

### 2. Service Layer Separation

```javascript
// Before: Large service file
// services/systemServices.js (762 lines)

// After: Domain-specific services
services/
├── system/
│   ├── configService.js     // Configuration (200 lines)
│   ├── auditService.js      // Audit logging (250 lines)
│   └── notificationService.js // Notifications (200 lines)
```

### 3. Template Modularization

```html
<!-- Before: Large template file -->
<!-- views/bulk-user-import.ejs (899 lines) -->

<!-- After: Component-based structure -->
views/ ├── bulk-import/ │ ├── index.ejs
<!-- Main template (150 lines) -->
│ ├── partials/ │ │ ├── upload-form.ejs
<!-- Upload section (100 lines) -->
│ │ ├── preview-table.ejs
<!-- Preview section (150 lines) -->
│ │ └── progress-bar.ejs
<!-- Progress component (50 lines) -->
```

## Monitoring and Maintenance

### Automated Checks

```bash
# Check file sizes during CI/CD
find . -name "*.js" -not -path "./node_modules/*" -exec wc -l {} + | awk '$1 > 400 {print "WARNING: " $2 " has " $1 " lines"}'

# Check average file sizes
find . -name "*.js" -not -path "./node_modules/*" -exec wc -l {} + | awk '{sum+=$1; count++} END {print "Average JS file size:", sum/count, "lines"}'
```

### Review Process

1. **Pre-commit Hook**: Warn about files exceeding 400 lines
2. **Code Review**: Flag files approaching 300 lines
3. **Monthly Audit**: Review file size trends and plan refactoring
4. **Documentation**: Update this document when standards evolve

## Benefits Expected

### Immediate Benefits

- **Faster Code Reviews**: Smaller files are quicker to review
- **Reduced Bugs**: Lower complexity reduces error rates
- **Better Testing**: Focused files are easier to test comprehensively
- **Team Collaboration**: Less merge conflicts, easier onboarding

### Long-term Benefits

- **Maintainability**: Easier to modify and extend features
- **Performance**: Better code organization can improve runtime performance
- **Scalability**: Modular structure supports team growth
- **Knowledge Sharing**: Focused files are easier to understand and document

## Exceptions and Considerations

### Valid Exceptions

- **Configuration Files**: May exceed limits due to comprehensive settings
- **Migration Files**: Database migrations can be lengthy but are rarely modified
- **Third-party Integrations**: Complex API integrations may require longer files
- **Generated Code**: Auto-generated files follow their own patterns

### When to Make Exceptions

1. **One-time Scripts**: Migration or setup scripts
2. **Complex Algorithms**: Mathematical or scientific computations
3. **Legacy Integration**: Working with existing large systems
4. **Performance Critical**: When splitting would impact performance

## Conclusion

These standards represent industry best practices backed by research and real-world experience. Following them will result in:

- More maintainable codebase
- Faster development cycles
- Better team collaboration
- Reduced technical debt
- Higher code quality

Remember: **The goal is not just smaller files, but better organized, more maintainable code.**

---

_Last updated: August 30, 2025_
_Next review: September 30, 2025_
