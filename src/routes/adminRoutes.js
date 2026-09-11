const express = require("express");
const mongoose = require("mongoose");

const User = require("../models/User");
const Opportunity = require("../models/Opportunity");
const Application = require("../models/Application");
const Notification = require("../models/Notification");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// =====================================================
// ADMIN DASHBOARD
// =====================================================

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard
 *     description: Returns platform-wide statistics and the most recent users, opportunities, and applications. Restricted to administrators.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard fetched successfully
 *       401:
 *         description: Missing or invalid authentication token
 *       403:
 *         description: Administrator access required
 *       500:
 *         description: Server error
 */
router.get(
  "/dashboard",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      // TOTAL USERS
      const totalUsers =
        await User.countDocuments();

      // TOTAL STUDENTS
      const totalStudents =
        await User.countDocuments({
          role: "student",
        });

      // TOTAL RECRUITERS
      const totalRecruiters =
        await User.countDocuments({
          role: "recruiter",
        });

      // TOTAL ADMINS
      const totalAdmins =
        await User.countDocuments({
          role: "admin",
        });

      // TOTAL OPPORTUNITIES
      const totalOpportunities =
        await Opportunity.countDocuments();

      // TOTAL APPLICATIONS
      const totalApplications =
        await Application.countDocuments();

      // APPLICATION STATUS COUNTS
      const pendingApplications =
        await Application.countDocuments({
          status: "Pending",
        });

      const acceptedApplications =
        await Application.countDocuments({
          status: "Accepted",
        });

      const rejectedApplications =
        await Application.countDocuments({
          status: "Rejected",
        });

      // TOTAL NOTIFICATIONS
      const totalNotifications =
        await Notification.countDocuments();

      // RECENT USERS
      const recentUsers =
        await User.find()
          .select(
            "name email role isActive skills education department location createdAt"
          )
          .sort({
            createdAt: -1,
          })
          .limit(10);

      // RECENT OPPORTUNITIES
      const recentOpportunities =
        await Opportunity.find()
          .populate(
            "createdBy",
            "name email role"
          )
          .sort({
            createdAt: -1,
          })
          .limit(10);

      // RECENT APPLICATIONS
      const recentApplications =
        await Application.find()
          .populate(
            "userId",
            "name email role"
          )
          .populate(
            "opportunityId",
            "title company"
          )
          .sort({
            createdAt: -1,
          })
          .limit(10);

      res.json({
        success: true,

        data: {
          stats: {
            totalUsers,
            totalStudents,
            totalRecruiters,
            totalAdmins,
            totalOpportunities,
            totalApplications,
            pendingApplications,
            acceptedApplications,
            rejectedApplications,
            totalNotifications,
          },

          recentUsers,
          recentOpportunities,
          recentApplications,
        },
      });
    } catch (error) {
      console.error(
        "Fetching admin dashboard error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch admin dashboard.",
      });
    }
  }
);

// =====================================================
// GET ALL USERS - ADMIN ONLY
// =====================================================

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users
 *     description: Returns all users registered on CampusConnect. Restricted to administrators.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users fetched successfully
 *       401:
 *         description: Missing or invalid authentication token
 *       403:
 *         description: Administrator access required
 *       500:
 *         description: Server error
 */
router.get(
  "/users",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const users = await User.find()
        .select(
          "name email role isActive skills education department location createdAt"
        )
        .sort({
          createdAt: -1,
        });

      res.json({
        success: true,
        count: users.length,
        data: users,
      });
    } catch (error) {
      console.error(
        "Fetching admin users error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message: "Failed to fetch users.",
      });
    }
  }
);

