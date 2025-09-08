const express = require('express');
const path = require('path');

const app = express();
const port = 3002;

// Set up EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Mock session middleware for login page
app.use((req, res, next) => {
   req.session = req.session || {};
   req.flash = (type, message) => console.log(`Flash ${type}: ${message}`);
   next();
});

// Login route
app.get('/auth/login', (req, res) => {
   res.render('pages/auth/login', {
      title: 'Login - SchoolERP',
      messages: {},
   });
});

// Root redirect to login
app.get('/', (req, res) => {
   res.redirect('/auth/login');
});

app.listen(port, () => {
   console.log(`✅ Minimal server running at http://localhost:${port}`);
   console.log(`🔗 Login page: http://localhost:${port}/auth/login`);
});
