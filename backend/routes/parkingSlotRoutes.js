const express = require("express");
const router = express.Router();

const ParkingSlot = require("../models/parkingSlot");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Add parking slot - only admin
router.post(
  "/add",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const { slotNumber, type, status, tower, floor, assignedTo } = req.body;

      const slot = await ParkingSlot.create({
        slotNumber,
        type,
        status,
        tower,
        floor,
        assignedTo,
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
      const slots = await ParkingSlot.find().sort({ slotNumber: 1 });

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

// Delete parking slot - admin only
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const slot = await ParkingSlot.findByIdAndDelete(req.params.id);

      if (!slot) {
        return res.status(404).json({
          success: false,
          message: "Slot not found",
        });
      }

      res.json({
        success: true,
        message: "Slot deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error deleting slot",
        error: error.message,
      });
    }
  }
);

module.exports = router;