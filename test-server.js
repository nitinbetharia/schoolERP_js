// Quick server test
const express = require('express');
const path = require('path');

console.log('Starting quick test server...');

const app = express();
const PORT = 3004;

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Test route
app.get('/test', (req, res) => {
   res.send('<h1>Server is working!</h1><p>Time: ' + new Date().toISOString() + '</p>');
});

// Login route with all required variables
app.get('/auth/login', (req, res) => {
   console.log('Login route accessed');

   const templateData = {
      title: 'Login - School ERP',
      description: 'School ERP System Login',
      error: null,
      success: null,
      tenant: {
         name: 'Demo School',
         branding: {
            logo: null,
            primaryColor: '#007bff',
         },
         schools: [],
      },
      messages: {
         error: null,
         success: null,
      },
      user: null,
      hideNav: true,
      hideFooter: true,
   };

   console.log('Rendering with data:', JSON.stringify(templateData, null, 2));

   try {
      res.render('pages/auth/login', templateData);
   } catch (error) {
      console.error('Template error:', error);
      res.status(500).send('<h1>Template Error</h1><pre>' + error.message + '</pre>');
   }
});

app.listen(PORT, () => {
   console.log(`✅ Test server running on http://localhost:${PORT}`);
   console.log(`🔗 Test URL: http://localhost:${PORT}/test`);
   console.log(`🔐 Login URL: http://localhost:${PORT}/auth/login`);
});
