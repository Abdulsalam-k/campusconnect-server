const express = require("express");

const User = require("../models/User");
const Opportunity = require("../models/Opportunity");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// ==========================================
// SAVE OPPORTUNITY - STUDENT ONLY
// ==========================================

router.post(
  "/:opportunityId",
  protect,
  authorizeRoles("student"),
  async (req, res) => {
    try {
      const { opportunityId } = req.params;

      // Check that the opportunity exists
      const opportunity = await Opportunity.findById(
        opportunityId
      );

      if (!opportunity) {
        return res.status(404).json({
          success: false,
          message: "Opportunity not found.",
        });
      }

      // Find logged-in student
      const user = await User.findById(
        req.user.userId
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      // Check if already saved
      const alreadySaved =
        user.savedOpportunities.some(
          (id) =>
            id.toString() === opportunityId
        );

      if (alreadySaved) {
        return res.status(409).json({
          success: false,
          message:
            "Opportunity is already saved.",
        });
      }

      // Save opportunity
      user.savedOpportunities.push(
        opportunity._id
      );

      await user.save();

      res.status(201).json({
        success: true,
        message:
          "Opportunity saved successfully.",
        data: {
          opportunityId: opportunity._id,
        },
      });
    } catch (error) {
      console.error(
        "Saving opportunity error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to save opportunity.",
      });
    }
  }
);

// ==========================================
// UNSAVE OPPORTUNITY - STUDENT ONLY
// ==========================================

router.delete(
  "/:opportunityId",
  protect,
  authorizeRoles("student"),
  async (req, res) => {
    try {
      const { opportunityId } = req.params;

      const user = await User.findById(
        req.user.userId
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      const wasSaved =
        user.savedOpportunities.some(
          (id) =>
            id.toString() === opportunityId
        );

      if (!wasSaved) {
        return res.status(404).json({
          success: false,
          message:
            "Opportunity is not saved.",
        });
      }

      // Remove opportunity from saved list
      user.savedOpportunities =
        user.savedOpportunities.filter(
          (id) =>
            id.toString() !== opportunityId
        );

      await user.save();

      res.json({
        success: true,
        message:
          "Opportunity removed from saved items.",
      });
    } catch (error) {
      console.error(
        "Unsaving opportunity error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to remove saved opportunity.",
      });
    }
  }
);

// ==========================================
// GET SAVED OPPORTUNITIES - STUDENT ONLY
// ==========================================

router.get(
  "/",
  protect,
  authorizeRoles("student"),
  async (req, res) => {
    try {
      const user = await User.findById(
        req.user.userId
      ).populate("savedOpportunities");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      res.json({
        success: true,
        count: user.savedOpportunities.length,
        data: user.savedOpportunities,
      });
    } catch (error) {
      console.error(
        "Fetching saved opportunities error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch saved opportunities.",
      });
    }
  }
);

module.exports = router;