// =====================================================
// CHANGE USER ROLE - ADMIN ONLY
// =====================================================

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   put:
 *     summary: Change a user's role
 *     description: Changes the role of a user. Administrators can assign student, recruiter, or admin roles, but cannot change their own role.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the target user
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum:
 *                   - student
 *                   - recruiter
 *                   - admin
 *                 example: recruiter
 *     responses:
 *       200:
 *         description: User role changed successfully
 *       400:
 *         description: Invalid user ID, invalid role, or role already assigned
 *       401:
 *         description: Missing or invalid authentication token
 *       403:
 *         description: Administrator access required or self-role change attempted
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put(
  "/users/:id/role",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { role } =
        req.body || {};

      // VALIDATE USER ID
      if (
        !mongoose.isValidObjectId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid user ID.",
        });
      }

      // VALIDATE ROLE
      if (
        ![
          "student",
          "recruiter",
          "admin",
        ].includes(role)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Role must be student, recruiter, or admin.",
        });
      }

      // FIND USER
      const targetUser =
        await User.findById(
          req.params.id
        );

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      // PREVENT ADMIN FROM CHANGING THEIR OWN ROLE
      if (
        targetUser._id.toString() ===
        req.user.userId.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You cannot change your own role.",
        });
      }

      // CHECK WHETHER ROLE IS ALREADY THE SAME
      if (
        targetUser.role === role
      ) {
        return res.status(400).json({
          success: false,
          message:
            "The user already has this role.",
        });
      }

      const previousRole =
        targetUser.role;

      // UPDATE ROLE
      targetUser.role = role;

      await targetUser.save();

      // CREATE NOTIFICATION
      await Notification.create({
        userId: targetUser._id,
        title:
          "Account Role Updated",
        message:
          `Your CampusConnect account role has been changed from ${previousRole} to ${role}. Please log in again for the change to take effect.`,
        type: "system",
      });

      // RESPONSE DATA
      const userResponse = {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        isActive:
          targetUser.isActive,
        skills: targetUser.skills,
        education:
          targetUser.education,
        department:
          targetUser.department,
        location:
          targetUser.location,
        bio: targetUser.bio,
        profileImage:
          targetUser.profileImage,
        createdAt:
          targetUser.createdAt,
      };

      res.json({
        success: true,
        message:
          `User role changed from ${previousRole} to ${role} successfully.`,
        data: userResponse,
      });
    } catch (error) {
      console.error(
        "Updating user role error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update user role.",
      });
    }
  }
);

// =====================================================
// GET SINGLE USER - ADMIN ONLY
// =====================================================

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get a single user
 *     description: Returns the complete profile of a user for administrative purposes.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the user
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: User details fetched successfully
 *       400:
 *         description: Invalid user ID
 *       401:
 *         description: Missing or invalid authentication token
 *       403:
 *         description: Administrator access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get(
  "/users/:id",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      // VALIDATE USER ID
      if (
        !mongoose.isValidObjectId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID.",
        });
      }

      // FIND USER
      const targetUser =
        await User.findById(
          req.params.id
        ).select("-password");

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      res.json({
        success: true,
        data: targetUser,
      });
    } catch (error) {
      console.error(
        "Fetching user details error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch user details.",
      });
    }
  }
);

// =====================================================
// CHANGE USER ACTIVE STATUS - ADMIN ONLY
// =====================================================

/**
 * @swagger
 * /api/admin/users/{id}/status:
 *   put:
 *     summary: Activate or deactivate a user
 *     description: Changes a user's active status. Administrators cannot change their own account status.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the target user
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: User account status updated successfully
 *       400:
 *         description: Invalid user ID or status value
 *       401:
 *         description: Missing or invalid authentication token
 *       403:
 *         description: Administrator access required or self-status change attempted
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put(
  "/users/:id/status",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { isActive } =
        req.body || {};

      // VALIDATE USER ID
      if (
        !mongoose.isValidObjectId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID.",
        });
      }

      // VALIDATE STATUS
      if (
        typeof isActive !==
        "boolean"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "isActive must be either true or false.",
        });
      }

      // FIND USER
      const targetUser =
        await User.findById(
          req.params.id
        );

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      // PREVENT ADMIN FROM DEACTIVATING THEMSELVES
      if (
        targetUser._id.toString() ===
        req.user.userId.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You cannot change your own account status.",
        });
      }

      // CHECK IF STATUS IS ALREADY THE SAME
      if (
        targetUser.isActive ===
        isActive
      ) {
        return res.status(400).json({
          success: false,
          message: `User is already ${
            isActive
              ? "active"
              : "deactivated"
          }.`,
        });
      }

      // UPDATE STATUS
      targetUser.isActive =
        isActive;

      await targetUser.save();

      // CREATE NOTIFICATION
      await Notification.create({
        userId: targetUser._id,
        title: isActive
          ? "Account Activated"
          : "Account Deactivated",
        message: isActive
          ? "Your CampusConnect account has been activated by an administrator."
          : "Your CampusConnect account has been deactivated by an administrator.",
        type: "system",
      });

      res.json({
        success: true,
        message: isActive
          ? "User activated successfully."
          : "User deactivated successfully.",
        data: {
          id: targetUser._id,
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role,
          isActive:
            targetUser.isActive,
        },
      });
    } catch (error) {
      console.error(
        "Updating user status error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update user status.",
      });
    }
  }
);

module.exports = router;