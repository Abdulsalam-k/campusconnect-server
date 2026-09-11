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

/**
 * @swagger
 * /api/opportunities:
 *   get:
 *     summary: Get all opportunities
 *     description: Returns all available opportunities, ordered from newest to oldest.
 *     tags:
 *       - Opportunities
 *     responses:
 *       200:
 *         description: Opportunities fetched successfully
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/opportunities/{id}:
 *   get:
 *     summary: Get a single opportunity
 *     description: Returns one opportunity by its MongoDB ID.
 *     tags:
 *       - Opportunities
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the opportunity
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Opportunity fetched successfully
 *       400:
 *         description: Invalid opportunity ID
 *       404:
 *         description: Opportunity not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/opportunities:
 *   post:
 *     summary: Create an opportunity
 *     description: Creates a new opportunity. Only recruiters and administrators can create opportunities.
 *     tags:
 *       - Opportunities
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - company
 *               - description
 *               - type
 *               - location
 *               - mode
 *               - category
 *               - deadline
 *             properties:
 *               title:
 *                 type: string
 *                 example: Frontend Developer Intern
 *               company:
 *                 type: string
 *                 example: CampusConnect Technologies
 *               description:
 *                 type: string
 *                 example: Join our team as a frontend developer intern and work on real-world web applications.
 *               type:
 *                 type: string
 *                 enum:
 *                   - Internship
 *                   - Part-time
 *                   - Full-time
 *                   - Contract
 *                 example: Internship
 *               location:
 *                 type: string
 *                 example: Lagos
 *               mode:
 *                 type: string
 *                 enum:
 *                   - Remote
 *                   - On-site
 *                   - Hybrid
 *                 example: Hybrid
 *               category:
 *                 type: string
 *                 example: Software Development
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example:
 *                   - JavaScript
 *                   - React
 *                   - Git
 *               deadline:
 *                 type: string
 *                 example: 2026-12-31
 *     responses:
 *       201:
 *         description: Opportunity created successfully
 *       400:
 *         description: Required opportunity fields are missing
 *       401:
 *         description: Missing or invalid authentication token
 *       403:
 *         description: User is not authorized to create opportunities
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/opportunities/{id}:
 *   put:
 *     summary: Update an opportunity
 *     description: Updates an existing opportunity. Recruiters can update opportunities they created, while administrators can update any opportunity.
 *     tags:
 *       - Opportunities
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the opportunity
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Senior Frontend Developer Intern
 *               company:
 *                 type: string
 *                 example: CampusConnect Technologies
 *               description:
 *                 type: string
 *                 example: Updated opportunity description with additional responsibilities.
 *               type:
 *                 type: string
 *                 enum:
 *                   - Internship
 *                   - Part-time
 *                   - Full-time
 *                   - Contract
 *                 example: Internship
 *               location:
 *                 type: string
 *                 example: Lagos
 *               mode:
 *                 type: string
 *                 enum:
 *                   - Remote
 *                   - On-site
 *                   - Hybrid
 *                 example: Remote
 *               category:
 *                 type: string
 *                 example: Software Development
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example:
 *                   - JavaScript
 *                   - React
 *                   - Node.js
 *               deadline:
 *                 type: string
 *                 example: 2027-01-31
 *     responses:
 *       200:
 *         description: Opportunity updated successfully
 *       400:
 *         description: Invalid opportunity ID
 *       401:
 *         description: Missing or invalid authentication token
 *       403:
 *         description: User is not authorized to update this opportunity
 *       404:
 *         description: Opportunity not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/opportunities/{id}:
 *   delete:
 *     summary: Delete an opportunity
 *     description: Deletes an opportunity and all applications associated with it. Recruiters can delete opportunities they created, while administrators can delete any opportunity.
 *     tags:
 *       - Opportunities
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the opportunity
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Opportunity and related applications deleted successfully
 *       400:
 *         description: Invalid opportunity ID
 *       401:
 *         description: Missing or invalid authentication token
 *       403:
 *         description: User is not authorized to delete this opportunity
 *       404:
 *         description: Opportunity not found
 *       500:
 *         description: Server error
 */
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