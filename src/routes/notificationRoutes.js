const express = require("express");

const Notification = require("../models/Notification");
const protect = require("../middleware/authMiddleware");

const router = express.Router();
// CREATE NOTIFICATION
router.post("/", protect, async (req, res) => {
  try {
    const { title, message, type } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required.",
      });
    }

    const notification = await Notification.create({
      userId: req.user.userId,
      title,
      message,
      type: type || "system",
    });

    res.status(201).json({
      success: true,
      message: "Notification created successfully.",
      data: notification,
    });
  } catch (error) {
    console.error(
      "Creating notification error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to create notification.",
    });
  }
});

// GET MY NOTIFICATIONS
router.get("/", protect, async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.user.userId,
    }).sort({ createdAt: -1 });

    const unreadCount = await Notification.countDocuments({
      userId: req.user.userId,
      isRead: false,
    });

    res.json({
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

    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications.",
    });
  }
});

// MARK ONE NOTIFICATION AS READ
router.put("/:id/read", protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
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

    res.json({
      success: true,
      message: "Notification marked as read.",
      data: notification,
    });
  } catch (error) {
    console.error(
      "Mark notification as read error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read.",
    });
  }
});

// MARK ALL NOTIFICATIONS AS READ
router.put("/read-all", protect, async (req, res) => {
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

    res.json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error(
      "Mark all notifications as read error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to mark all notifications as read.",
    });
  }
});

// DELETE ONE NOTIFICATION
router.delete("/:id", protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    res.json({
      success: true,
      message: "Notification deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete notification error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to delete notification.",
    });
  }
});

module.exports = router;