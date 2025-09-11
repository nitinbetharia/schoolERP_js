#!/bin/bash

# School ERP Codebase Cleanup Script
# This script removes unnecessary test files, documentation, and temporary files

PROJECT_ROOT="d:/Users/Nitin Betharia/Documents/Projects/schoolERP_js"
LOG_FILE="$PROJECT_ROOT/cleanup.log"

echo "=== School ERP Codebase Cleanup Started ===" > "$LOG_FILE"
echo "Date: $(date)" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Function to safely remove files/directories
safe_remove() {
    local target="$1"
    local description="$2"
    
    if [ -e "$target" ]; then
        echo "Removing $description: $target" | tee -a "$LOG_FILE"
        rm -rf "$target"
        echo "✓ Removed: $target" >> "$LOG_FILE"
    else
        echo "✗ Not found: $target" >> "$LOG_FILE"
    fi
}

# Change to project directory
cd "$PROJECT_ROOT" || exit 1

echo "Starting cleanup process..."

# 1. Remove temporary test files (root level)
echo "=== Removing temporary test files ===" | tee -a "$LOG_FILE"
safe_remove "test-*.js" "temporary test files"
safe_remove "test-db-connection.js" "database connection test"
safe_remove "test-db-connectivity.js" "database connectivity test"
safe_remove "test-db-init.js" "database init test"
safe_remove "test-db-quick.js" "quick database test"
safe_remove "test-custom-logger.js" "logger test"
safe_remove "test-complete-init.js" "complete init test"
safe_remove "test-implementation.js" "implementation test"
safe_remove "test-individual-routes.js" "individual routes test"
safe_remove "test-model-imports.js" "model imports test"
safe_remove "test-network.js" "network test"
safe_remove "test-routes.js" "routes test"
safe_remove "test-sequelize.js" "sequelize test"
safe_remove "test-server.js" "server test"
safe_remove "test-tenant-configuration.js" "tenant configuration test"
safe_remove "test-timeout.js" "timeout test"

# 2. Remove duplicate/temporary server files
echo "=== Removing duplicate server files ===" | tee -a "$LOG_FILE"
safe_remove "simple-server.js" "simple test server"
safe_remove "minimal-server.js" "minimal test server"
safe_remove "server.js.backup" "server backup file"

# 3. Remove temporary documentation and status reports
echo "=== Removing temporary documentation ===" | tee -a "$LOG_FILE"
safe_remove "COMPREHENSIVE_FIX_PLAN.md" "comprehensive fix plan"
safe_remove "COMPREHENSIVE_FIXES_COMPLETE.md" "comprehensive fixes complete"
safe_remove "COMPREHENSIVE_PROJECT_REVIEW.md" "comprehensive project review"
safe_remove "CORRECTED_FRONTEND_ASSESSMENT.md" "corrected frontend assessment"
safe_remove "CRITICAL_FIXES_SUMMARY.md" "critical fixes summary"
safe_remove "FONT_AWESOME_RESTORATION_COMPLETE.md" "font awesome restoration report"
safe_remove "FRONTEND_COMPLETION_REPORT.md" "frontend completion report"
safe_remove "FRONTEND_COVERAGE_REPORT.md" "frontend coverage report"
safe_remove "FRONTEND_ENHANCEMENT_PLAN.md" "frontend enhancement plan"
safe_remove "PRODUCTION_READINESS_AUDIT.md" "production readiness audit"
safe_remove "TEMPLATE_FIXES_REPORT.md" "template fixes report"
safe_remove "TRUST_EDIT_FORM_FIXED.md" "trust edit form fix report"
safe_remove "VIEWPORT_OPTIMIZATION_COMPLETE.md" "viewport optimization report"

