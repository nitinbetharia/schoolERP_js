/**
 * Login Page Rendering Test
 * Tests the login page template and route functionality
 */

const { describe, test, expect } = require('@jest/globals');
const request = require('supertest');
const express = require('express');
const path = require('path');

describe('Login Page Rendering', () => {
   let app;

   beforeAll(() => {
      app = express();

      // Set up basic EJS configuration like in the main app
      app.set('view engine', 'ejs');
      app.set('views', path.join(__dirname, '../views'));

      // Mock flash middleware
      app.use((req, res, next) => {
         req.flash = (type, message) => [];
         next();
      });

      // Basic login route for testing
      app.get('/login', (req, res) => {
         try {
            const renderData = {
               title: 'Login',
               description: 'Sign in to your School ERP account',
               subtitle: 'Access your educational management system',
               tenant: null,
               user: null,
               success: [],
               error: [],
               warning: [],
               info: [],
            };

            res.render('pages/auth/login', {
               ...renderData,
               layout: false, // Don't use layout for test
            });
         } catch (error) {
            res.status(500).json({ error: error.message });
         }
      });
   });

   test('Login page should render without errors', async () => {
      const response = await request(app).get('/login').expect(200);

      // Check if response contains expected HTML elements
      expect(response.text).toContain('<form');
      expect(response.text).toContain('id="loginForm"');
      expect(response.text).toContain('Welcome Back');
   });

   test('Login page should contain required form fields', async () => {
      const response = await request(app).get('/login').expect(200);

      // Check for essential form elements
      expect(response.text).toContain('name="email"');
      expect(response.text).toContain('name="password"');
      expect(response.text).toContain('type="submit"');
   });

   test('Login page should include proper CSS classes', async () => {
      const response = await request(app).get('/login').expect(200);

      // Check for Bootstrap classes
      expect(response.text).toContain('form-control');
      expect(response.text).toContain('btn-brand-primary');
      expect(response.text).toContain('card');
   });
});

module.exports = { app };
