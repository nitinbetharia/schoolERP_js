const SchoolService = require("../services/SchoolService");
const logger = require("../../../utils/logger");
const {
  ErrorFactory,
  formatErrorResponse,
  getErrorStatusCode,
  formatSuccessResponse,
} = require("../../../utils/errors");

/**
 * School Controller
 * Handles HTTP requests for school management
 */
class SchoolController {
  constructor() {
    this.service = new SchoolService();
  }

  /**
   * Create a new school
   */
  async createSchool(req, res) {
    try {
      const trustId = req.params.trustId || req.trust?.id;
      const schoolData = req.body;

      if (!trustId) {
        return res
          .status(400)
          .json(
            formatErrorResponse(
              ErrorFactory.createClientError("Trust ID is required"),
            ),
          );
      }

      const school = await this.service.createSchool(trustId, schoolData);

      res
        .status(201)
        .json(formatSuccessResponse(school, "School created successfully"));
    } catch (error) {
      logger.error("School Controller createSchool Error", {
        controller: "school-controller",
        method: "createSchool",
        error: error.message,
      });

      const statusCode = getErrorStatusCode(error);
      res.status(statusCode).json(formatErrorResponse(error));
    }
  }

  /**
   * Get all schools for a trust
   */
  async getSchools(req, res) {
    try {
      const trustId = req.params.trustId || req.trust?.id;

      if (!trustId) {
        return res
          .status(400)
          .json(
            formatErrorResponse(
              ErrorFactory.createClientError("Trust ID is required"),
            ),
          );
      }

      const schools = await this.service.getSchools(trustId, req.query);

      res.json(
        formatSuccessResponse(schools, "Schools retrieved successfully"),
      );
    } catch (error) {
      logger.error("School Controller getSchools Error", {
        controller: "school-controller",
        method: "getSchools",
        error: error.message,
      });

      const statusCode = getErrorStatusCode(error);
      res.status(statusCode).json(formatErrorResponse(error));
    }
  }

  /**
   * Get school by ID
   */
  async getSchoolById(req, res) {
    try {
      const trustId = req.params.trustId || req.trust?.id;
      const schoolId = req.params.id;

      if (!trustId) {
        return res
          .status(400)
          .json(
            formatErrorResponse(
              ErrorFactory.createClientError("Trust ID is required"),
            ),
          );
      }

      const school = await this.service.getSchoolById(trustId, schoolId);

      res.json(formatSuccessResponse(school, "School retrieved successfully"));
    } catch (error) {
      logger.error("School Controller getSchoolById Error", {
        controller: "school-controller",
        method: "getSchoolById",
        error: error.message,
      });

      const statusCode = getErrorStatusCode(error);
      res.status(statusCode).json(formatErrorResponse(error));
    }
  }

  /**
   * Update school
   */
  async updateSchool(req, res) {
    try {
      const trustId = req.params.trustId || req.trust?.id;
      const schoolId = req.params.id;
      const updateData = req.body;

      if (!trustId) {
        return res
          .status(400)
          .json(
            formatErrorResponse(
              ErrorFactory.createClientError("Trust ID is required"),
            ),
          );
      }

      const school = await this.service.updateSchool(
        trustId,
        schoolId,
        updateData,
      );

      res.json(formatSuccessResponse(school, "School updated successfully"));
    } catch (error) {
      logger.error("School Controller updateSchool Error", {
        controller: "school-controller",
        method: "updateSchool",
        error: error.message,
      });

      const statusCode = getErrorStatusCode(error);
      res.status(statusCode).json(formatErrorResponse(error));
    }
  }

  /**
   * Update school status
   */
  async updateSchoolStatus(req, res) {
    try {
      const trustId = req.params.trustId || req.trust?.id;
      const schoolId = req.params.id;
      const { status } = req.body;

      if (!trustId) {
        return res
          .status(400)
          .json(
            formatErrorResponse(
              ErrorFactory.createClientError("Trust ID is required"),
            ),
          );
      }

      const school = await this.service.updateSchool(trustId, schoolId, {
        status,
      });

      res.json(
        formatSuccessResponse(school, "School status updated successfully"),
      );
    } catch (error) {
      logger.error("School Controller updateSchoolStatus Error", {
        controller: "school-controller",
        method: "updateSchoolStatus",
        error: error.message,
      });

      const statusCode = getErrorStatusCode(error);
      res.status(statusCode).json(formatErrorResponse(error));
    }
  }

  /**
   * Delete school (soft delete)
   */
  async deleteSchool(req, res) {
    try {
      const trustId = req.params.trustId || req.trust?.id;
      const schoolId = req.params.id;

      if (!trustId) {
        return res
          .status(400)
          .json(
            formatErrorResponse(
              ErrorFactory.createClientError("Trust ID is required"),
            ),
          );
      }

      await this.service.deleteSchool(trustId, schoolId);

      res.json(formatSuccessResponse(null, "School deleted successfully"));
    } catch (error) {
      logger.error("School Controller deleteSchool Error", {
        controller: "school-controller",
        method: "deleteSchool",
        error: error.message,
      });

      const statusCode = getErrorStatusCode(error);
      res.status(statusCode).json(formatErrorResponse(error));
    }
  }

  /**
   * Update school compliance
   */
  async updateSchoolCompliance(req, res) {
    try {
      const trustId = req.params.trustId || req.trust?.id;
      const schoolId = req.params.id;
      const complianceData = req.body;

      if (!trustId) {
        return res
          .status(400)
          .json(
            formatErrorResponse(
              ErrorFactory.createClientError("Trust ID is required"),
            ),
          );
      }

      const school = await this.service.updateSchool(trustId, schoolId, {
        compliance_data: complianceData,
        compliance_updated_at: new Date(),
      });

      res.json(
        formatSuccessResponse(school, "School compliance updated successfully"),
      );
    } catch (error) {
      logger.error("School Controller updateSchoolCompliance Error", {
        controller: "school-controller",
        method: "updateSchoolCompliance",
        error: error.message,
      });

      const statusCode = getErrorStatusCode(error);
      res.status(statusCode).json(formatErrorResponse(error));
    }
  }
}

module.exports = SchoolController;
