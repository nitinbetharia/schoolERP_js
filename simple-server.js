// Simple server to test login page rendering without database
const express = require('express');
const path = require('path');

const app = express();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple route to test login page
app.get('/auth/login', (req, res) => {
   try {
      res.render('pages/auth/login', {
         title: 'Login - School ERP',
         description: 'School ERP System Login',
         error: null,
         success: null,
         tenant: {
            name: 'School ERP Demo',
            branding: {
               logo: null, // No logo for simple demo
               primaryColor: '#007bff',
            },
            schools: [], // Empty schools array
         },
         messages: {
            error: null,
            success: null,
         },
         user: null,
         hideNav: true,
         hideFooter: true,
      });
   } catch (error) {
      console.error('Error rendering login page:', error);
      res.status(500).send('Error loading login page: ' + error.message);
   }
});

// Handle login POST for testing (just return success)
app.post('/login', (req, res) => {
   res.json({
      success: true,
      message: 'Login successful (demo mode)',
      redirect: '/dashboard',
   });
});

app.get('/login', (req, res) => {
   res.redirect('/auth/login');
});

app.get('/', (req, res) => {
   res.redirect('/auth/login');
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
   console.log(`✅ Simple server running on port ${PORT}`);
   console.log(`🌐 Login page available at: http://localhost:${PORT}/auth/login`);
   console.log(`📝 Server started at: ${new Date().toISOString()}`);
});

process.on('uncaughtException', (error) => {
   console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
   console.error('❌ Unhandled Rejection:', error);
});
