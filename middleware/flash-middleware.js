/**
 * Flash Message Middleware
 * Session-based message storage for redirects
 */

/**
 * Add flash message methods to request object
 */
const flashMiddleware = (req, res, next) => {
  // Initialize flash messages in session if not exists
  if (!req.session.flash) {
    req.session.flash = {};
  }
  
  // Method to set flash message
  req.flash = (type, message) => {
    if (!req.session.flash[type]) {
      req.session.flash[type] = [];
    }
    req.session.flash[type].push(message);
  };
  
  // Method to get and clear flash messages
  req.getFlash = (type) => {
    const messages = req.session.flash[type] || [];
    delete req.session.flash[type];
    return messages;
  };
  
  // Method to get all flash messages and clear them
  req.getAllFlash = () => {
    const allMessages = { ...req.session.flash };
    req.session.flash = {};
    return allMessages;
  };
  
  // Add flash messages to response locals for templates
  res.locals.flashMessages = req.getAllFlash();
  
  next();
};

module.exports = flashMiddleware;