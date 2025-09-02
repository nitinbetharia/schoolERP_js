const request = require('supertest');
const path = require('path');

// Import the app from the parent directory
const serverPath = path.join(__dirname, '../../../server.js');

class TestHelper {
   constructor() {
      this.app = null;
      this.server = null;
      this.systemAuthToken = null;
      this.tenantAuthToken = null;
   }

   async initializeApp() {
      try {
      // Clear the require cache to ensure fresh app instance
         delete require.cache[serverPath];
      
         // Import and initialize the server
         const SchoolERPServer = require(serverPath);
      
         // If it's a class, instantiate it, otherwise use it directly
         if (typeof SchoolERPServer === 'function') {
            const serverInstance = new SchoolERPServer();
            await serverInstance.initialize();
            this.app = serverInstance.app;
         } else {
            this.app = SchoolERPServer;
         }
      
         return this.app;
      } catch (error) {
         console.error('Failed to initialize app for testing:', error);
         throw error;
      }
   }

   async startServer(port = 0) {
      if (!this.app) {
         await this.initializeApp();
      }
    
      return new Promise((resolve, reject) => {
         this.server = this.app.listen(port, (err) => {
            if (err) {reject(err);}
            else {resolve(this.server);}
         });
      });
   }

   async stopServer() {
      if (this.server) {
         return new Promise((resolve) => {
            this.server.close(resolve);
         });
      }
   }

   getRequest() {
      if (!this.app) {
         throw new Error('App not initialized. Call initializeApp() first.');
      }
      return request(this.app);
   }

   // Authentication helpers
   async authenticateSystemAdmin() {
      const response = await this.getRequest()
         .post('/api/v1/admin/system/auth/login')
         .send({
            username: 'admin',
            password: 'admin123'
         });

      if (response.status === 200) {
         this.systemAuthToken = response.headers['set-cookie'];
         return this.systemAuthToken;
      }
      throw new Error('Failed to authenticate system admin');
   }

   async authenticateTenantUser() {
      const response = await this.getRequest()
         .post('/api/v1/users/auth/login')
         .send({
            username: 'demo@user.com',
            password: 'demo123'
         });

      if (response.status === 200) {
         this.tenantAuthToken = response.headers['set-cookie'];
         return this.tenantAuthToken;
      }
      throw new Error('Failed to authenticate tenant user');
   }

   // Request builders with authentication
   systemRequest() {
      const req = this.getRequest();
      if (this.systemAuthToken) {
         req.set('Cookie', this.systemAuthToken);
      }
      return req;
   }

   tenantRequest() {
      const req = this.getRequest();
      if (this.tenantAuthToken) {
         req.set('Cookie', this.tenantAuthToken);
      }
      return req;
   }

   // Common assertions
   expectSuccessResponse(response, expectedStatus = 200) {
      expect(response.status).toBe(expectedStatus);
      expect(response.body).toHaveProperty('success', true);
      return response.body;
   }

   expectErrorResponse(response, expectedStatus = 400) {
      expect(response.status).toBe(expectedStatus);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      return response.body;
   }

   expectValidationError(response) {
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/validation|invalid|required/i);
      return response.body;
   }

   expectAuthenticationError(response) {
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/authentication|unauthorized|login/i);
      return response.body;
   }

   expectAuthorizationError(response) {
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/authorization|forbidden|access/i);
      return response.body;
   }

   expectNotFoundError(response) {
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/not found|404/i);
      return response.body;
   }
}

module.exports = new TestHelper();