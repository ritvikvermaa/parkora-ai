const express = require("express");
const router = express.Router();

const Notification = require("../models/notification");
const User = require("../models/user");
const authMiddleware = require("../middleware/authMiddleware");
const { flatAliases } = require("../utils/society");

router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("role flat block");
    const flatTargets = user ? flatAliases(user.flat, user.block) : [];
    const limit = Math.min(Number(req.query.limit) || 30, 100);

    const query = {
      $or: [
        { targetUsers: req.user.id },
        { targetRoles: req.user.role },
        ...(flatTargets.length ? [{ targetFlats: { $in: flatTargets } }] : []),
      ],
    };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const unreadCount = await Notification.countDocuments({
      ...query,
      readBy: { $ne: req.user.id },
    });

    res.json({
      success: true,
      notifications: notifications.map((notification) => ({
        ...notification,
        isRead: (notification.readBy || []).some(
          (id) => id.toString() === req.user.id.toString()
        ),
      })),
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching notifications",
      error: error.message,
    });
  }
});

router.patch("/read-all", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("role flat block");
    const flatTargets = user ? flatAliases(user.flat, user.block) : [];

    await Notification.updateMany(
      {
        $or: [
          { targetUsers: req.user.id },
          { targetRoles: req.user.role },
          ...(flatTargets.length ? [{ targetFlats: { $in: flatTargets } }] : []),
        ],
      },
      { $addToSet: { readBy: req.user.id } }
    );

    res.json({
      success: true,
      message: "Notifications marked as read",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error marking notifications as read",
      error: error.message,
    });
  }
});

router.patch("/:id/read", authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { readBy: req.user.id } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.json({
      success: true,
      notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating notification",
      error: error.message,
    });
  }
});

module.exports = router;
