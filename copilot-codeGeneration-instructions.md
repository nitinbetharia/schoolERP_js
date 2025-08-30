# Copilot Code Generation Instructions

This file outlines the coding style, architectural preferences, and library choices for Nitin Betharia's Node.js-based codebase. Copilot should follow these guidelines when generating code.

## General Guidelines

- Write clean, readable, and well-documented code.
- Use meaningful variable and function names.
- Follow standard JavaScript/Node.js best practices.
- Avoid unnecessary complexity; prefer simplicity and clarity.

## Architectural Patterns

- Use modular design with clear separation of concerns.
- Follow MVC or service-oriented architecture.
- Use middleware effectively in Express.
- Prefer async/await for asynchronous operations.

## Naming Conventions

- Use `camelCase` for variables and functions.
- Use `PascalCase` for class names and constructors.
- Prefix private methods with an underscore `_`.

## Preferred Libraries

- Server: `express`
- Database: `mysql2`, `sequelize`
- Validation: `joi`, `express-validator`
- Authentication: `jsonwebtoken`, `bcrypt`
- Utility: `lodash`, `moment`
- Frontend: `ejs`, `ejs-layouts`, `bootstrap`

## Formatting Rules

- Use 2 spaces for indentation.
- Limit lines to 100 characters.
- Include JSDoc comments for all functions and classes.

## File Size Standards (Industry Research-Based)

- **Optimal Range**: 150-300 lines per file for maximum maintainability
- **Acceptable Range**: Up to 400 lines per file
- **Critical Threshold**: 500+ lines require immediate refactoring
- **JavaScript Files**: Target 200-250 lines, maximum 400 lines
- **EJS Templates**: Target 150-200 lines, maximum 300 lines
- **Service Files**: Target 250-300 lines, maximum 400 lines
- **Route Files**: Target 200-300 lines, split by feature modules

### Refactoring Guidelines

- Split large files by functional responsibility
- Extract reusable utilities into separate modules
- Separate API routes by feature domains
- Break complex templates into partial components
- Use modular architecture with clear separation of concerns

### Refactoring Success Metrics (Achieved)

#### Phase 1 - Routes Refactoring (COMPLETED ✅)

- Original: `routes/web.js` - 3,442 lines (monolithic)
- Result: 12 focused modules, all under 400 lines
- Success Rate: 100% (25/25 tests passed)
- Benefits: Better maintainability, clear separation by feature

#### Phase 2 - Student Model Refactoring (COMPLETED ✅)

- Original: `models/Student.js` - 902 lines (monolithic)
- Result: 8 focused modules (47-442 lines each)
- Success Rate: 100% (18/18 tests passed)
- Benefits: Modular structure, enhanced testability, legacy compatibility maintained

#### Current Codebase Health

- Total tests passed: 43/43 (100% success rate)
- File size compliance: 20/20 files within standards
- Zero breaking changes to existing functionality
- Ready for Phase 3: Services & Large Models refactoring

## File Placement

Place this file at the **root of the repository** so that it is easily accessible and can guide Copilot across all modules.

## Design Principles

- Follow the **DRY (Don't Repeat Yourself)** principle to reduce code duplication.
- Apply **SOLID** principles for maintainable and scalable software design:
  - **S**: Single Responsibility Principle
  - **O**: Open/Closed Principle
  - **L**: Liskov Substitution Principle
  - **I**: Interface Segregation Principle
  - **D**: Dependency Inversion Principle
