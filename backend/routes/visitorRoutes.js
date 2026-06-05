const express = require("express");
const router = express.Router();

const Visitor = require("../models/visitor");
const ParkingSlot = require("../models/parkingSlot");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Create visitor request
router.post("/request", async (req, res) => {
  try {
    const { visitorName, phone, vehicleNumber, hostResident, purpose } = req.body;

    const visitor = await Visitor.create({
      visitorName,
      phone,
      vehicleNumber,
      hostResident,
      purpose,
    });

    res.status(201).json({
      success: true,
      message: "Visitor request created successfully",
      visitor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating visitor request",
      error: error.message,
    });
  }
});

// Get all visitors
router.get("/", async (req, res) => {
  try {
    const visitors = await Visitor.find().populate("slot").sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: visitors.length,
      visitors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching visitors",
      error: error.message,
    });
  }
});

// Approve visitor and assign slot
router.put("/approve/:id", async (req, res) => {
  try {
    const availableSlot = await ParkingSlot.findOne({
      status: "available",
      type: "visitor",
    });

    if (!availableSlot) {
      return res.status(404).json({
        success: false,
        message: "No visitor parking slot available",
      });
    }

    const visitor = await Visitor.findById(req.params.id);

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Visitor request not found",
      });
    }

    visitor.status = "approved";
    visitor.slot = availableSlot._id;
    visitor.entryTime = new Date();
    await visitor.save();

    availableSlot.status = "occupied";
    availableSlot.assignedTo = visitor.vehicleNumber;
    await availableSlot.save();

    res.status(200).json({
      success: true,
      message: "Visitor approved and slot assigned",
      visitor,
      slot: availableSlot,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error approving visitor",
      error: error.message,
    });
  }
});

// Reject visitor
router.put("/reject/:id", async (req, res) => {
  try {
    const visitor = await Visitor.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Visitor request rejected",
      visitor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error rejecting visitor",
      error: error.message,
    });
  }
});

// Visitor exit
router.put("/exit/:id", async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Visitor not found",
      });
    }

    visitor.status = "exited";
    visitor.exitTime = new Date();
    await visitor.save();

    if (visitor.slot) {
      const slot = await ParkingSlot.findById(visitor.slot);
      if (slot) {
        slot.status = "available";
        slot.assignedTo = null;
        await slot.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Visitor exit recorded",
      visitor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error recording visitor exit",
      error: error.message,
    });
  }
});

router.get(
  "/pending",
  authMiddleware,
  roleMiddleware("guard", "admin"),
  async (req, res) => {
    try {
      const visitors = await Visitor.find({ status: "pending" })
        .populate("slot", "slotNumber tower floor")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        visitors,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching pending visitors",
        error: error.message,
      });
    }
  }
);

router.patch(
  "/approve/:id",
  authMiddleware,
  roleMiddleware("guard", "admin"),
  async (req, res) => {
    try {
      const visitor = await Visitor.findById(req.params.id);

      if (!visitor) {
        return res.status(404).json({
          success: false,
          message: "Visitor not found",
        });
      }

      visitor.status = "approved";
      visitor.entryTime = new Date();

      await visitor.save();

      res.json({
        success: true,
        message: "Visitor approved",
        visitor,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error approving visitor",
        error: error.message,
      });
    }
  }
);

router.patch(
  "/reject/:id",
  authMiddleware,
  roleMiddleware("guard", "admin"),
  async (req, res) => {
    try {
      const visitor = await Visitor.findById(req.params.id);

      if (!visitor) {
        return res.status(404).json({
          success: false,
          message: "Visitor not found",
        });
      }

      visitor.status = "rejected";

      if (visitor.slot) {
        await ParkingSlot.findByIdAndUpdate(visitor.slot, {
          status: "available",
          assignedTo: null,
        });
      }

      await visitor.save();

      res.json({
        success: true,
        message: "Visitor rejected",
        visitor,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error rejecting visitor",
        error: error.message,
      });
    }
  }
);

module.exports = router;