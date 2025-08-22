module.exports = [
   {
      ignores: [
         'node_modules/**',
         'dist/**',
         'build/**',
         '.git/**',
         'coverage/**',
         'logs/**',
         '*.log',
         '.nyc_output/**',
         'public/js/vendor/**',
         'public/css/vendor/**',
         'scripts/generated/**',
         '*.min.js',
         'backups/**',
      ],
   },
   {
      files: ['**/*.js'],
      languageOptions: {
         ecmaVersion: 'latest',
         sourceType: 'commonjs',
         globals: {
            console: 'readonly',
            process: 'readonly',
            Buffer: 'readonly',
            __dirname: 'readonly',
            __filename: 'readonly',
            exports: 'writable',
            module: 'writable',
            require: 'readonly',
            global: 'readonly',
            URL: 'readonly',
            setTimeout: 'readonly',
            setInterval: 'readonly',
            clearTimeout: 'readonly',
            clearInterval: 'readonly',
            Promise: 'readonly',
         },
      },
      rules: {
         // Error prevention rules
         'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
         'no-undef': ['error'],
         'no-extra-semi': ['error'],
         'no-unreachable': ['error'],
         'no-empty': ['warn'],
         'no-constant-condition': ['warn'],
         'no-debugger': ['error'],
         'no-dupe-args': ['error'],
         'no-dupe-keys': ['error'],
         'no-duplicate-case': ['error'],
         'no-func-assign': ['error'],
         'no-invalid-regexp': ['error'],
         'no-irregular-whitespace': ['error'],
         'no-unexpected-multiline': ['error'],
         'use-isnan': ['error'],
         'valid-typeof': ['error'],

         // Style rules that work with Prettier
         'no-console': 'off', // Allow console in Node.js
         quotes: ['error', 'single', { avoidEscape: true }], // Match Prettier
         semi: ['error', 'always'], // Match Prettier
         'comma-dangle': ['error', 'only-multiline'], // Match Prettier trailingComma: es5
         indent: ['error', 3, { SwitchCase: 1 }], // Match our tab width preference
         'max-len': ['warn', { code: 100, ignoreUrls: true }], // Match Prettier printWidth

         // Best practices
         eqeqeq: ['error', 'always'],
         curly: ['error', 'all'],
         'no-var': 'error',
         'prefer-const': 'error',
      },
   },
   {
      files: ['public/**/*.js', 'views/**/*.js'],
      languageOptions: {
         ecmaVersion: 'latest',
         sourceType: 'script',
         globals: {
            // Browser globals
            window: 'readonly',
            document: 'readonly',
            navigator: 'readonly',
            location: 'readonly',
            history: 'readonly',
            console: 'readonly',
            alert: 'readonly',
            confirm: 'readonly',
            prompt: 'readonly',
            setTimeout: 'readonly',
            setInterval: 'readonly',
            clearTimeout: 'readonly',
            clearInterval: 'readonly',
            fetch: 'readonly',
            FormData: 'readonly',
            URL: 'readonly',
            Promise: 'readonly',
            // Custom app globals
            SchoolERP: 'readonly',
            setLoading: 'readonly',
            notify: 'readonly',
            bootstrap: 'readonly',
         },
      },
      rules: {
         'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
         'no-console': 'off',
         'no-undef': ['error'],
      },
   },
   {
      files: ['**/*.test.js', '**/*.spec.js', 'tests/**/*.js'],
      languageOptions: {
         globals: {
            describe: 'readonly',
            it: 'readonly',
            test: 'readonly',
            expect: 'readonly',
            beforeAll: 'readonly',
            afterAll: 'readonly',
            beforeEach: 'readonly',
            afterEach: 'readonly',
            jest: 'readonly',
            before: 'readonly',
            after: 'readonly',
         },
      },
   },
];
