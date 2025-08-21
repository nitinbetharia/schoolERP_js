const request = require("supertest");
const SchoolERPServer = require("../server");

/**
 * Ensure system admin exists for testing
 */
async function ensureSystemAdminExists() {
  try {
    const { systemAuthService } = require("../services/systemServices");
    const { initializeSystemModels, getSystemModels } = require("../models");

    // Initialize system models first
    await initializeSystemModels();
    const systemModels = await getSystemModels();

    if (!systemModels.SystemUser) {
      throw new Error("SystemUser model not available after initialization");
    }

    const existingAdmin = await systemModels.SystemUser.findOne({
      where: { username: "admin" },
    });

    if (!existingAdmin) {
      const systemAdmin = {
        username: "admin",
        email: "admin@system.local",
        password: "admin123",
        full_name: "System Administrator",
      };

      await systemAuthService.createSystemUser(systemAdmin);
      console.log("✅ Test system admin created");
    } else {
      console.log("✅ Test system admin already exists");
    }
  } catch (error) {
    console.error("❌ Failed to ensure system admin exists:", error.message);
    // Don't throw - let tests run and fail naturally if auth doesn't work
  }
}

describe("Phase 1A & 1B - Foundation Layer", () => {
  let app;
  let server;

  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = "test";

    server = new SchoolERPServer();
    await server.initialize();
    app = server.app;

    // Ensure system admin exists for tests
    await ensureSystemAdminExists();
  }, 30000); // Increase timeout for database setup

  afterAll(async () => {
    if (server.server) {
      server.server.close();
    }

    // Close database connections
    const { dbManager } = require("../models/database");
    await dbManager.closeAllConnections();
  });

  describe("Health Check & System Status", () => {
    test("GET /api/v1/admin/system/health should return system health", async () => {
      const response = await request(app)
        .get("/api/v1/admin/system/health")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("status", "healthy");
      expect(response.body.data).toHaveProperty("database");
      expect(response.body.data).toHaveProperty("models");
    });

    test("GET /api/v1/status should return API status", async () => {
      const response = await request(app).get("/api/v1/status").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("School ERP API is running");
    });
  });

  describe("System Authentication", () => {
    let authCookie;

    test("POST /api/v1/admin/system/auth/login with invalid credentials should fail", async () => {
      const response = await request(app)
        .post("/api/v1/admin/system/auth/login")
        .send({
          username: "invalid",
          password: "invalid",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("AUTH_001");
    });

    test("POST /api/v1/admin/system/auth/login with valid credentials should succeed", async () => {
      const response = await request(app)
        .post("/api/v1/admin/system/auth/login")
        .send({
          username: "admin",
          password: "admin123",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("username", "admin");
      expect(response.body.data).toHaveProperty("role", "SYSTEM_ADMIN");

      // Store auth cookie for subsequent tests
      authCookie = response.headers["set-cookie"];
    });

    test("GET /api/v1/admin/system/profile should return current user profile", async () => {
      const response = await request(app)
        .get("/api/v1/admin/system/profile")
        .set("Cookie", authCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("username", "admin");
    });

    test("POST /api/v1/admin/system/auth/logout should logout successfully", async () => {
      const response = await request(app)
        .post("/api/v1/admin/system/auth/logout")
        .set("Cookie", authCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Logout successful");
    });
  });

  describe("Trust Management", () => {
    let authCookie;
    let trustId;

    beforeAll(async () => {
      // Login first
      const loginResponse = await request(app)
        .post("/api/v1/admin/system/auth/login")
        .send({
          username: "admin",
          password: "admin123",
        });

      authCookie = loginResponse.headers["set-cookie"];
    });

    test("POST /api/v1/admin/system/trusts should create a new trust", async () => {
      const timestamp = Date.now();
      const trustData = {
        trust_name: `Demo Trust ${timestamp}`,
        trust_code: `demo_${timestamp}`,
        subdomain: `demo${timestamp}`,
        contact_email: `admin${timestamp}@demo.school`,
        contact_phone: "9876543210",
        address: "Demo Address",
      };

      const response = await request(app)
        .post("/api/v1/admin/system/trusts")
        .set("Cookie", authCookie)
        .send(trustData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty(
        "trust_name",
        `Demo Trust ${timestamp}`,
      );
      expect(response.body.data).toHaveProperty("status", "SETUP_PENDING");

      trustId = response.body.data.id;
    });

    test("GET /api/v1/admin/system/trusts should list all trusts", async () => {
      const response = await request(app)
        .get("/api/v1/admin/system/trusts")
        .set("Cookie", authCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toHaveProperty("pagination");
    });

    test("GET /api/v1/admin/system/trusts/:id should get trust by ID", async () => {
      const response = await request(app)
        .get(`/api/v1/admin/system/trusts/${trustId}`)
        .set("Cookie", authCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("id", trustId);
    });

    test("PUT /api/v1/admin/system/trusts/:id should update trust", async () => {
      const updateData = {
        trust_name: "Updated Demo Trust",
        contact_phone: "9876543211",
      };

      const response = await request(app)
        .put(`/api/v1/admin/system/trusts/${trustId}`)
        .set("Cookie", authCookie)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty(
        "trust_name",
        "Updated Demo Trust",
      );
    });

    test("POST /api/v1/admin/system/trusts/:id/complete-setup should complete setup", async () => {
      const response = await request(app)
        .post(`/api/v1/admin/system/trusts/${trustId}/complete-setup`)
        .set("Cookie", authCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("status", "ACTIVE");
    });
  });

  describe("Database & Models", () => {
    test("Database manager should have system connection", async () => {
      const { dbManager } = require("../models/database");
      const health = await dbManager.healthCheck();

      expect(health.systemDB).toBe(true);
    });

    test("System models should be initialized", async () => {
      const { modelRegistry } = require("../models");
      const health = await modelRegistry.healthCheck();

      expect(health.systemModels).toBeGreaterThan(0);
      expect(health.initialized).toBe(true);
    });
  });
});

module.exports = {};
