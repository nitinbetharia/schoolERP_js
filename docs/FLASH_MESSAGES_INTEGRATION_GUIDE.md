# Flash Messages Integration Guide

## 🎯 Overview

This guide explains how to use the enhanced flash messaging system in the School ERP application.

## 📦 Components Implemented

### 1. Enhanced Flash Middleware (`middleware/flash.js`)

- `setupFlashMessages()` - Basic flash message functionality
- `addFlashHelpers()` - API response integration and helper functions
- `handleAuthErrors()` - Authentication error handling
- `handleValidationErrors()` - Validation error handling

### 2. Flash Helper Functions

Available on `req` object in all routes:

```javascript
// Basic flash methods
req.flash('success', 'Operation successful!');
req.flash('error', 'Something went wrong!');
req.flash('warning', 'Please be careful!');
req.flash('info', 'Here is some information.');

// Convenience methods
req.flashSuccess('Success message');
req.flashError('Error message');
req.flashWarning('Warning message');
req.flashInfo('Info message');

// Validation error helper
req.flashValidationErrors(['Error 1', 'Error 2']); // Array
req.flashValidationErrors({ field1: 'Error 1', field2: 'Error 2' }); // Object
req.flashValidationErrors('Single error'); // String

// Response-based flash
req.flashResponse(true, 'Success message'); // success flash
req.flashResponse(false, 'Error message'); // error flash
req.flashResponse(false, 'Warning message', 'warning'); // custom type
```

## 🚀 Usage Examples

### Controller Integration

```javascript
// In any controller method
async function createUser(req, res, next) {
   try {
      const user = await userService.createUser(req.body);

      // Add success flash
      req.flashSuccess(`User '${user.name}' created successfully!`);

      res.status(201).json(formatSuccessResponse(user, 'User created'));
   } catch (error) {
      // Add error flash based on error type
      if (error.code === 'USER_EXISTS') {
         req.flashError('User with this email already exists.');
      } else if (error.code === 'VALIDATION_ERROR') {
         req.flashValidationErrors(error.details);
      } else {
         req.flashError('Failed to create user. Please try again.');
      }
      next(error);
   }
}
```

### Route Integration

```javascript
// In routes
router.post('/users', async (req, res) => {
   try {
      const user = await createUser(req.body);
      req.flashSuccess('User created successfully!');

      if (req.xhr) {
         // API response includes flash messages automatically
         res.json({ success: true, user });
      } else {
         // Web request redirects with flash
         res.redirect('/users');
      }
   } catch (error) {
      req.flashError('Failed to create user');
      if (req.xhr) {
         res.status(400).json({ success: false });
      } else {
         res.redirect('back');
      }
   }
});
```

## 🎨 Frontend Integration

### EJS Templates

Flash messages are automatically available in templates:

```html
<!-- Server-side flash messages (auto-rendered) -->
<%- include('./partials/flash-messages') %>

<!-- Toast notifications (for JavaScript) -->
<%- include('./partials/toast-notifications') %>

<!-- Flash helpers (for AJAX) -->
<%- include('./partials/flash-helpers') %>
```

### JavaScript Usage

```javascript
// Show immediate toast
FlashHelper.success('Data saved successfully!');
FlashHelper.error('Validation failed!');
FlashHelper.warning('Please review your input!');
FlashHelper.info('New updates available!');

// AJAX with flash support
FlashHelper.ajaxWithFlash('/api/users', {
   method: 'POST',
   body: JSON.stringify(userData),
}).then((response) => {
   // Flash messages shown automatically
   if (response.success) {
      window.location.reload();
   }
});

// Form submission with flash
document.getElementById('userForm').addEventListener('submit', function (e) {
   e.preventDefault();

   const formData = new FormData(this);

   FlashHelper.ajaxWithFlash('/api/users', {
      method: 'POST',
      body: formData,
   }).then((response) => {
      if (response.success) {
         this.reset(); // Form auto-reset on success
         // Flash message already shown
      }
   });
});
```

## 🔧 API Response Format

API responses automatically include flash messages:

```javascript
{
   "success": true,
   "message": "Operation successful",
   "data": {...},
   "flash": {
      "success": ["Operation completed successfully!"],
      "warning": ["Please review the changes."]
   }
}
```

## ⚙️ Configuration

### Middleware Setup (in `server.js` or main app file)

```javascript
const { setupFlashMessages, addFlashHelpers } = require('./middleware/flash');

// Basic flash setup (should be early in middleware stack)
app.use(setupFlashMessages);

// Enhanced API flash support (after session middleware)
app.use(addFlashHelpers);

// Error handling with flash (should be last)
app.use(handleAuthErrors);
app.use(handleValidationErrors);
```

### Error Handling Integration

```javascript
// Custom error handler
function errorHandler(err, req, res, next) {
   // Flash message automatically added based on error type
   if (err.code && err.userMessage) {
      req.flashError(err.userMessage);
   }

   // Continue with normal error handling
   next(err);
}
```

## 🎪 Flash Message Types

### Success Messages

- User login/logout
- Data creation/updates
- Operation completion
- File uploads

### Error Messages

- Authentication failures
- Validation errors
- Server errors
- Permission denied

### Warning Messages

- Account lockouts
- Session expiry warnings
- Data conflicts
- Incomplete operations

### Info Messages

- System announcements
- Feature notifications
- Process status updates
- Help information

## 🔄 Migration from Old System

### Before

```javascript
// Old way
res.json({ success: false, error: 'Login failed' });
req.flash('error', 'Login failed');
```

### After

```javascript
// New way
req.flashError('Invalid username or password. Please check your credentials.');
res.json({ success: false, error: 'Login failed' });
// Flash message automatically included in API response
```

## 🚨 Best Practices

1. **Use specific error messages**: Instead of generic "Error occurred", provide helpful context
2. **Handle different error types**: Check error codes and provide appropriate flash messages
3. **Include user actions**: Tell users what to do next ("Try again", "Contact support")
4. **Be consistent**: Use the same flash message patterns across similar operations
5. **Test both web and API**: Ensure flash messages work for both traditional and AJAX requests

## 🔍 Debugging

Enable flash message debugging:

```javascript
// Add to development config
if (process.env.NODE_ENV === 'development') {
   app.use((req, res, next) => {
      console.log('Flash messages:', req.session.flash);
      next();
   });
}
```

View flash messages in browser console:

```javascript
// In browser console
console.log(window.flashMessages); // Current page flash messages
```

## 🎉 Features Summary

✅ **Auto-dismiss with progress bars**  
✅ **Hover to pause auto-dismiss**  
✅ **Smooth slide animations**  
✅ **Multiple message stacking**  
✅ **AJAX-ready flash helpers**  
✅ **Mobile-responsive design**  
✅ **Bootstrap 5 integration**  
✅ **Cross-page flash persistence**  
✅ **Automatic API response integration**  
✅ **Error type-specific messaging**  
✅ **Validation error handling**  
✅ **Authentication error handling**
