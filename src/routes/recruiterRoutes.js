const express = require("express");

const Opportunity = require("../models/Opportunity");
const Application = require("../models/Application");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// ==========================================
// RECRUITER DASHBOARD
// ==========================================

router.get(
  "/dashboard",
  protect,
  authorizeRoles("recruiter", "admin"),
  async (req, res) => {
    try {
      // FIND OPPORTUNITIES CREATED BY THIS USER
      const opportunities = await Opportunity.find({
        createdBy: req.user.userId,
      }).sort({
        createdAt: -1,
      });

      // GET OPPORTUNITY IDS
      const opportunityIds = opportunities.map(
        (opportunity) => opportunity._id
      );

      // FIND APPLICATIONS FOR THESE OPPORTUNITIES
      const applications = await Application.find({
        opportunityId: {
          $in: opportunityIds,
        },
      })
        .populate(
          "userId",
          "name email role skills education department location bio profileImage"
        )
        .populate(
          "opportunityId",
          "title company location type mode category deadline createdBy"
        )
        .sort({
          createdAt: -1,
        });

      // CALCULATE STATISTICS
      const totalOpportunities =
        opportunities.length;

      const totalApplications =
        applications.length;

      const pending =
        applications.filter(
          (application) =>
            application.status === "Pending"
        ).length;

      const accepted =
        applications.filter(
          (application) =>
            application.status === "Accepted"
        ).length;

      const rejected =
        applications.filter(
          (application) =>
            application.status === "Rejected"
        ).length;

      res.json({
        success: true,

        data: {
          opportunities,
          applications,

          stats: {
            totalOpportunities,
            totalApplications,
            pending,
            accepted,
            rejected,
          },
        },
      });
    } catch (error) {
      console.error(
        "Fetching recruiter dashboard error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch recruiter dashboard.",
      });
    }
  }
);

// ==========================================
// GET SINGLE APPLICATION
// RECRUITER / ADMIN
// ==========================================

router.get(
  "/applications/:id",
  protect,
  authorizeRoles("recruiter", "admin"),
  async (req, res) => {
    try {
      const { id } = req.params;

      // FIND APPLICATION
      const application =
        await Application.findById(id)
          .populate(
            "userId",
            "name email role skills education department location bio profileImage"
          )
          .populate(
            "opportunityId",
            "title company location type mode category deadline createdBy"
          );

      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Application not found.",
        });
      }

      // CHECK WHETHER THE APPLICATION
      // BELONGS TO A VALID OPPORTUNITY
      const opportunity =
        application.opportunityId;

      if (!opportunity) {
        return res.status(404).json({
          success: false,
          message:
            "The opportunity associated with this application was not found.",
        });
      }

      // ADMIN CAN VIEW ANY APPLICATION
      const isAdmin =
        req.user.role === "admin";

      // RECRUITER CAN ONLY VIEW APPLICATIONS
      // FOR THEIR OWN OPPORTUNITIES
      const isOpportunityOwner =
        opportunity.createdBy &&
        opportunity.createdBy.toString() ===
          req.user.userId.toString();

      if (!isAdmin && !isOpportunityOwner) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to view this application.",
        });
      }

      res.json({
        success: true,
        data: application,
      });
    } catch (error) {
      console.error(
        "Fetching application details error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch application details.",
      });
    }
  }
);

module.exports = router;