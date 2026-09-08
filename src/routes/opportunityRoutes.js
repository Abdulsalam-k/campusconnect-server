const express = require("express");
const mongoose = require("mongoose");

const Opportunity = require("../models/Opportunity");
const Application = require("../models/Application");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();


// =====================================================
// GET ALL OPPORTUNITIES
// =====================================================

router.get("/", async (req, res) => {
  try {
    const opportunities = await Opportunity.find()
      .populate("createdBy", "name email role")
      .sort({
        createdAt: -1,
      });

    return res.json({
      success: true,
      count: opportunities.length,
      data: opportunities,
    });
  } catch (error) {
    console.error(
      "Fetching opportunities error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch opportunities.",
    });
  }
});


// =====================================================
// GET SINGLE OPPORTUNITY
// =====================================================

router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid opportunity ID.",
      });
    }

    const opportunity =
      await Opportunity.findById(
        req.params.id
      ).populate(
        "createdBy",
        "name email role"
      );

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: "Opportunity not found.",
      });
    }

    return res.json({
      success: true,
      data: opportunity,
    });
  } catch (error) {
    console.error(
      "Fetching opportunity error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch opportunity.",
    });
  }
});


// =====================================================
// CREATE OPPORTUNITY
// =====================================================

router.post(
  "/",
  protect,
  authorizeRoles("recruiter", "admin"),
  async (req, res) => {
    try {
      const {
        title,
        company,
        description,
        type,
        location,
        mode,
        category,
        skills,
        deadline,
      } = req.body || {};

      // ==========================================
      // VALIDATE REQUIRED FIELDS
      // ==========================================

      if (
        !title ||
        !company ||
        !description ||
        !type ||
        !location ||
        !mode ||
        !category ||
        !deadline
      ) {
        return res.status(400).json({
          success: false,
          message:
            "All required opportunity fields must be provided.",
        });
      }

      // ==========================================
      // CREATE OPPORTUNITY
      // ==========================================

      const opportunity =
        await Opportunity.create({
          title: title.trim(),
          company: company.trim(),
          description: description.trim(),
          type,
          location: location.trim(),
          mode,
          category: category.trim(),
          skills: Array.isArray(skills)
            ? skills
                .map((skill) =>
                  String(skill).trim()
                )
                .filter(Boolean)
            : [],
          deadline,
          createdBy: req.user.userId,
        });

      // ==========================================
      // POPULATE CREATOR
      // ==========================================

      await opportunity.populate(
        "createdBy",
        "name email role"
      );

      return res.status(201).json({
        success: true,
        message:
          "Opportunity created successfully.",
        data: opportunity,
      });
    } catch (error) {
      console.error(
        "Creating opportunity error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to create opportunity.",
      });
    }
  }
);


// =====================================================
// UPDATE OPPORTUNITY
// =====================================================

router.put(
  "/:id",
  protect,
  authorizeRoles("recruiter", "admin"),
  async (req, res) => {
    try {
      // ==========================================
      // VALIDATE ID
      // ==========================================

      if (
        !mongoose.isValidObjectId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid opportunity ID.",
        });
      }

      // ==========================================
      // FIND OPPORTUNITY
      // ==========================================

      const opportunity =
        await Opportunity.findById(
          req.params.id
        );

      if (!opportunity) {
        return res.status(404).json({
          success: false,
          message:
            "Opportunity not found.",
        });
      }

      // ==========================================
      // CHECK OWNERSHIP
      // ==========================================

      const isOwner =
        opportunity.createdBy &&
        opportunity.createdBy.toString() ===
          req.user.userId.toString();

      const isAdmin =
        req.user.role === "admin";

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message:
            "You can only edit opportunities you created.",
        });
      }

      const {
        title,
        company,
        description,
        type,
        location,
        mode,
        category,
        skills,
        deadline,
      } = req.body || {};

      // ==========================================
      // UPDATE ONLY PROVIDED FIELDS
      // ==========================================

      if (title !== undefined) {
        opportunity.title =
          title.trim();
      }

      if (company !== undefined) {
        opportunity.company =
          company.trim();
      }

      if (description !== undefined) {
        opportunity.description =
          description.trim();
      }

      if (type !== undefined) {
        opportunity.type = type;
      }

      if (location !== undefined) {
        opportunity.location =
          location.trim();
      }

      if (mode !== undefined) {
        opportunity.mode = mode;
      }

      if (category !== undefined) {
        opportunity.category =
          category.trim();
      }

      if (skills !== undefined) {
        opportunity.skills =
          Array.isArray(skills)
            ? skills
                .map((skill) =>
                  String(skill).trim()
                )
                .filter(Boolean)
            : [];
      }

      if (deadline !== undefined) {
        opportunity.deadline =
          deadline;
      }

      // ==========================================
      // SAVE CHANGES
      // ==========================================

      await opportunity.save();

      await opportunity.populate(
        "createdBy",
        "name email role"
      );

      return res.json({
        success: true,
        message:
          "Opportunity updated successfully.",
        data: opportunity,
      });
    } catch (error) {
      console.error(
        "Updating opportunity error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update opportunity.",
      });
    }
  }
);


// =====================================================
// DELETE OPPORTUNITY
// =====================================================

router.delete(
  "/:id",
  protect,
  authorizeRoles("recruiter", "admin"),
  async (req, res) => {
    try {
      // ==========================================
      // VALIDATE ID
      // ==========================================

      if (
        !mongoose.isValidObjectId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid opportunity ID.",
        });
      }

      // ==========================================
      // FIND OPPORTUNITY
      // ==========================================

      const opportunity =
        await Opportunity.findById(
          req.params.id
        );

      if (!opportunity) {
        return res.status(404).json({
          success: false,
          message:
            "Opportunity not found.",
        });
      }

      // ==========================================
      // CHECK OWNERSHIP
      // ==========================================

      const isOwner =
        opportunity.createdBy &&
        opportunity.createdBy.toString() ===
          req.user.userId.toString();

      const isAdmin =
        req.user.role === "admin";

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message:
            "You can only delete opportunities you created.",
        });
      }

      // ==========================================
      // DELETE RELATED APPLICATIONS
      // ==========================================

      await Application.deleteMany({
        opportunityId: opportunity._id,
      });

      // ==========================================
      // DELETE OPPORTUNITY
      // ==========================================

      await Opportunity.findByIdAndDelete(
        opportunity._id
      );

      return res.json({
        success: true,
        message:
          "Opportunity and related applications deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Deleting opportunity error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete opportunity.",
      });
    }
  }
);


module.exports = router;