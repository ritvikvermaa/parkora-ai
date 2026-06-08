const express = require("express");
const router = express.Router();

const Visitor = require("../models/visitor");
const ParkingSlot = require("../models/parkingSlot");
const Vehicle = require("../models/vehicle");
const User = require("../models/user");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  normalizeFlat,
  normalizeVehicleNumber,
  findVisitorOrUnhandoverResidentSlot,
  flatAliases,
} = require("../utils/parkingAllocator");
const { canonicalFlat } = require("../utils/society");
const { approvedUserFilter } = require("../utils/userStatus");

// Create visitor request
router.post("/request", authMiddleware, roleMiddleware("guard", "admin"), async (req, res) => {
  try {
    const { visitorName, phone, vehicleNumber, hostResident, hostFlat, block, purpose } = req.body;
    const finalHostFlat = canonicalFlat(hostFlat, block);
    const hostFlatAliases = flatAliases(finalHostFlat);
    const host = await User.findOne({
      role: "resident",
      ...approvedUserFilter,
      flat: { $in: hostFlatAliases },
    });

    if (!host) {
      return res.status(404).json({
        success: false,
        message: "No approved resident found for this flat",
      });
    }

    const visitor = await Visitor.create({
      visitorName,
      phone,
      vehicleNumber: normalizeVehicleNumber(vehicleNumber),
      hostResident: hostResident || host.name,
      hostFlat: normalizeFlat(host.flat),
      purpose,
      createdByRole: req.user.role,
      status: "pending",
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
const exitVisitor = async (req, res) => {
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

    await Vehicle.findOneAndUpdate(
      { number: normalizeVehicleNumber(visitor.vehicleNumber), isParked: true },
      { isParked: false, exitTime: new Date() }
    );

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
};

// Visitor exit
router.put("/exit/:id", exitVisitor);
router.patch("/exit/:id", exitVisitor);

router.get(
  "/pending",
  authMiddleware,
  roleMiddleware("resident", "admin"),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      const query =
        req.user.role === "admin"
          ? { status: "pending" }
          : { status: "pending", hostFlat: { $in: flatAliases(user.flat, user.block) } };

      const visitors = await Visitor.find(query)
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
  roleMiddleware("resident", "admin"),
  async (req, res) => {
    try {
      const visitor = await Visitor.findById(req.params.id);

      if (!visitor) {
        return res.status(404).json({
          success: false,
          message: "Visitor not found",
        });
      }

      const user = await User.findById(req.user.id);

      if (
        req.user.role !== "admin" &&
        !flatAliases(user.flat, user.block).includes(normalizeFlat(visitor.hostFlat))
      ) {
        return res.status(403).json({
          success: false,
          message: "You can approve visitors only for your flat",
        });
      }

      const slot = await findVisitorOrUnhandoverResidentSlot(visitor.hostFlat);

      if (!slot) {
        visitor.status = "parking_unavailable";
        await visitor.save();

        return res.json({
          success: true,
          parkingUnavailable: true,
          message: "Entry noted, but parking could not be allotted right now",
          visitor,
        });
      }

      visitor.status = "approved";
      visitor.slot = slot._id;
      visitor.entryTime = new Date();

      await visitor.save();

      const vehicleNumber = normalizeVehicleNumber(visitor.vehicleNumber);
      const vehicle = await Vehicle.findOneAndUpdate(
        { number: vehicleNumber },
        {
          ownerName: visitor.visitorName,
          number: vehicleNumber,
          vehicleNumber,
          manufacturer: "Visitor",
          model: "Vehicle",
          vehicleType: "car",
          type: "car",
          flat: normalizeFlat(visitor.hostFlat),
          slot: slot._id,
          isParked: true,
          parkingCategory: "visitor",
          entrySource: visitor.createdByRole === "resident" ? "visitor_invite" : "guard_request",
          entryTime: new Date(),
          exitTime: null,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      slot.status = "occupied";
      slot.assignedTo = vehicleNumber;
      await slot.save();

      res.json({
        success: true,
        message: "Visitor approved and slot allocated",
        visitor,
        vehicle,
        slot,
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
  roleMiddleware("resident", "admin"),
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
