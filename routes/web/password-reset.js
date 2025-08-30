const express = require('express');
const { logSystem, logError } = require('../../utils/logger');
const { systemAuthService } = require('../../services/systemServices');
const userService = require('../../modules/users/services/userService');

/**
 * Password Reset Routes Module
 * Handles forgot password and password reset functionality
 * Separated from auth.js to maintain file size standards (~200 lines)
 */

module.exports = function (_middleware) {
   const router = express.Router();

   /**
    * @route GET /forgot-password
    * @desc Render forgot password page
    * @access Public
    */
   router.get('/forgot-password', (req, res) => {
      try {
         // If user is already logged in, redirect to dashboard
         if (req.session && req.session.user) {
            return res.redirect('/dashboard');
         }

         res.render('pages/auth/forgot-password', {
            title: 'Forgot Password',
            description: 'Reset your password for School ERP System',
            tenant: req.tenant || null,
            layout: 'layout',
         });
      } catch (error) {
         logError(error, { context: 'ForgotPasswordPage' });
         req.flash('error', 'Unable to load password reset page. Please try again.');
         res.redirect('/login');
      }
   });

   /**
    * @route POST /forgot-password
    * @desc Process forgot password request
    * @access Public
    */
   router.post('/forgot-password', async (req, res) => {
      try {
         const { email } = req.body;

         // Validate email
         if (!email) {
            if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
               return res.json({
                  success: false,
                  error: 'Email address is required',
               });
            }
            req.flash('error', 'Email address is required');
            return res.redirect('/forgot-password');
         }

         // Email format validation
         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
         if (!emailRegex.test(email)) {
            if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
               return res.json({
                  success: false,
                  error: 'Please enter a valid email address',
               });
            }
            req.flash('error', 'Please enter a valid email address');
            return res.redirect('/forgot-password');
         }

         // Check if email exists in system or tenant
         let user = null;
         let userType = null;

         try {
            // First check system users
            const systemUser = await systemAuthService.findUserByEmail(email);
            if (systemUser) {
               user = systemUser;
               userType = 'system';
            } else if (req.tenant) {
               // Check tenant users if on a tenant subdomain
               const tenantUser = await userService.findUserByEmail(email, req.tenant.id);
               if (tenantUser) {
                  user = tenantUser;
                  userType = 'tenant';
               }
            }

            // Generate password reset token if user exists
            if (user) {
               const resetToken = await (userType === 'system'
                  ? systemAuthService.generatePasswordResetToken(user.id)
                  : userService.generatePasswordResetToken(user.id, req.tenant.id));

               // Send password reset email
               const emailService = require('../../services/emailService');
               await emailService.sendPasswordResetEmail(user, resetToken, req.tenant);

               logSystem('Password reset requested', {
                  userId: user.id,
                  email: user.email,
                  userType,
                  tenantId: req.tenant?.id,
                  ip: req.ip,
               });
            }
         } catch (error) {
            logError(error, {
               context: 'ForgotPasswordProcess',
               email: email,
               tenantId: req.tenant?.id,
            });
            // Continue to success message for security
         }

         // Always return success message for security
         const successMessage =
            'If an account with this email exists, you will receive ' + 'password reset instructions shortly.';

         if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
            return res.json({
               success: true,
               message: successMessage,
            });
         }

         req.flash('success', successMessage);
         res.redirect('/forgot-password');
      } catch (error) {
         logError(error, { context: 'ForgotPasswordError' });

         const errorMsg = 'Unable to process password reset request. Please try again.';
         if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
            return res.status(500).json({
               success: false,
               error: errorMsg,
            });
         }

         req.flash('error', errorMsg);
         res.redirect('/forgot-password');
      }
   });

   /**
    * @route GET /reset-password/:token
    * @desc Render password reset page with token validation
    * @access Public
    */
   router.get('/reset-password/:token', async (req, res) => {
      try {
         const { token } = req.params;

         // If user is already logged in, redirect to dashboard
         if (req.session && req.session.user) {
            return res.redirect('/dashboard');
         }

         if (!token) {
            req.flash('error', 'Invalid password reset link');
            return res.redirect('/forgot-password');
         }

         // Validate token
         let tokenValid = false;
         let user = null;

         try {
            // Check system users first
            const systemReset = await systemAuthService.validatePasswordResetToken(token);
            if (systemReset) {
               tokenValid = true;
               user = systemReset.user;
            } else if (req.tenant) {
               // Check tenant users
               const tenantReset = await userService.validatePasswordResetToken(token, req.tenant.id);
               if (tenantReset) {
                  tokenValid = true;
                  user = tenantReset.user;
               }
            }
         } catch (error) {
            logError(error, {
               context: 'ResetTokenValidation',
               token: token.substring(0, 10) + '...', // Log partial token for security
               tenantId: req.tenant?.id,
            });
         }

         res.render('pages/auth/reset-password', {
            title: 'Reset Password',
            description: 'Create a new password for your account',
            tenant: req.tenant || null,
            layout: 'layout',
            token,
            tokenValid,
            user: user ? { name: user.name, email: user.email } : null,
         });
      } catch (error) {
         logError(error, { context: 'ResetPasswordPage' });
         req.flash('error', 'Unable to load password reset page. Please try again.');
         res.redirect('/forgot-password');
      }
   });

   /**
    * @route POST /reset-password/:token
    * @desc Process password reset with new password
    * @access Public
    */
   router.post('/reset-password/:token', async (req, res) => {
      try {
         const { token } = req.params;
         const { password, confirmPassword } = req.body;

         // Validate input
         if (!token) {
            const errorMsg = 'Invalid password reset link';
            if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
               return res.json({ success: false, error: errorMsg });
            }
            req.flash('error', errorMsg);
            return res.redirect('/forgot-password');
         }

         if (!password || !confirmPassword) {
            const errorMsg = 'Both password fields are required';
            if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
               return res.json({ success: false, error: errorMsg });
            }
            req.flash('error', errorMsg);
            return res.redirect(`/reset-password/${token}`);
         }

         if (password !== confirmPassword) {
            const errorMsg = 'Passwords do not match';
            if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
               return res.json({ success: false, error: errorMsg });
            }
            req.flash('error', errorMsg);
            return res.redirect(`/reset-password/${token}`);
         }

         // Validate password strength
         if (password.length < 8) {
            const errorMsg = 'Password must be at least 8 characters long';
            if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
               return res.json({ success: false, error: errorMsg });
            }
            req.flash('error', errorMsg);
            return res.redirect(`/reset-password/${token}`);
         }

         // Attempt to reset password
         let resetResult = null;
         let userType = null;

         try {
            // Try system users first
            resetResult = await systemAuthService.resetPassword(token, password);
            if (resetResult) {
               userType = 'system';
            } else if (req.tenant) {
               // Try tenant users
               resetResult = await userService.resetPassword(token, password, req.tenant.id);
               if (resetResult) {
                  userType = 'tenant';
               }
            }
         } catch (error) {
            logError(error, {
               context: 'PasswordResetProcess',
               token: token.substring(0, 10) + '...',
               tenantId: req.tenant?.id,
            });
         }

         if (!resetResult) {
            const errorMsg = 'Password reset link is invalid or has expired. ' + 'Please request a new one.';
            if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
               return res.json({ success: false, error: errorMsg });
            }
            req.flash('error', errorMsg);
            return res.redirect('/forgot-password');
         }

         // Log successful password reset
         logSystem('Password reset completed', {
            userId: resetResult.user.id,
            email: resetResult.user.email,
            userType,
            tenantId: req.tenant?.id,
            ip: req.ip,
         });

         // Success response
         const successMessage =
            'Your password has been successfully reset. ' + 'You can now login with your new password.';

         if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
            return res.json({
               success: true,
               message: successMessage,
            });
         }

         req.flash('success', successMessage);
         res.redirect('/login');
      } catch (error) {
         logError(error, { context: 'ResetPasswordError' });

         const errorMsg = 'Unable to reset password. Please try again.';
         if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
            return res.status(500).json({
               success: false,
               error: errorMsg,
            });
         }

         req.flash('error', errorMsg);
         res.redirect(`/reset-password/${req.params.token}`);
      }
   });

   return router;
};
