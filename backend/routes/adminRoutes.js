const express = require("express");
const router = express.Router();

const ParkingSlot = require("../models/parkingSlot");
const Visitor = require("../models/visitor");
const Vehicle = require("../models/vehicle");
const User = require("../models/user");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.get(
  "/stats",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const totalSlots = await ParkingSlot.countDocuments();
      const availableSlots = await ParkingSlot.countDocuments({ status: "available" });
      const occupiedSlots = await ParkingSlot.countDocuments({ status: "occupied" });

      const activeVehicles = await Vehicle.countDocuments({ exitTime: null });
      const totalVisitors = await Visitor.countDocuments();

      const guards = await User.countDocuments({ role: "guard" });
      const residents = await User.countDocuments({ role: "resident" });

      res.json({
        success: true,
        stats: {
          totalSlots,
          availableSlots,
          occupiedSlots,
          activeVehicles,
          totalVisitors,
          guards,
          residents,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching admin stats",
        error: error.message,
      });
    }
  }
);

// Recent vehicle activity - admin only
router.get(
  "/recent-activity",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const activity = await Vehicle.find()
        .populate("slot", "slotNumber tower floor")
        .sort({ updatedAt: -1 })
        .limit(8);

      res.json({
        success: true,
        activity,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching recent activity",
        error: error.message,
      });
    }
  }
);

router.get(
  "/residents",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const residents = await User.find({ role: "resident" })
        .select("-password")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        residents,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching residents",
        error: error.message,
      });
    }
  }
);

module.exports = router;