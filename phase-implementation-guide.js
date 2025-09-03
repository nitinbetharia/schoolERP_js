const fs = require('fs');

// PHASE-WISE IMPLEMENTATION HELPER
// This script provides implementation templates for each phase

function generatePhaseImplementationTemplates() {
   const phases = {
      phase1: {
         name: 'Error Handling Implementation',
         files: [
            {
               path: 'views/error/404.ejs',
               content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Not Found - School ERP</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="/css/app.css">
</head>
<body class="bg-light">
    <div class="container-fluid vh-100 d-flex align-items-center justify-content-center">
        <div class="text-center">
            <div class="error-code text-primary mb-4">
                <h1 class="display-1 fw-bold">404</h1>
            </div>
            <h2 class="h4 mb-3">Page Not Found</h2>
            <p class="text-muted mb-4">The page you're looking for doesn't exist or has been moved.</p>
            <div class="d-flex gap-3 justify-content-center">
                <a href="/" class="btn btn-primary">
                    <i class="fas fa-home me-2"></i>Return Home
                </a>
                <a href="javascript:history.back()" class="btn btn-outline-secondary">
                    <i class="fas fa-arrow-left me-2"></i>Go Back
                </a>
            </div>
        </div>
    </div>
</body>
</html>`,
            },
            {
               path: 'views/error/500.ejs',
               content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Server Error - School ERP</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="/css/app.css">
</head>
<body class="bg-light">
    <div class="container-fluid vh-100 d-flex align-items-center justify-content-center">
        <div class="text-center">
            <div class="error-code text-danger mb-4">
                <h1 class="display-1 fw-bold">500</h1>
            </div>
            <h2 class="h4 mb-3">Internal Server Error</h2>
            <p class="text-muted mb-4">Something went wrong on our servers. Please try again later.</p>
            <div class="d-flex gap-3 justify-content-center">
                <a href="/" class="btn btn-primary">
                    <i class="fas fa-home me-2"></i>Return Home
                </a>
                <button onclick="location.reload()" class="btn btn-outline-secondary">
                    <i class="fas fa-refresh me-2"></i>Try Again
                </button>
            </div>
        </div>
    </div>
</body>
</html>`,
            },
         ],
      },
      phase2: {
         name: 'Asset Organization',
         directories: ['public/fonts', 'public/vendor', 'public/css/components', 'public/js/components'],
         files: [
            {
               path: 'views/partials/meta.ejs',
               content: `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="description" content="<%= typeof description !== 'undefined' ? description : 'School ERP Management System' %>">
<meta name="keywords" content="school, erp, education, management">
<meta name="author" content="School ERP System">

<!-- Favicon -->
<link rel="icon" type="image/png" href="/images/favicon.png">

<!-- Open Graph Meta Tags -->
<meta property="og:title" content="<%= typeof title !== 'undefined' ? title : 'School ERP System' %>">
<meta property="og:description" content="<%= typeof description !== 'undefined' ? description : 'Comprehensive School Management System' %>">
<meta property="og:type" content="website">
<meta property="og:url" content="<%= typeof currentUrl !== 'undefined' ? currentUrl : '' %>">

<!-- Twitter Card Meta Tags -->
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="<%= typeof title !== 'undefined' ? title : 'School ERP System' %>">
<meta name="twitter:description" content="<%= typeof description !== 'undefined' ? description : 'Comprehensive School Management System' %>">`,
            },
            {
               path: 'views/partials/scripts.ejs',
               content: `<!-- jQuery -->
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

<!-- Bootstrap JS -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>

<!-- Font Awesome -->
<script src="https://kit.fontawesome.com/your-fontawesome-kit.js" crossorigin="anonymous"></script>

<!-- Custom JavaScript -->
<script src="/js/app.js"></script>
<script src="/js/mobile-responsive-helper.js"></script>

<!-- Page-specific scripts -->
<% if (typeof pageScripts !== 'undefined') { %>
    <% pageScripts.forEach(function(script) { %>
        <script src="<%= script %>"></script>
    <% }); %>
<% } %>`,
            },
         ],
      },
      phase3: {
         name: 'Interactive Components',
         files: [
            {
               path: 'public/js/components/form-validation.js',
               content: `// Form Validation Component
class FormValidator {
    constructor(formSelector, options = {}) {
        this.form = document.querySelector(formSelector);
        this.options = {
            showErrors: true,
            validateOnBlur: true,
            validateOnSubmit: true,
            ...options
        };
        this.init();
    }

    init() {
        if (!this.form) return;
        
        if (this.options.validateOnBlur) {
            this.addBlurValidation();
        }
        
        if (this.options.validateOnSubmit) {
            this.addSubmitValidation();
        }
    }

    addBlurValidation() {
        const inputs = this.form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
        });
    }

    addSubmitValidation() {
        this.form.addEventListener('submit', (e) => {
            if (!this.validateForm()) {
                e.preventDefault();
            }
        });
    }

    validateField(field) {
        const value = field.value.trim();
        const type = field.type;
        const required = field.hasAttribute('required');
        
        // Clear previous errors
        this.clearFieldError(field);
        
        // Required validation
        if (required && !value) {
            this.showFieldError(field, 'This field is required');
            return false;
        }
        
        // Email validation
        if (type === 'email' && value) {
            const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
            if (!emailRegex.test(value)) {
                this.showFieldError(field, 'Please enter a valid email address');
                return false;
            }
        }
        
        // Phone validation
        if (field.name === 'phone' && value) {
            const phoneRegex = /^[0-9]{10}$/;
            if (!phoneRegex.test(value)) {
                this.showFieldError(field, 'Please enter a valid 10-digit phone number');
                return false;
            }
        }
        
        return true;
    }

    validateForm() {
        const inputs = this.form.querySelectorAll('input, select, textarea');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    }

    showFieldError(field, message) {
        if (!this.options.showErrors) return;
        
        field.classList.add('is-invalid');
        
        let errorDiv = field.parentNode.querySelector('.invalid-feedback');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.classList.add('invalid-feedback');
            field.parentNode.appendChild(errorDiv);
        }
        
        errorDiv.textContent = message;
    }

    clearFieldError(field) {
        field.classList.remove('is-invalid');
        const errorDiv = field.parentNode.querySelector('.invalid-feedback');
        if (errorDiv) {
            errorDiv.remove();
        }
    }
}`,
            },
            {
               path: 'public/js/components/data-tables.js',
               content: `// Data Tables Component
class DataTableManager {
    constructor(tableSelector, options = {}) {
        this.table = document.querySelector(tableSelector);
        this.options = {
            searchable: true,
            sortable: true,
            paginated: true,
            pageSize: 10,
            ...options
        };
        this.init();
    }

    init() {
        if (!this.table) return;
        
        this.addSearchFunctionality();
        this.addSortFunctionality();
        
        if (this.options.paginated) {
            this.addPagination();
        }
    }

    addSearchFunctionality() {
        if (!this.options.searchable) return;
        
        const searchInput = document.querySelector('[data-table-search]');
        if (!searchInput) return;
        
        searchInput.addEventListener('input', (e) => {
            this.filterTable(e.target.value);
        });
    }

    addSortFunctionality() {
        if (!this.options.sortable) return;
        
        const headers = this.table.querySelectorAll('th[data-sortable]');
        headers.forEach(header => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', () => {
                this.sortTable(header);
            });
        });
    }

    filterTable(searchTerm) {
        const rows = this.table.querySelectorAll('tbody tr');
        const term = searchTerm.toLowerCase();
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            if (text.includes(term)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    sortTable(header) {
        const columnIndex = Array.from(header.parentNode.children).indexOf(header);
        const rows = Array.from(this.table.querySelectorAll('tbody tr'));
        const isAscending = !header.classList.contains('sort-asc');
        
        // Clear all sort classes
        this.table.querySelectorAll('th').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
        });
        
        // Add current sort class
        header.classList.add(isAscending ? 'sort-asc' : 'sort-desc');
        
        // Sort rows
        rows.sort((a, b) => {
            const aVal = a.children[columnIndex].textContent.trim();
            const bVal = b.children[columnIndex].textContent.trim();
            
            if (isAscending) {
                return aVal.localeCompare(bVal);
            } else {
                return bVal.localeCompare(aVal);
            }
        });
        
        // Reorder rows in DOM
        const tbody = this.table.querySelector('tbody');
        rows.forEach(row => tbody.appendChild(row));
    }

    addPagination() {
        // Implementation for pagination
        console.log('Pagination feature coming soon');
    }
}`,
            },
         ],
      },
   };

   return phases;
}

