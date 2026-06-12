const express = require("express");
const router = express.Router();

const User = require("../models/user");
const Vehicle = require("../models/vehicle");
const Visitor = require("../models/visitor");
const ParkingSlot = require("../models/parkingSlot");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  normalizeFlat,
  normalizeVehicleNumber,
  findVisitorOrUnhandoverResidentSlot,
  flatAliases,
} = require("../utils/parkingAllocator");
const { canonicalFlat } = require("../utils/society");
const { createNotification } = require("../utils/notifications");

// Resident dashboard data
router.get(
  "/dashboard",
  authMiddleware,
  roleMiddleware("resident", "admin"),
  async (req, res) => {
    try {
      const userDoc = await User.findById(req.user.id).select("-password");
      const user = userDoc.toObject();
      user.flat = canonicalFlat(user.flat, user.block);

      const vehicles = await Vehicle.find({
        $or: [{ owner: user._id }, { flat: { $in: flatAliases(user.flat, user.block) } }],
      }).populate("slot", "slotNumber tower floor type status");

      const activeVehicles = await Vehicle.countDocuments({
        $or: [{ owner: user._id }, { flat: { $in: flatAliases(user.flat, user.block) } }],
        isParked: true,
      });

      const assignedSlots = await ParkingSlot.find({
        $or: [
          { assignedTo: { $regex: user.name, $options: "i" } },
          { reservedForFlat: { $in: flatAliases(user.flat, user.block) } },
          { flat: { $in: flatAliases(user.flat, user.block) } },
        ],
      });

      const visitors = await Visitor.find({
        $or: [
          { hostResident: { $regex: user.name, $options: "i" } },
          { hostFlat: { $in: flatAliases(user.flat, user.block) } },
        ],
      })
        .populate("slot", "slotNumber tower floor")
        .sort({ createdAt: -1 })
        .limit(5);

      res.json({
        success: true,
        data: {
          user,
          vehicles,
          activeVehicles,
          assignedSlots,
          visitors,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching resident dashboard",
        error: error.message,
      });
    }
  }
);

// Invite visitor
router.post(
  "/invite-visitor",
  authMiddleware,
  roleMiddleware("resident", "admin"),
  async (req, res) => {
    try {
      const { visitorName, phone, vehicleNumber, purpose } = req.body;

      const resident = await User.findById(req.user.id);
      const normalizedVehicleNumber = normalizeVehicleNumber(vehicleNumber);

      const slot = await findVisitorOrUnhandoverResidentSlot(resident.flat);

      if (!slot) {
        const visitor = await Visitor.create({
          visitorName,
          phone,
          vehicleNumber: normalizedVehicleNumber,
          purpose,
          hostResident: resident.name,
          hostFlat: normalizeFlat(resident.flat),
          createdByRole: "resident",
          status: "parking_unavailable",
        });

        await createNotification({
          title: "Visitor invite recorded",
          message: `${visitor.visitorName} was invited, but parking could not be allotted.`,
          type: "warning",
          category: "parking",
          targetFlats: [resident.flat],
          link: "/dashboard/history",
          metadata: { visitorId: visitor._id, vehicleNumber: normalizedVehicleNumber },
        });

        await createNotification({
          title: "Visitor parking unavailable",
          message: `${visitor.visitorName} was invited for flat ${normalizeFlat(resident.flat)}, but no parking could be allotted.`,
          type: "warning",
          category: "parking",
          targetRoles: ["admin"],
          link: "/admin/activity",
          metadata: { visitorId: visitor._id, vehicleNumber: normalizedVehicleNumber },
        });

        return res.status(201).json({
          success: true,
          parkingUnavailable: true,
          message: "Visitor invite recorded, but parking could not be allotted",
          visitor,
        });
      }

      const visitor = await Visitor.create({
        visitorName,
        phone,
        vehicleNumber: normalizedVehicleNumber,
        purpose,
        hostResident: resident.name,
        hostFlat: normalizeFlat(resident.flat),
        slot: slot._id,
        createdByRole: "resident",
        status: "approved",
        entryTime: new Date(),
      });

      slot.status = "occupied";
      slot.assignedTo = normalizedVehicleNumber;

      await slot.save();

      await Vehicle.findOneAndUpdate(
        { number: normalizedVehicleNumber },
        {
          ownerName: visitorName,
          number: normalizedVehicleNumber,
          vehicleNumber: normalizedVehicleNumber,
          manufacturer: "Visitor",
          model: "Vehicle",
          vehicleType: "car",
          type: "car",
          flat: normalizeFlat(resident.flat),
          slot: slot._id,
          isParked: true,
          parkingCategory: "visitor",
          entrySource: "visitor_invite",
          entryTime: new Date(),
          exitTime: null,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      await createNotification({
        title: "Visitor invite approved",
        message: `${visitorName} was invited and allotted slot ${slot.slotNumber}.`,
        type: "success",
        category: "visitor",
        targetFlats: [resident.flat],
        link: "/dashboard/visitors",
        metadata: { visitorId: visitor._id, vehicleNumber: normalizedVehicleNumber },
      });

      await createNotification({
        title: "Resident invited visitor",
        message: `${visitorName} is approved for flat ${normalizeFlat(resident.flat)} and allotted slot ${slot.slotNumber}.`,
        type: "info",
        category: "visitor",
        targetRoles: ["guard"],
        link: "/guard/visitors",
        metadata: { visitorId: visitor._id, vehicleNumber: normalizedVehicleNumber },
      });

      await createNotification({
        title: "Resident invited visitor",
        message: `${visitorName} is approved for flat ${normalizeFlat(resident.flat)} and allotted slot ${slot.slotNumber}.`,
        type: "info",
        category: "visitor",
        targetRoles: ["admin"],
        link: "/admin/activity",
        metadata: { visitorId: visitor._id, vehicleNumber: normalizedVehicleNumber },
      });

      res.status(201).json({
        success: true,
        message: "Visitor approved and parking allocated",
        visitor,
        allottedSlot: slot,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Add resident vehicle with automatic slot allocation
router.post(
  "/add-vehicle",
  authMiddleware,
  roleMiddleware("resident", "admin"),
  async (req, res) => {
    try {
      const { manufacturer, model, vehicleType, vehicleNumber, flat } = req.body;

      if (!manufacturer || !model || !vehicleType || !vehicleNumber || !flat) {
        return res.status(400).json({
          success: false,
          message: "All vehicle fields are required",
        });
      }

      const resident = await User.findById(req.user.id);

      const normalizedVehicleNumber = normalizeVehicleNumber(vehicleNumber);
      const normalizedFlat = normalizeFlat(flat);

      const existingVehicle = await Vehicle.findOne({
        number: normalizedVehicleNumber,
      });

      if (existingVehicle) {
        return res.status(400).json({
          success: false,
          message: "Vehicle already exists",
        });
      }

      let slot = await require("../utils/parkingAllocator").findResidentVehicleSlot(
        normalizedFlat
      );

      if (!slot) {
        return res.status(400).json({
          success: false,
          message: "No parking slot available",
        });
      }

      const vehicle = await Vehicle.create({
        manufacturer,
        model,
        vehicleType,
        type: vehicleType,
        number: normalizedVehicleNumber,
        vehicleNumber: normalizedVehicleNumber,
        flat: normalizedFlat,
        ownerName: resident.name,
        owner: resident._id,
        slot: slot._id,
        isParked: true,
        parkingCategory: "resident",
        entrySource: "resident",
        entryTime: new Date(),
        exitTime: null,
      });

      slot.status = "occupied";
      slot.assignedTo = normalizedVehicleNumber;

      await slot.save();

      await createNotification({
        title: "Resident vehicle added",
        message: `${normalizedVehicleNumber} was added and allotted slot ${slot.slotNumber}.`,
        type: "success",
        category: "vehicle",
        targetFlats: [normalizedFlat],
        link: "/dashboard/vehicles",
        metadata: { vehicleId: vehicle._id, vehicleNumber: normalizedVehicleNumber },
      });

      await createNotification({
        title: "Resident vehicle added",
        message: `${normalizedVehicleNumber} was added for flat ${normalizedFlat} and allotted slot ${slot.slotNumber}.`,
        type: "info",
        category: "vehicle",
        targetRoles: ["admin"],
        link: "/admin/activity",
        metadata: { vehicleId: vehicle._id, vehicleNumber: normalizedVehicleNumber },
      });

      res.status(201).json({
        success: true,
        message: "Vehicle added successfully",
        vehicle,
        slot,
        allocatedSlot: slot,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error adding resident vehicle",
        error: error.message,
      });
    }
  }
);

module.exports = router;
