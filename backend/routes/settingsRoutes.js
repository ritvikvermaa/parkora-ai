const express = require("express");
const router = express.Router();

const Setting = require("../models/setting");
const User = require("../models/user");
const ParkingSlot = require("../models/parkingSlot");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { canonicalFlat } = require("../utils/society");

const defaultSettings = {
  societyName: "Greenwood Heights",
  visitorSlotLimit: 20,
  visitorFallbackEnabled: true,
  notifications: {
    visitorApprovals: true,
    securityAlerts: true,
    slotReminders: true,
    societyAnnouncements: false,
  },
};

const getSocietySettings = async () => {
  const setting = await Setting.findOne({ key: "society" });
  return setting?.value || defaultSettings;
};

router.get("/", authMiddleware, async (req, res) => {
  try {
    const userDoc = await User.findById(req.user.id).select("-password");
    const user = userDoc.toObject();
    user.flat = canonicalFlat(user.flat, user.block);
    const settings = await getSocietySettings();
    const totalSlots = await ParkingSlot.countDocuments({ isActive: true });
    const blocks = await ParkingSlot.distinct("block", { isActive: true });

    res.json({
      success: true,
      user,
      settings: {
        ...defaultSettings,
        ...settings,
        totalSlots,
        totalBlocks: blocks.length || 4,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching settings",
      error: error.message,
    });
  }
});

router.patch("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, phone, flat, block } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(flat !== undefined && { flat: canonicalFlat(flat, block) }),
        ...(block !== undefined && { block }),
      },
      { new: true }
    ).select("-password");

    const updatedUser = user.toObject();
    updatedUser.flat = canonicalFlat(updatedUser.flat, updatedUser.block);

    res.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: error.message,
    });
  }
});

router.patch(
  "/society",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const currentSettings = await getSocietySettings();
      const settings = {
        ...currentSettings,
        ...req.body,
        notifications: {
          ...currentSettings.notifications,
          ...(req.body.notifications || {}),
        },
      };

      await Setting.findOneAndUpdate(
        { key: "society" },
        { key: "society", value: settings },
        { upsert: true, new: true }
      );

      res.json({
        success: true,
        settings,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error updating society settings",
        error: error.message,
      });
    }
  }
);

module.exports = router;
