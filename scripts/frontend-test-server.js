#!/usr/bin/env node

/**
 * Standalone Frontend Test Server
 * Tests Tailwind CSS, Font Awesome, and Alpine.js without database dependency
 */

const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');

const app = express();
const port = 3001;

// View engine setup
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views')); // Go up one level to find views directory
app.set('layout', 'layout');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Static files
app.use('/static', express.static(path.join(__dirname, '..', 'public'))); // Go up one level to find public directory

// Test route
app.get('/', (req, res) => {
   res.render('pages/test-frontend', {
      title: 'Frontend Test',
      subtitle: 'Testing Tailwind CSS, Font Awesome, and Alpine.js',
      user: null,
      tenant: null,
      description: 'Frontend testing page for School ERP System',
   });
});

// Test with mock authenticated user
app.get('/auth-test', (req, res) => {
   res.render('pages/test-frontend', {
      title: 'Frontend Test (Authenticated)',
      subtitle: 'Testing with mock authentication',
      user: {
         name: 'Test User',
         role: 'system-admin',
      },
      tenant: {
         name: 'Test School',
      },
      description: 'Frontend testing page with authentication',
   });
});

// Error handling
app.use((err, req, res, next) => {
   console.error('Error:', err);
   res.status(500).send(`Error: ${err.message}`);
});

// Start server
app.listen(port, () => {
   console.log('🎨 Frontend Test Server Started');
   console.log('================================');
   console.log(`📡 Server running on: http://localhost:${port}`);
   console.log('🎯 Test Pages:');
   console.log(`   • Frontend Test: http://localhost:${port}/`);
   console.log(`   • Auth Test: http://localhost:${port}/auth-test`);
   console.log('');
   console.log('✅ This server tests:');
   console.log('   • Tailwind CSS styling');
   console.log('   • Font Awesome icons');
   console.log('   • Alpine.js interactivity');
   console.log('   • Responsive design');
   console.log('   • Single layout system');
   console.log('');
   console.log('🔄 Press Ctrl+C to stop the server');
});
