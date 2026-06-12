const express = require("express");
const router = express.Router();

const ParkingSlot = require("../models/parkingSlot");
const Visitor = require("../models/visitor");
const Vehicle = require("../models/vehicle");
const User = require("../models/user");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { approvedUserFilter } = require("../utils/userStatus");
const { canonicalFlat } = require("../utils/society");
const { createNotification } = require("../utils/notifications");

router.get(
  "/stats",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const totalSlots = await ParkingSlot.countDocuments();
      const availableSlots = await ParkingSlot.countDocuments({ status: "available" });
      const occupiedSlots = await ParkingSlot.countDocuments({ status: "occupied" });

      const activeVehicles = await Vehicle.countDocuments({ isParked: true });
      const totalVisitors = await Visitor.countDocuments();

      const guards = await User.countDocuments({
        role: "guard",
        ...approvedUserFilter,
      });
      const residents = await User.countDocuments({
        role: "resident",
        ...approvedUserFilter,
      });
      const pendingUsers = await User.countDocuments({ approvalStatus: "pending" });

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
          pendingUsers,
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
      const residents = await User.find({
        role: "resident",
        ...approvedUserFilter,
      })
        .select("-password")
        .sort({ createdAt: -1 })
        .lean();

      res.json({
        success: true,
        residents: residents.map((resident) => ({
          ...resident,
          flat: canonicalFlat(resident.flat, resident.block),
          approvalStatus: resident.approvalStatus || "approved",
        })),
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

router.get(
  "/pending-users",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const users = await User.find({ approvalStatus: "pending" })
        .select("-password")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        users,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching pending users",
        error: error.message,
      });
    }
  }
);

router.patch(
  "/users/:id/approval",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const { approvalStatus } = req.body;

      if (!["approved", "rejected"].includes(approvalStatus)) {
        return res.status(400).json({
          success: false,
          message: "Approval status must be approved or rejected",
        });
      }

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { approvalStatus },
        { new: true }
      ).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      await createNotification({
        title:
          approvalStatus === "approved"
            ? "Registration approved"
            : "Registration rejected",
        message:
          approvalStatus === "approved"
            ? "Your Parkora resident account is approved. You can now sign in."
            : "Your Parkora resident registration request was rejected.",
        type: approvalStatus === "approved" ? "success" : "destructive",
        category: "registration",
        targetUsers: [user._id],
        link: approvalStatus === "approved" ? "/dashboard" : "/",
        metadata: { userId: user._id, approvalStatus },
      });

      res.json({
        success: true,
        user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error updating user approval",
        error: error.message,
      });
    }
  }
);

module.exports = router;
