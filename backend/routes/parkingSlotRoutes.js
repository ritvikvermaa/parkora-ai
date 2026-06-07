const express = require("express");
const router = express.Router();

const ParkingSlot = require("../models/parkingSlot");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const blockMap = {
  Jade: "J",
  Topaz: "T",
  Nest: "N",
  Opal: "O",
};

// Add parking slot - admin only
router.post(
  "/add",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const {
        slotNumber,
        block,
        tower,
        flat,
        floor,
        type,
        status,
        isReservedForFlat,
        reservedForFlat,
        assignedTo,
        allowVisitorFallback,
      } = req.body;

      if (!blockMap[block]) {
        return res.status(400).json({
          success: false,
          message: "Invalid block. Use Jade, Topaz, Nest, or Opal.",
        });
      }

      const finalReservedForFlat =
        isReservedForFlat ? reservedForFlat || flat : null;

      const slot = await ParkingSlot.create({
        slotNumber,
        block,
        blockCode: blockMap[block],
        tower,
        flat: flat || null,
        floor,
        type,
        status: status || "available",
        isReservedForFlat: Boolean(isReservedForFlat),
        reservedForFlat: finalReservedForFlat,
        assignedTo: assignedTo || null,
        allowVisitorFallback:
          allowVisitorFallback === undefined ? true : allowVisitorFallback,
      });

      res.status(201).json({
        success: true,
        message: "Parking slot added successfully",
        slot,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error adding parking slot",
        error: error.message,
      });
    }
  }
);

// Get all parking slots - admin and guard
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "guard"),
  async (req, res) => {
    try {
      const slots = await ParkingSlot.find({ isActive: true }).sort({
        blockCode: 1,
        tower: 1,
        flat: 1,
        slotNumber: 1,
      });

      res.status(200).json({
        success: true,
        count: slots.length,
        slots,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching parking slots",
        error: error.message,
      });
    }
  }
);

// Guard available slots
// Guard should only see visitor parking first,
// and unassigned resident parking only as fallback.
router.get(
  "/guard-available",
  authMiddleware,
  roleMiddleware("guard", "admin"),
  async (req, res) => {
    try {
      const visitorSlots = await ParkingSlot.find({
        isActive: true,
        type: "visitor",
        status: "available",
      }).sort({ blockCode: 1, tower: 1, slotNumber: 1 });

      const fallbackResidentSlots = await ParkingSlot.find({
        isActive: true,
        type: "resident",
        status: "available",
        isReservedForFlat: false,
        reservedForFlat: null,
        allowVisitorFallback: true,
      }).sort({ blockCode: 1, tower: 1, slotNumber: 1 });

      const slots = [...visitorSlots, ...fallbackResidentSlots];

      res.json({
        success: true,
        count: slots.length,
        slots,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching guard available slots",
        error: error.message,
      });
    }
  }
);

// Get slots reserved for a flat
router.get(
  "/flat/:flat",
  authMiddleware,
  roleMiddleware("admin", "resident"),
  async (req, res) => {
    try {
      const flat = req.params.flat;

      const slots = await ParkingSlot.find({
        isActive: true,
        reservedForFlat: flat,
      });

      res.json({
        success: true,
        slots,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching flat slots",
        error: error.message,
      });
    }
  }
);

// Soft delete parking slot - admin only
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const slot = await ParkingSlot.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
      );

      if (!slot) {
        return res.status(404).json({
          success: false,
          message: "Slot not found",
        });
      }

      res.json({
        success: true,
        message: "Slot removed successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error removing slot",
        error: error.message,
      });
    }
  }
);

module.exports = router;