function displayImplementationGuide() {
   const phases = generatePhaseImplementationTemplates();

   console.log('='.repeat(60));
   console.log('FRONTEND ENHANCEMENT IMPLEMENTATION GUIDE');
   console.log('='.repeat(60));
   console.log('');

   console.log('PHASE 1: ERROR HANDLING IMPLEMENTATION');
   console.log('-'.repeat(40));
   console.log('Files to create:');
   phases.phase1.files.forEach((file) => {
      console.log(`  ✓ ${file.path}`);
   });
   console.log('');

   console.log('PHASE 2: ASSET ORGANIZATION');
   console.log('-'.repeat(27));
   console.log('Directories to create:');
   phases.phase2.directories.forEach((dir) => {
      console.log(`  📁 ${dir}`);
   });
   console.log('Files to create:');
   phases.phase2.files.forEach((file) => {
      console.log(`  ✓ ${file.path}`);
   });
   console.log('');

   console.log('PHASE 3: INTERACTIVE COMPONENTS');
   console.log('-'.repeat(31));
   console.log('JavaScript components to add:');
   phases.phase3.files.forEach((file) => {
      console.log(`  ✓ ${file.path}`);
   });
   console.log('');

   console.log('IMPLEMENTATION PRIORITY:');
   console.log('1. Phase 1 (HIGH) - Critical for production error handling');
   console.log('2. Phase 2 (HIGH) - Professional asset organization');
   console.log('3. Phase 3 (MEDIUM) - Enhanced user experience');
   console.log('');

   console.log('ESTIMATED TIMELINE:');
   console.log('Phase 1: 2-3 hours');
   console.log('Phase 2: 2-3 hours');
   console.log('Phase 3: 4-5 hours');
   console.log('Total: 8-11 hours');
   console.log('');

   console.log('NEXT STEPS:');
   console.log('1. Create Phase 1 error handling templates');
   console.log('2. Update error middleware in server.js');
   console.log('3. Test error scenarios');
   console.log('4. Proceed to Phase 2 asset organization');

   return phases;
}

// Run the implementation guide
displayImplementationGuide();
