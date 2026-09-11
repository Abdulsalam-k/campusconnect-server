const express = require("express");
const mongoose = require("mongoose");

const Notification = require("../models/Notification");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// GET MY NOTIFICATIONS
// AUTHENTICATED USER ONLY
// ==========================================

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