/**
 * Simple HTTP Test Suite for SchoolERP Authentication
 * Tests the login and routing functionality without interfering with server
 */

const http = require("http");
const https = require("https");

class SimpleHttpTester {
  constructor() {
    this.baseHost = "localhost";
    this.basePort = 3000;
    this.results = [];
  }

  log(message, level = "info") {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    console.log(logMessage);

    if (level === "result") {
      this.results.push(message);
    }
  }

  async makeRequest(options, postData = null) {
    return new Promise((resolve) => {
      const req = http.request(options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: jsonData,
              success: true,
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: data,
              success: true,
            });
          }
        });
      });

      req.on("error", (error) => {
        resolve({
          statusCode: 0,
          error: error.message,
          success: false,
        });
      });

      req.setTimeout(5000, () => {
        resolve({
          statusCode: 0,
          error: "Request timeout",
          success: false,
        });
      });

      if (postData) {
        req.write(JSON.stringify(postData));
      }

      req.end();
    });
  }

  async testSystemStatus() {
    this.log("Testing system status endpoint");

    const options = {
      hostname: this.baseHost,
      port: this.basePort,
      path: "/api/v1/status",
      method: "GET",
      headers: {
        "User-Agent": "SchoolERP-Tester/1.0",
      },
    };

    const result = await this.makeRequest(options);

    if (result.success && result.statusCode === 200) {
      this.log("✅ System status test passed", "result");
      this.log(`Response: ${JSON.stringify(result.data)}`);
    } else {
      this.log(
        `❌ System status test failed: ${result.error || result.statusCode}`,
        "result",
      );
    }

    return result;
  }

  async testSystemHealth() {
    this.log("Testing system health endpoint");

    const options = {
      hostname: this.baseHost,
      port: this.basePort,
      path: "/api/v1/admin/system/health",
      method: "GET",
      headers: {
        "User-Agent": "SchoolERP-Tester/1.0",
      },
    };

    const result = await this.makeRequest(options);

    if (result.success) {
      this.log(
        `✅ System health test completed (Status: ${result.statusCode})`,
        "result",
      );
      if (result.data && typeof result.data === "object") {
        this.log(`Response: ${JSON.stringify(result.data)}`);
      }
    } else {
      this.log(`❌ System health test failed: ${result.error}`, "result");
    }

    return result;
  }

  async testSubdomainDetection(subdomain) {
    this.log(`Testing subdomain detection for: ${subdomain}`);

    const options = {
      hostname: this.baseHost,
      port: this.basePort,
      path: "/api/v1/users",
      method: "GET",
      headers: {
        Host: `${subdomain}.example.com:3000`,
        "User-Agent": "SchoolERP-Tester/1.0",
      },
    };

    const result = await this.makeRequest(options);

    if (result.success) {
      this.log(
        `✅ Subdomain ${subdomain} test completed (Status: ${result.statusCode})`,
        "result",
      );
      if (result.data && typeof result.data === "object") {
        this.log(`Response: ${JSON.stringify(result.data, null, 2)}`);
      }
    } else {
      this.log(
        `❌ Subdomain ${subdomain} test failed: ${result.error}`,
        "result",
      );
    }

    return result;
  }

  async testSystemAdminAuth() {
    this.log("Testing system admin authentication");

    const loginData = {
      username: "admin",
      password: "admin123",
    };

    const options = {
      hostname: this.baseHost,
      port: this.basePort,
      path: "/api/v1/admin/system/auth/login",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(JSON.stringify(loginData)),
        "User-Agent": "SchoolERP-Tester/1.0",
      },
    };

    const result = await this.makeRequest(options, loginData);

    if (result.success && result.statusCode === 200) {
      this.log("✅ System admin authentication test passed", "result");
      if (result.data && result.data.data && result.data.data.user) {
        this.log(`Authenticated as: ${result.data.data.user.username}`);
      }
    } else if (result.success && result.statusCode === 401) {
      this.log(
        "⚠️  System admin authentication failed (401 - check credentials)",
        "result",
      );
    } else {
      this.log(
        `❌ System admin authentication test failed: ${result.error || result.statusCode}`,
        "result",
      );
    }

    return result;
  }

  async runAllTests() {
    this.log("🚀 Starting SchoolERP Authentication Test Suite");
    this.log("=".repeat(50));

    const tests = [
      { name: "System Status", fn: () => this.testSystemStatus() },
      { name: "System Health", fn: () => this.testSystemHealth() },
      {
        name: "Trust001 Subdomain",
        fn: () => this.testSubdomainDetection("trust001"),
      },
      { name: "Demo Subdomain", fn: () => this.testSubdomainDetection("demo") },
      {
        name: "Invalid Subdomain",
        fn: () => this.testSubdomainDetection("nonexistent"),
      },
      { name: "System Admin Auth", fn: () => this.testSystemAdminAuth() },
    ];

    for (const test of tests) {
      this.log(`\n📋 Running test: ${test.name}`);
      this.log("-".repeat(30));

      try {
        await test.fn();
      } catch (error) {
        this.log(
          `❌ Test ${test.name} threw error: ${error.message}`,
          "result",
        );
      }

      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    this.log("\n🎯 Test Summary");
    this.log("=".repeat(30));
    this.results.forEach((result) => {
      this.log(result);
    });

    this.log("\n🏁 Test suite completed!");
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new SimpleHttpTester();
  tester
    .runAllTests()
    .then(() => {
      console.log("\nTest execution finished");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Test suite failed:", error);
      process.exit(1);
    });
}

module.exports = SimpleHttpTester;
