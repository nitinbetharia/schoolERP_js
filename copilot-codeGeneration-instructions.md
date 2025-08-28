
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
