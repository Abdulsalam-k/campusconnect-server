const express = require("express");
const mongoose = require("mongoose");

const Notification = require("../models/Notification");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// GET MY NOTIFICATIONS
// AUTHENTICATED USER ONLY
// ==========================================

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get my notifications
 *     description: Returns all notifications belonging to the authenticated user, along with the unread notification count.
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications fetched successfully
 *       401:
 *         description: Missing or invalid authentication token
 *       500:
 *         description: Server error
 */
router.get("/", protect, async (req, res) => {
  try {
    const notifications =
      await Notification.find({
        userId: req.user.userId,
      }).sort({ createdAt: -1 });

    const unreadCount =
      await Notification.countDocuments({
        userId: req.user.userId,
        isRead: false,
      });

    return res.json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications,
    });
  } catch (error) {
    console.error(
      "Fetching notifications error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch notifications.",
    });
  }
});

// ==========================================
// MARK ONE NOTIFICATION AS READ
// OWNER ONLY
// ==========================================

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark one notification as read
 *     description: Marks a notification belonging to the authenticated user as read.
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the notification
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       400:
 *         description: Invalid notification ID
 *       401:
 *         description: Missing or invalid authentication token
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.put(
  "/:id/read",
  protect,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid notification ID.",
        });
      }

      const notification =
        await Notification.findOne({
          _id: id,
          userId: req.user.userId,
        });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found.",
        });
      }

      notification.isRead = true;

      await notification.save();

      return res.json({
        success: true,
        message:
          "Notification marked as read.",
        data: notification,
      });
    } catch (error) {
      console.error(
        "Mark notification as read error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to mark notification as read.",
      });
    }
  }
);

// ==========================================
// MARK ALL NOTIFICATIONS AS READ
// OWNER ONLY
// ==========================================

/**
 * @swagger
 * /api/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     description: Marks all unread notifications belonging to the authenticated user as read.
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Missing or invalid authentication token
 *       500:
 *         description: Server error
 */
router.put(
  "/read-all",
  protect,
  async (req, res) => {
    try {
      await Notification.updateMany(
        {
          userId: req.user.userId,
          isRead: false,
        },
        {
          $set: {
            isRead: true,
          },
        }
      );

      return res.json({
        success: true,
        message:
          "All notifications marked as read.",
      });
    } catch (error) {
      console.error(
        "Mark all notifications as read error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to mark all notifications as read.",
      });
    }
  }
);

// ==========================================
// DELETE ONE NOTIFICATION
// OWNER ONLY
// ==========================================

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete one notification
 *     description: Deletes a notification belonging to the authenticated user.
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the notification
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       400:
 *         description: Invalid notification ID
 *       401:
 *         description: Missing or invalid authentication token
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.delete(
  "/:id",
  protect,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid notification ID.",
        });
      }

      const notification =
        await Notification.findOneAndDelete({
          _id: id,
          userId: req.user.userId,
        });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found.",
        });
      }

      return res.json({
        success: true,
        message:
          "Notification deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete notification error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete notification.",
      });
    }
  }
);

module.exports = router;