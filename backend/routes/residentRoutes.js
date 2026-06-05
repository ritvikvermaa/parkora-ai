const express = require("express");
const router = express.Router();

const User = require("../models/user");
const Vehicle = require("../models/vehicle");
const Visitor = require("../models/visitor");
const ParkingSlot = require("../models/parkingSlot");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Resident dashboard data
router.get(
  "/dashboard",
  authMiddleware,
  roleMiddleware("resident", "admin"),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select("-password");

      const vehicles = await Vehicle.find({
        ownerName: user.name,
      }).populate("slot", "slotNumber tower floor type status");

      const activeVehicles = await Vehicle.countDocuments({
        ownerName: user.name,
        exitTime: null,
      });

      const assignedSlots = await ParkingSlot.find({
        assignedTo: { $regex: user.name, $options: "i" },
      });

      const visitors = await Visitor.find({
        hostResident: { $regex: user.name, $options: "i" },
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

router.post(
  "/invite-visitor",
  authMiddleware,
  roleMiddleware("resident", "admin"),
  async (req, res) => {
    try {

      const {
        visitorName,
        phone,
        vehicleNumber,
        purpose
      } = req.body;

      const resident =
        await User.findById(req.user.id);

      const slot =
        await ParkingSlot.findOne({

          type: "visitor",

          status: "available"

        });

      if (!slot) {

        return res.status(400).json({

          success: false,

          message: "No visitor slots available"

        });

      }

      const visitor =
        await Visitor.create({

          visitorName,

          phone,

          vehicleNumber,

          purpose,

          hostResident: resident.name,

          slot: slot._id,

          status: "pending"

        });

      slot.status = "reserved";

      slot.assignedTo = visitorName;

      await slot.save();

      res.status(201).json({

        success: true,

        message: "Visitor request sent",

        visitor,

        allottedSlot: slot

      });

    } catch (error) {

      res.status(500).json({

        success: false,

        message: error.message

      });

    }
  }
);

module.exports = router;