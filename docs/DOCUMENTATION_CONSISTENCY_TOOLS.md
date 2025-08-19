# 🔍 Documentation Consistency Tools

This project includes automated tools to maintain 100% consistency across all documentation files.

## Quick Commands

```bash
# Check documentation consistency
npm run validate:docs

# Preview automatic fixes
npm run fix:docs:dry

# Apply automatic fixes
npm run fix:docs

# Run all validations (code + docs)
npm run validate:all
```

## What Gets Checked

✅ **Database naming consistency** (school_erp_system vs school_erp_master)  
✅ **Version specifications** (Node.js 18+ standardization)  
✅ **Default credentials** (admin@system.local/admin123)  
✅ **MySQL commands** (mysqlsh vs mysql)  
✅ **Q29 compliance** (JSON config vs environment variables)  
✅ **Technology stack naming** (MySQL, Express.js, Sequelize, etc.)  

## Features

- **Automated verification** in 30 seconds vs 2-3 hours manual
- **Safe preview mode** with `--dry-run` flag
- **Detailed reporting** with specific file locations
- **Consistency rating** with improvement tracking
- **CI/CD integration ready**

## Files Monitored

- All `.md` files in `docs/` directory
- `README.md` in root directory  
- Recursive scanning of all subdirectories

## Integration

Add to your workflow:
- Pre-commit hooks
- CI/CD pipeline
- Documentation review process

For details, see: `docs/developer/DOCUMENTATION_CONSISTENCY_SUMMARY.md`
