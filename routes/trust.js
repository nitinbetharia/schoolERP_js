const express = require("express");
const router = express.Router({ mergeParams: true });
const { authenticate } = require("../middleware/auth");
const { tenant } = require("../middleware/trustTenant");

// Apply authentication and tenant middleware to all trust routes
router.use(authenticate);
router.use(tenant); // This will handle tenant context setup

/**
 * Trust-scoped routes
 * All routes are prefixed with /api/v1/trust/:trustId
 */

// Mount school routes under trust context
router.use("/schools", require("../modules/school/routes/schoolRoutes"));

// Mount user routes under trust context (when implemented)
// router.use('/users', require('../modules/user/routes/userRoutes'));

// Mount student routes under trust context (when implemented)
// router.use('/students', require('../modules/student/routes/studentRoutes'));

// Mount class routes under trust context
// router.use('/classes', require('../modules/school/routes/classRoutes'));

// Mount section routes under trust context
// router.use('/sections', require('../modules/school/routes/sectionRoutes'));

/**
 * Trust Dashboard API Routes
 */
// Get trust information
router.get("/info", async (req, res) => {
  try {
    const trust = req.tenant || {
      name: "Demo Trust",
      code: "demo",
      registration_number: "REG/2024/001",
      status: "active",
      created_at: new Date().toISOString(),
    };

    res.json({
      success: true,
      trust: trust,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch trust information",
    });
  }
});

// Get dashboard statistics
router.get("/stats", async (req, res) => {
  try {
    // Mock data for now - will be replaced with actual queries
    const stats = {
      totalSchools: 5,
      totalStudents: 1250,
      totalTeachers: 85,
      totalClasses: 45,
    };

    res.json({
      success: true,
      stats: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard statistics",
    });
  }
});

// Get recent activity
router.get("/activity", async (req, res) => {
  try {
    // Mock data for demonstration
    const activities = [
      {
        id: 1,
        action: "New Student Admission",
        details: "John Doe admitted to Class 9-A",
        timestamp: "2 hours ago",
      },
      {
        id: 2,
        action: "Fee Collection Updated",
        details: "Monthly fee structure updated for Class 10",
        timestamp: "4 hours ago",
      },
      {
        id: 3,
        action: "Teacher Registration",
        details: "Sarah Wilson joined as Math teacher",
        timestamp: "1 day ago",
      },
    ];

    res.json({
      success: true,
      activities: activities,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch recent activity",
    });
  }
});

module.exports = router;
