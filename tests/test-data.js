// School ERP - Test Data Samples
// Use these JSON payloads for testing different scenarios

//=============================================================================
// VALID TEST DATA SAMPLES
//=============================================================================

// Valid Trust - Minimal Data
const minimalTrust = {
  name: "Minimal Test Trust",
  contactEmail: "minimal@test.edu",
};

// Valid Trust - Complete Data
const completeTrust = {
  name: "Complete Test School Trust",
  contactEmail: "admin@completeschool.edu",
  contactPhone: "+91-98765-43210",
  address: {
    street: "456 Education Avenue",
    city: "Learning City",
    state: "Knowledge State",
    zipCode: "567890",
    country: "India",
  },
  description: "A comprehensive educational trust with modern facilities",
};

// Valid Trust - With Optional Fields
const advancedTrust = {
  name: "Advanced Learning Trust",
  contactEmail: "contact@advancedlearning.edu",
  contactPhone: "+1-555-123-4567",
  website: "https://www.advancedlearning.edu",
  address: {
    street: "789 Innovation Drive",
    city: "Tech City",
    state: "Digital State",
    zipCode: "98765",
    country: "USA",
  },
  description: "Pioneering education through technology and innovation",
  establishedYear: 2020,
};

//=============================================================================
// INVALID TEST DATA SAMPLES (For Error Testing)
//=============================================================================

// Missing Required Fields
const missingName = {
  contactEmail: "missing-name@test.edu",
};

// Invalid Email Format
const invalidEmail = {
  name: "Invalid Email Trust",
  contactEmail: "invalid.email.format",
};

// Name Too Short
const shortName = {
  name: "AB",
  contactEmail: "valid@email.edu",
};

// Name Too Long
const longName = {
  name: "This is an extremely long trust name that definitely exceeds the maximum character limit",
  contactEmail: "valid@email.edu",
};

// Invalid Phone Format
const invalidPhone = {
  name: "Valid Trust Name",
  contactEmail: "valid@email.edu",
  contactPhone: "invalid-phone-format",
};

//=============================================================================
// AUTHENTICATION TEST DATA
//=============================================================================

// Valid Login
const validLogin = {
  username: "admin",
  password: "admin123",
};

// Invalid Credentials
const invalidLogin = {
  username: "wronguser",
  password: "wrongpassword",
};

// Password Change - Valid
const validPasswordChange = {
  currentPassword: "admin123",
  newPassword: "newSecurePassword123",
  confirmPassword: "newSecurePassword123",
};

//=============================================================================
// SECURITY TEST DATA
//=============================================================================

// XSS Test Payload
const xssPayload = {
  name: "<script>alert('XSS Test')</script>",
  contactEmail: "xss@test.edu",
  description: "<img src=x onerror=alert('XSS')>",
};

//=============================================================================
// EXPORT FOR TESTING
//=============================================================================

module.exports = {
  valid: {
    minimalTrust,
    completeTrust,
    advancedTrust,
    validLogin,
    validPasswordChange,
  },
  invalid: {
    missingName,
    invalidEmail,
    shortName,
    longName,
    invalidPhone,
    invalidLogin,
  },
  security: {
    xssPayload,
  },
};
