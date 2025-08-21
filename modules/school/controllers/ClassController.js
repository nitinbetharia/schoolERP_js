const ClassService = require("../services/ClassService");
const logger = require("../../../utils/logger");
const {
  formatErrorResponse,
  getErrorStatusCode,
  formatSuccessResponse,
} = require("../../../utils/errors");

/**
 * Class Controller
 * Handles HTTP requests for class management
 */
class ClassController {
  constructor() {
    this.service = new ClassService();
  }

  /**
   * Handle basic class operations
   */
  async handleRequest(req, res) {
    try {
      const result = await this.service.handleOperation(
        req.params.trustId,
        req.body,
      );
      res.json(formatSuccessResponse(result, "Class operation completed"));
    } catch (error) {
      logger.error("Class Controller Error", {
        controller: "class-controller",
        error: error.message,
      });

      const statusCode = getErrorStatusCode(error);
      res.status(statusCode).json(formatErrorResponse(error));
    }
  }

  /**
   * Get classes for a school
   */
  async getClasses(req, res) {
    try {
      const result = await this.service.handleOperation(req.params.trustId, {
        action: "getClasses",
        schoolId: req.params.schoolId,
      });
      res.json(formatSuccessResponse(result, "Classes retrieved successfully"));
    } catch (error) {
      logger.error("Class Controller getClasses Error", {
        controller: "class-controller",
        method: "getClasses",
        error: error.message,
      });

      const statusCode = getErrorStatusCode(error);
      res.status(statusCode).json(formatErrorResponse(error));
    }
  }
}

module.exports = ClassController;