# 4. Remove most docs (keep only essential ones)
echo "=== Removing temporary docs folder content ===" | tee -a "$LOG_FILE"
safe_remove "docs/ALL_PHASES_MASTER_PLAN.md" "all phases master plan"
safe_remove "docs/DATABASE_FRONTEND_GAP_ANALYSIS.md" "database frontend gap analysis"
safe_remove "docs/DATABASE_HANGING_ISSUE_RESOLVED.md" "database hanging issue report"
safe_remove "docs/DATA_INTEGRITY_AUDIT_REPORT.md" "data integrity audit report"
safe_remove "docs/DATA_INTEGRITY_COMPLETION_SUMMARY.md" "data integrity completion summary"
safe_remove "docs/EJS_SYNTAX_ERROR_ANALYSIS.md" "EJS syntax error analysis"
safe_remove "docs/ENHANCEMENT_COMPLETION_SUMMARY.md" "enhancement completion summary"
safe_remove "docs/FINAL_PHASE_IMPLEMENTATION_SUMMARY.md" "final phase implementation summary"
safe_remove "docs/FRONTEND_DEVELOPMENT_STRATEGY.md" "frontend development strategy"
safe_remove "docs/FRONTEND_PROGRESS_REPORT.md" "frontend progress report"
safe_remove "docs/IMPLEMENTATION_PROGRESS_SUMMARY.md" "implementation progress summary"
safe_remove "docs/MODULE_COMPLETION_PLAN.md" "module completion plan"
safe_remove "docs/PHASE3_IMPLEMENTATION_COMPLETE.md" "phase 3 implementation complete"
safe_remove "docs/PHASE4_COMPLETION_CELEBRATION.md" "phase 4 completion celebration"
safe_remove "docs/PHASE4_IMPLEMENTATION_COMPLETE.md" "phase 4 implementation complete"
safe_remove "docs/PHASE4_IMPLEMENTATION_PLAN.md" "phase 4 implementation plan"
safe_remove "docs/PHASE4_IMPLEMENTATION_STATUS.md" "phase 4 implementation status"
safe_remove "docs/PHASE_1_COMPLETION_SUMMARY.md" "phase 1 completion summary"
safe_remove "docs/PHASE_1_IMPLEMENTATION_PLAN.md" "phase 1 implementation plan"
safe_remove "docs/PHASE_2_COMPLETION_SUMMARY.md" "phase 2 completion summary"
safe_remove "docs/PHASE_2_DATABASE_INTEGRATION_PLAN.md" "phase 2 database integration plan"
safe_remove "docs/PHASE_5_IMPLEMENTATION_STATUS.md" "phase 5 implementation status"
safe_remove "docs/TENANT_CONFIGURATION_IMPLEMENTATION_COMPLETE.md" "tenant configuration implementation complete"
safe_remove "docs/UI_UX_THEME_ANALYSIS_REPORT.md" "UI/UX theme analysis report"
safe_remove "docs/VIEWPORT_OPTIMIZATION_GUIDE.md" "viewport optimization guide"

# 5. Remove miscellaneous temporary files
echo "=== Removing miscellaneous files ===" | tee -a "$LOG_FILE"
safe_remove "analyze-database.js" "database analysis script"
safe_remove "cleanup-codebase.sh" "old cleanup script"
safe_remove "database-schema-analysis.json" "database schema analysis"
safe_remove "phase-implementation-guide.js" "phase implementation guide"
safe_remove "validate-ejs.js" "EJS validation script"
safe_remove "server.log" "server log file"

# 6. Remove Python test scripts
echo "=== Removing Python test scripts ===" | tee -a "$LOG_FILE"
safe_remove "python_scripts/test_auth.py" "auth test script"
safe_remove "python_scripts/test_security.py" "security test script"
safe_remove "python_scripts/test_simple_auth.py" "simple auth test script"
safe_remove "python_scripts/show_users.py" "show users script"

# 7. Remove temporary logs and empty directories
echo "=== Cleaning up logs and empty directories ===" | tee -a "$LOG_FILE"
find "$PROJECT_ROOT" -name "*.log" -type f -exec rm -f {} \; 2>/dev/null || true
find "$PROJECT_ROOT" -type d -empty -delete 2>/dev/null || true

echo "" >> "$LOG_FILE"
echo "=== Cleanup Summary ===" | tee -a "$LOG_FILE"
echo "Cleanup completed on $(date)" >> "$LOG_FILE"
echo "Log file saved to: $LOG_FILE" | tee -a "$LOG_FILE"

echo ""
echo "✅ Codebase cleanup completed!"
echo "📄 Check cleanup.log for detailed information"
echo ""
echo "Files kept:"
echo "- server.js (main server)"
echo "- start-server.js (startup script with pre-flight checks)"
echo "- README.md (main documentation)"
echo "- DEVELOPER_GUIDE.md (developer documentation)"
echo "- docs/FEE_MANAGEMENT_FEATURES.md (feature documentation)"
echo "- docs/USER_MANAGEMENT_FEATURES.md (feature documentation)"
echo "- docs/REPORTS_SYSTEM_FEATURES.md (feature documentation)"
echo "- All production code in models/, routes/, services/, views/, etc."
