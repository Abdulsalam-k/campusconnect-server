const express = require("express");
const mongoose = require("mongoose");

const User = require("../models/User");
const Opportunity = require("../models/Opportunity");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// ==========================================
// SAVE OPPORTUNITY - STUDENT ONLY
// ==========================================

/**
 * @swagger
 * /api/saved-opportunities/{opportunityId}:
 *   post:
 *     summary: Save an opportunity
 *     description: Saves an opportunity to the authenticated student's saved opportunities.
 *     tags:
 *       - Saved Opportunities
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: opportunityId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the opportunity
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       201:
 *         description: Opportunity saved successfully
 *       404:
 *         description: Opportunity or user not found
 *       409:
 *         description: Opportunity is already saved
 *       401:
 *         description: Missing or invalid authentication token
 *       403:
 *         description: Only students can save opportunities
 *       500:
 *         description: Server error
 */
router.post(
  "/:opportunityId",
  protect,
  authorizeRoles("student"),
  async (req, res) => {
    try {
      const { opportunityId } = req.params;

      // Check that the opportunity exists
      const opportunity =
        await Opportunity.findById(
          opportunityId
        );

      if (!opportunity) {
        return res.status(404).json({
          success: false,
          message: "Opportunity not found.",
        });
      }

      // Find logged-in student
      const user =
        await User.findById(
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
            id.toString() ===
            opportunityId
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
          opportunityId:
            opportunity._id,
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

/**
 * @swagger
 * /api/saved-opportunities/{opportunityId}:
 *   delete:
 *     summary: Remove a saved opportunity
 *     description: Removes an opportunity from the authenticated student's saved opportunities.
 *     tags:
 *       - Saved Opportunities
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: opportunityId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the opportunity
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Opportunity removed from saved items
 *       404:
 *         description: User not found or opportunity is not saved
 *       401:
 *         description: Missing or invalid authentication token
 *       403:
 *         description: Only students can remove saved opportunities
 *       500:
 *         description: Server error
 */
router.delete(
  "/:opportunityId",
  protect,
  authorizeRoles("student"),
  async (req, res) => {
    try {
      const { opportunityId } =
        req.params;

      const user =
        await User.findById(
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
            id.toString() ===
            opportunityId
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
            id.toString() !==
            opportunityId
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

/**
 * @swagger
 * /api/saved-opportunities:
 *   get:
 *     summary: Get saved opportunities
 *     description: Returns all opportunities saved by the authenticated student.
 *     tags:
 *       - Saved Opportunities
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Saved opportunities fetched successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Missing or invalid authentication token
 *       403:
 *         description: Only students can access saved opportunities
 *       500:
 *         description: Server error
 */
router.get(
  "/",
  protect,
  authorizeRoles("student"),
  async (req, res) => {
    try {
      const user =
        await User.findById(
          req.user.userId
        ).populate(
          "savedOpportunities"
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      res.json({
        success: true,
        count:
          user.savedOpportunities.length,
        data:
          user.savedOpportunities,
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