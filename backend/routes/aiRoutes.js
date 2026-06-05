const express = require("express");
const router = express.Router();

const ParkingSlot = require("../models/parkingSlot");
const Visitor = require("../models/visitor");
const Vehicle = require("../models/vehicle");

// AI Slot Recommendation
router.post("/recommend-slot", async (req, res) => {
  try {
    const { tower, floor } = req.body;

    const slots = await ParkingSlot.find({
      status: "available",
    });

    if (!slots.length) {
      return res.status(404).json({
        success: false,
        message: "No available slots",
      });
    }

    const scoredSlots = slots.map((slot) => {
      let score = 0;

      if (slot.tower === tower) score += 50;
      if (slot.floor === floor) score += 30;
      if (slot.type === "resident") score += 20;
      if (slot.type === "visitor") score += 10;

      return {
        slot,
        score,
      };
    });

    scoredSlots.sort((a, b) => b.score - a.score);

    res.json({
      success: true,
      recommendedSlot: scoredSlots[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// AI Violation Detection
router.get("/violations", async (req, res) => {
  try {
    const violations = [];

    // Visitor parked > 6 hours
    const approvedVisitors = await Visitor.find({
      status: "approved",
      entryTime: { $ne: null },
    });

    approvedVisitors.forEach((visitor) => {
      const hours =
        (Date.now() - new Date(visitor.entryTime)) / (1000 * 60 * 60);

      if (hours > 6) {
        violations.push({
          type: "Visitor Overstay",
          vehicle: visitor.vehicleNumber,
          message: `${visitor.visitorName} parked for ${hours.toFixed(1)} hours`,
        });
      }
    });

    // Vehicle parked > 24 hours
    const vehicles = await Vehicle.find({
      isParked: true,
      entryTime: { $ne: null },
    });

    vehicles.forEach((vehicle) => {
      const hours =
        (Date.now() - new Date(vehicle.entryTime)) / (1000 * 60 * 60);

      if (hours > 24) {
        violations.push({
          type: "Long Parking",
          vehicle: vehicle.vehicleNumber,
          message: `${vehicle.vehicleNumber} parked for ${hours.toFixed(1)} hours`,
        });
      }
    });

    // Repeated visitor entries
    const repeatedVisitors = await Visitor.aggregate([
      {
        $group: {
          _id: "$vehicleNumber",
          count: { $sum: 1 },
          visitorName: { $first: "$visitorName" },
        },
      },
      {
        $match: {
          count: { $gte: 3 },
        },
      },
    ]);

    repeatedVisitors.forEach((visitor) => {
      violations.push({
        type: "Repeated Visitor Entry",
        vehicle: visitor._id,
        message: `${visitor.visitorName} has made ${visitor.count} visitor requests`,
      });
    });

    res.json({
      success: true,
      count: violations.length,
      violations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;