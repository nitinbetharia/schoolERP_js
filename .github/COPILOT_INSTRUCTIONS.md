# Copilot Instructions – School ERP (Bulletproof) — 2025-08

## Invariants
- Secrets live **only in `.env`**. Never in code or config files committed with real values.
- **All runtime config from `config/*.json`** or environment variables. **No hardcoding** of ports, limits, table names, or email settings in code.
- **Read connection strings and models first**. Before writing scripts or migrations, load config, resolve DB URL, inspect existing models for table and field names, and then proceed.

## Tech Baseline
- Node.js ≥ 22, Express 5.1, MySQL 8.4 LTS preferred (8.0.43+ ok), EJS 3.1.10, Joi 18, mysql2 3.14, helmet 8.1, express-session 1.18.2, express-rate-limit 8.x, winston 3.17.

## Generation Rules for Copilot
1. **Config-first code**: `const cfg = require('../config');` or JSON load. Read `process.env` only for secrets. Use `cfg.databases.master.url || composeFrom(cfg.databases.master, env)` for connections.
2. **No hardcoded identifiers**: Get table names and columns from the models layer or constants module. Never inline `'students'`, `'fee_structures'`, etc.
3. **RBAC + Validation chain**: `requireAuth → extractContext → requirePermission → rateLimit → validateInput(Joi) → handler`.
4. **DB access**: mysql2 prepared statements. Transactions for multi-table writes. Handle deadlocks with retry (max 2).
5. **Audit**: Log who/what/when/IP/UA and old vs new for all mutations.
6. **Logging**: Winston structured logs. No `console.log` in production paths.
7. **Testing**: Add unit + integration tests for every new service and route.
8. **Formatting & Linting**: Respect project ESLint and Prettier. Run `npm run lint:fix && npm run format` before PR.
9. **EJS + CSRF**: All forms include CSRF tokens. Validate on client and server.
10. **Secrets discipline**: If code attempts to introduce a secret in code or config, reject with a TODO to move it to `.env`.

## File Layout Hints
- Keep module order: DATA → AUTH → SETUP → USER → STUD → FEES → ATTD → REPT → DASH → COMM.
- Place configs in `/config`. Add environment overlays like `production.json` without secrets.
- Scripts read config and `.env` before DB actions.

## Response and Error Contract
- JSON: `{ success, data?, error?, code?, meta? }` for `/api/*` routes.
- Rendered pages use centralized EJS error view.

## Performance & Security
- Index-friendly queries, pagination by default.
- Rate limit on auth and public GETs.
- Helmet on all routes; sessions `httpOnly`, `secure` in prod.
