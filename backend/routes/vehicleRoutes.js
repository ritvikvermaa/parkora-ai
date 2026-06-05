const express = require("express");
const router = express.Router();

const Vehicle = require("../models/vehicle");
const ParkingSlot = require("../models/parkingSlot");

// Vehicle Entry
router.post("/entry", async (req, res) => {
  try {
    const { ownerName, vehicleNumber, vehicleType, slotId } = req.body;

    const slot = await ParkingSlot.findById(slotId);

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Parking slot not found",
      });
    }

    if (slot.status === "occupied") {
      return res.status(400).json({
        success: false,
        message: "This parking slot is already occupied",
      });
    }

    const vehicle = await Vehicle.create({
      ownerName,
      vehicleNumber,
      vehicleType,
      slot: slotId,
      isParked: true,
    });

    slot.status = "occupied";
    slot.assignedTo = vehicleNumber;
    await slot.save();

    res.status(201).json({
      success: true,
      message: "Vehicle entry recorded successfully",
      vehicle,
      slot,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error recording vehicle entry",
      error: error.message,
    });
  }
});

// Vehicle Exit
router.post("/exit", async (req, res) => {
  try {
    const { vehicleNumber } = req.body;

    const vehicle = await Vehicle.findOne({
      vehicleNumber,
      isParked: true,
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Active parked vehicle not found",
      });
    }

    vehicle.exitTime = new Date();
    vehicle.isParked = false;
    await vehicle.save();

    const slot = await ParkingSlot.findById(vehicle.slot);

    if (slot) {
      slot.status = "available";
      slot.assignedTo = null;
      await slot.save();
    }

    res.status(200).json({
      success: true,
      message: "Vehicle exit recorded successfully",
      vehicle,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error recording vehicle exit",
      error: error.message,
    });
  }
});

// Get active parked vehicles
router.get("/active", async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ isParked: true }).populate("slot");

    res.status(200).json({
      success: true,
      count: vehicles.length,
      vehicles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching active vehicles",
      error: error.message,
    });
  }
});

module.exports = router;