###

### School ERP - Test Data Samples

### Use these JSON payloads for testing different scenarios

###

###############################################################################

### VALID TEST DATA SAMPLES

###############################################################################

### Valid Trust - Minimal Data

{
"name": "Minimal Test Trust",
"contactEmail": "minimal@test.edu"
}

### Valid Trust - Complete Data

{
"name": "Complete Test School Trust",
"contactEmail": "admin@completeschool.edu",
"contactPhone": "+91-98765-43210",
"address": {
"street": "456 Education Avenue",
"city": "Learning City",
"state": "Knowledge State",
"zipCode": "567890",
"country": "India"
},
"description": "A comprehensive educational trust with modern facilities and experienced faculty"
}

### Valid Trust - With Optional Fields

{
"name": "Advanced Learning Trust",
"contactEmail": "contact@advancedlearning.edu",
"contactPhone": "+1-555-123-4567",
"website": "https://www.advancedlearning.edu",
"address": {
"street": "789 Innovation Drive",
"city": "Tech City",
"state": "Digital State",
"zipCode": "98765",
"country": "USA"
},
"description": "Pioneering education through technology and innovation",
"establishedYear": 2020
}

###############################################################################

### INVALID TEST DATA SAMPLES (For Error Testing)

###############################################################################

### Missing Required Fields

{
"contactEmail": "missing-name@test.edu"
}

### Invalid Email Format

{
"name": "Invalid Email Trust",
"contactEmail": "invalid.email.format"
}

### Name Too Short

{
"name": "AB",
"contactEmail": "valid@email.edu"
}

### Name Too Long

{
"name": "This is an extremely long trust name that definitely exceeds the maximum character limit allowed for trust names in the School ERP system database schema",
"contactEmail": "valid@email.edu"
}

### Invalid Phone Format

{
"name": "Valid Trust Name",
"contactEmail": "valid@email.edu",
"contactPhone": "invalid-phone-format"
}

### Invalid Website URL

{
"name": "Valid Trust Name",
"contactEmail": "valid@email.edu",
"website": "not-a-valid-url"
}

### Empty Required Fields

{
"name": "",
"contactEmail": ""
}

### Invalid Address Data

{
"name": "Valid Trust Name",
"contactEmail": "valid@email.edu",
"address": {
"street": "",
"zipCode": "invalid-zip"
}
}

###############################################################################

### UPDATE TEST DATA SAMPLES

###############################################################################

### Partial Update

{
"description": "Updated description only"
}

### Complete Update

{
"name": "Completely Updated Trust Name",
"contactEmail": "newemail@updated.edu",
"contactPhone": "+1-999-888-7777",
"website": "https://www.updatedtrust.edu",
"address": {
"street": "999 Updated Street",
"city": "New City",
"state": "New State",
"zipCode": "99999",
"country": "Updated Country"
},
"description": "This trust has been completely updated with new information"
}

### Invalid Update Data

{
"contactEmail": "invalid.email.format",
"contactPhone": "invalid-phone"
}

###############################################################################

### AUTHENTICATION TEST DATA

###############################################################################

### Valid Login

{
"username": "admin",
"password": "admin123"
}

### Invalid Credentials

{
"username": "wronguser",
"password": "wrongpassword"
}

### Missing Password

{
"username": "admin"
}

### Missing Username

{
"password": "admin123"
}

### Empty Credentials

{
"username": "",
"password": ""
}

### Password Change - Valid

{
"currentPassword": "admin123",
"newPassword": "newSecurePassword123",
"confirmPassword": "newSecurePassword123"
}

### Password Change - Mismatched Confirmation

{
"currentPassword": "admin123",
"newPassword": "newPassword123",
"confirmPassword": "differentPassword123"
}

### Password Change - Weak New Password

{
"currentPassword": "admin123",
"newPassword": "123",
"confirmPassword": "123"
}

###############################################################################

### SECURITY TEST DATA (XSS, Injection, etc.)

###############################################################################

### XSS Test Payload

{
"name": "<script>alert('XSS Test')</script>",
"contactEmail": "xss@test.edu",
"description": "<img src=x onerror=alert('XSS')>"
}

### HTML Injection Test

{
"name": "<h1>HTML Injection</h1>",
"contactEmail": "html@test.edu",
"description": "<div style='background:red'>Styled content</div>"
}

### SQL Injection Attempt (in search)

# Use in query parameters: ?search='; DROP TABLE trusts; --

### Large Payload Test

{
"name": "Large Payload Test Trust",
"contactEmail": "large@test.edu",
"description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt."
}

###############################################################################

### QUERY PARAMETER TEST SAMPLES

###############################################################################

### Pagination Examples

# ?page=1&limit=10

# ?page=2&limit=5

# ?page=1&limit=100

### Sorting Examples

# ?sortBy=name&sortOrder=asc

# ?sortBy=createdAt&sortOrder=desc

# ?sortBy=status&sortOrder=asc

### Search Examples

# ?search=School

# ?search=Test

# ?search=Green Valley

### Filter Examples

# ?status=ACTIVE

# ?status=INACTIVE

# ?status=SETUP_PENDING

### Combined Parameters

# ?page=1&limit=5&sortBy=name&sortOrder=asc&search=School&status=ACTIVE

### Invalid Parameter Examples

# ?page=-1&limit=0

# ?sortBy=invalidField&sortOrder=invalidOrder

# ?status=INVALID_STATUS
