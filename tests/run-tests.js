#!/usr/bin/env node

/**
 * Test Runner for SchoolERP Multi-tenant Authentication
 * Handles server startup, test execution, and cleanup
 */

const { spawn, exec } = require("child_process");
const path = require("path");
const fs = require("fs");

class TestRunner {
  constructor() {
    this.serverProcess = null;
    this.projectRoot = path.resolve(__dirname, "..");
    this.serverReady = false;
  }

  log(message) {
    console.log(`[TestRunner] ${new Date().toISOString()} - ${message}`);
  }

  error(message, error = null) {
    console.error(`[TestRunner] ERROR - ${message}`);
    if (error) {
      console.error(error);
    }
  }

  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async startServer() {
    this.log("Starting SchoolERP server...");

    return new Promise((resolve, reject) => {
      // Change to project root directory
      process.chdir(this.projectRoot);

      this.serverProcess = spawn("node", ["app.js"], {
        cwd: this.projectRoot,
        stdio: ["pipe", "pipe", "pipe"],
        shell: true,
      });

      this.serverProcess.stdout.on("data", (data) => {
        const output = data.toString();
        console.log(`[Server] ${output.trim()}`);

        // Check for server ready indicators
        if (
          output.includes("Server listening on port") ||
          output.includes("server started") ||
          output.includes("Application started")
        ) {
          this.serverReady = true;
          this.log("Server is ready for testing");
          resolve();
        }
      });

      this.serverProcess.stderr.on("data", (data) => {
        const output = data.toString();
        console.error(`[Server Error] ${output.trim()}`);
      });

      this.serverProcess.on("error", (error) => {
        this.error("Failed to start server", error);
        reject(error);
      });

      this.serverProcess.on("exit", (code) => {
        this.log(`Server process exited with code ${code}`);
        this.serverReady = false;
      });

      // Timeout after 15 seconds if server doesn't start
      setTimeout(() => {
        if (!this.serverReady) {
          this.log("Server startup timeout - proceeding with tests anyway");
          resolve(); // Proceed anyway in case server is already running
        }
      }, 15000);
    });
  }

  async stopServer() {
    if (this.serverProcess) {
      this.log("Stopping server...");
      this.serverProcess.kill("SIGTERM");
      await this.sleep(2000);

      if (!this.serverProcess.killed) {
        this.log("Force killing server...");
        this.serverProcess.kill("SIGKILL");
      }

      this.serverProcess = null;
      this.serverReady = false;
    }
  }

  async runTests() {
    this.log("Running authentication tests...");

    return new Promise((resolve, reject) => {
      const testProcess = spawn(
        "npx",
        [
          "mocha",
          "subdomain-auth.test.js",
          "--timeout",
          "10000",
          "--reporter",
          "spec",
        ],
        {
          cwd: path.join(this.projectRoot, "tests"),
          stdio: ["pipe", "pipe", "pipe"],
          shell: true,
        },
      );

      let testOutput = "";
      let errorOutput = "";

      testProcess.stdout.on("data", (data) => {
        const output = data.toString();
        console.log(output);
        testOutput += output;
      });

      testProcess.stderr.on("data", (data) => {
        const output = data.toString();
        console.error(output);
        errorOutput += output;
      });

      testProcess.on("close", (code) => {
        if (code === 0) {
          this.log("All tests completed successfully");
          resolve({ success: true, output: testOutput });
        } else {
          this.error(`Tests failed with exit code ${code}`);
          resolve({ success: false, output: testOutput, error: errorOutput });
        }
      });

      testProcess.on("error", (error) => {
        this.error("Failed to run tests", error);
        reject(error);
      });
    });
  }

  async checkDependencies() {
    const testDir = path.join(this.projectRoot, "tests");
    const packageJsonPath = path.join(testDir, "package.json");

    if (!fs.existsSync(packageJsonPath)) {
      this.error("Test package.json not found");
      return false;
    }

    // Check if node_modules exists in test directory
    const nodeModulesPath = path.join(testDir, "node_modules");
    if (!fs.existsSync(nodeModulesPath)) {
      this.log("Installing test dependencies...");

      return new Promise((resolve) => {
        const installProcess = spawn("npm", ["install"], {
          cwd: testDir,
          stdio: "inherit",
          shell: true,
        });

        installProcess.on("close", (code) => {
          if (code === 0) {
            this.log("Dependencies installed successfully");
            resolve(true);
          } else {
            this.error("Failed to install dependencies");
            resolve(false);
          }
        });

        installProcess.on("error", (error) => {
          this.error("Failed to install dependencies", error);
          resolve(false);
        });
      });
    }

    return true;
  }

  async run() {
    try {
      this.log("Starting SchoolERP test suite...");

      // Check and install dependencies
      const depsOk = await this.checkDependencies();
      if (!depsOk) {
        this.error("Failed to prepare test dependencies");
        process.exit(1);
      }

      // Start server
      await this.startServer();

      // Wait a bit more for server to be fully ready
      await this.sleep(3000);

      // Run tests
      const result = await this.runTests();

      // Stop server
      await this.stopServer();

      // Exit with appropriate code
      process.exit(result.success ? 0 : 1);
    } catch (error) {
      this.error("Test runner failed", error);
      await this.stopServer();
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new TestRunner();

  // Handle cleanup on exit signals
  process.on("SIGINT", async () => {
    console.log("\nReceived SIGINT, cleaning up...");
    await runner.stopServer();
    process.exit(130);
  });

  process.on("SIGTERM", async () => {
    console.log("\nReceived SIGTERM, cleaning up...");
    await runner.stopServer();
    process.exit(143);
  });

  runner.run();
}

module.exports = TestRunner;
