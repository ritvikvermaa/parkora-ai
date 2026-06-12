const express = require("express");
const router = express.Router();

const Vehicle = require("../models/vehicle");
const ParkingSlot = require("../models/parkingSlot");
const Visitor = require("../models/visitor");
const User = require("../models/user");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  normalizeFlat,
  normalizeVehicleNumber,
  findResidentVehicleSlot,
  flatAliases,
} = require("../utils/parkingAllocator");
const { canonicalFlat } = require("../utils/society");
const { approvedUserFilter } = require("../utils/userStatus");
const { createNotification } = require("../utils/notifications");

/* ENTRY */

router.post(
  "/entry",
  authMiddleware,
  roleMiddleware("guard", "admin"),
  async (req, res) => {
    try {
      const {
        ownerName,
        vehicleNumber,
        vehicleType,
        type,
        block,
        flat,
        phone,
        purpose,
      } = req.body;

      const finalVehicleType =
        vehicleType || type;

      const normalizedVehicleNumber = normalizeVehicleNumber(vehicleNumber);
      const normalizedFlat = canonicalFlat(flat, block);

      if (
        !ownerName ||
        !normalizedVehicleNumber ||
        !finalVehicleType ||
        !normalizedFlat
      ) {
        return res.status(400).json({
          success: false,
          message: "Owner name, vehicle number, vehicle type and flat are required"
        });
      }

      const host = await User.findOne({
        role: "resident",
        ...approvedUserFilter,
        flat: { $in: flatAliases(normalizedFlat) },
      });

      if (!host) {
        return res.status(404).json({
          success: false,
          message: "No approved resident found for this flat",
        });
      }

      const visitor = await Visitor.create({
        visitorName: ownerName,
        phone: phone || "N/A",
        vehicleNumber: normalizedVehicleNumber,
        hostResident: host?.name || normalizedFlat,
        hostFlat: normalizedFlat,
        purpose: purpose || "Guard entry approval",
        createdByRole: req.user.role,
        status: "pending",
      });

      await createNotification({
        title: "Visitor approval needed",
        message: `${visitor.visitorName} is waiting for approval at flat ${normalizedFlat}.`,
        type: "warning",
        category: "visitor",
        targetUsers: [host._id],
        targetFlats: [normalizedFlat],
        link: "/dashboard/requests",
        metadata: { visitorId: visitor._id, vehicleNumber: normalizedVehicleNumber },
      });

      res.status(201).json({

        success: true,

        message: "Entry request sent to resident for approval",

        visitor

      })

    } catch (error) {

      console.log(
        "Vehicle entry error:",
        error
      )

      res.status(500).json({

        success: false,

        message: error.message

      })

    }
  }
);

/* RESIDENT ADD */

router.post(
  "/resident/add",
  authMiddleware,
  roleMiddleware("resident", "admin"),
  async (req, res) => {

    try {

      const {

        ownerName,

        vehicleNumber,

        vehicleType,

        type,

        manufacturer,

        model,

        flat

      } = req.body;


      const finalVehicleType =
        vehicleType || type;

      const normalizedVehicleNumber =
        normalizeVehicleNumber(vehicleNumber);

      const normalizedFlat =
        normalizeFlat(flat);


      const existingVehicle =
        await Vehicle.findOne({

          number:
            normalizedVehicleNumber

        })


      if (existingVehicle) {

        return res.status(400).json({

          success: false,

          message:
            "Vehicle already exists"

        })

      }


      const slot =
        await findResidentVehicleSlot(
          normalizedFlat
        )


      if (!slot) {

        return res.status(400).json({

          success: false,

          message:
            "No parking slot available"

        })

      }


      const vehicle =
        await Vehicle.create({

          ownerName,

          number:
            normalizedVehicleNumber,

          vehicleNumber:
            normalizedVehicleNumber,

          vehicleType:
            finalVehicleType,

          type:
            finalVehicleType,

          manufacturer,

          model,

          flat:
            normalizedFlat,

          slot:
            slot._id,

          isParked: true,

          parkingCategory: "resident",

          entrySource: req.user.role === "admin" ? "admin" : "resident",

          entryTime:
            new Date(),

          exitTime: null

        })


      slot.status =
        "occupied";

      slot.assignedTo =
        normalizedVehicleNumber;

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

        message:
          "Vehicle added",

        vehicle,

        slot

      })


    } catch (error) {

      console.log(
        "Resident add vehicle error:",
        error
      )

      res.status(500).json({

        success: false,

        message: error.message

      })

    }

  })

/* RESIDENT REMOVE */

router.delete(
  "/resident/:id",
  authMiddleware,
  roleMiddleware("resident", "admin"),
  async (req, res) => {
    try {
      const vehicle = await Vehicle.findById(req.params.id);

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: "Vehicle not found",
        });
      }

      const user = await User.findById(req.user.id);
      const vehicleCategory =
        vehicle.parkingCategory ||
        (vehicle.manufacturer === "Visitor" ? "visitor" : "resident");

      if (vehicleCategory !== "resident") {
        return res.status(400).json({
          success: false,
          message: "Only resident-owned vehicles can be removed here",
        });
      }

      if (
        req.user.role !== "admin" &&
        String(vehicle.owner || "") !== String(user._id) &&
        !flatAliases(user.flat, user.block).includes(normalizeFlat(vehicle.flat))
      ) {
        return res.status(403).json({
          success: false,
          message: "You can remove only vehicles linked to your flat",
        });
      }

      if (vehicle.slot) {
        const slot = await ParkingSlot.findById(vehicle.slot);

        if (slot) {
          slot.status = slot.isReservedForFlat ? "reserved" : "available";
          slot.assignedTo = null;
          await slot.save();
        }
      }

      await Vehicle.findByIdAndDelete(vehicle._id);

      await createNotification({
        title: "Resident vehicle removed",
        message: `${vehicle.vehicleNumber || vehicle.number} was removed and its slot was released.`,
        type: "info",
        category: "vehicle",
        targetFlats: [vehicle.flat],
        link: "/dashboard/vehicles",
        metadata: { vehicleId: vehicle._id, vehicleNumber: vehicle.vehicleNumber || vehicle.number },
      });

      await createNotification({
        title: "Resident vehicle removed",
        message: `${vehicle.vehicleNumber || vehicle.number} was removed from flat ${vehicle.flat || "N/A"}.`,
        type: "info",
        category: "vehicle",
        targetRoles: ["admin"],
        link: "/admin/activity",
        metadata: { vehicleId: vehicle._id, vehicleNumber: vehicle.vehicleNumber || vehicle.number },
      });

      res.json({
        success: true,
        message: "Vehicle removed and parking released",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/* EXIT */

router.post(
  "/exit",

  authMiddleware,

  roleMiddleware(
    "guard",
    "admin"
  ),

  async (req, res) => {

    try {

      const {
        vehicleNumber
      } = req.body;

      const normalizedVehicleNumber =
        normalizeVehicleNumber(vehicleNumber);

      const vehicle =
        await Vehicle.findOne({

          number:
            normalizedVehicleNumber,

          isParked: true

        })

      if (!vehicle) {

        return res.status(404).json({

          success: false,

          message:
            "Vehicle not found"

        })

      }

      const vehicleCategory =
        vehicle.parkingCategory ||
        (vehicle.manufacturer === "Visitor" ? "visitor" : "resident");

      if (req.user.role === "guard" && vehicleCategory === "resident") {
        return res.status(403).json({
          success: false,
          message: "Resident-owned vehicles can only be managed by residents or admins",
        });
      }

      vehicle.isParked =
        false;

      vehicle.exitTime =
        new Date();

      await vehicle.save();

      await Visitor.findOneAndUpdate(
        {
          vehicleNumber: normalizedVehicleNumber,
          status: "approved",
        },
        {
          status: "exited",
          exitTime: vehicle.exitTime,
        },
        { sort: { entryTime: -1 } }
      );

      const slot =
        await ParkingSlot.findById(
          vehicle.slot
        )

      if (slot) {

        slot.status =
          "available";

        slot.assignedTo =
          null;

        await slot.save();

      }

      if (vehicleCategory === "visitor") {
        await createNotification({
          title: "Visitor exit recorded",
          message: `${vehicle.vehicleNumber || vehicle.number} exited and slot ${slot?.slotNumber || "N/A"} was released.`,
          type: "info",
          category: "visitor",
          targetFlats: [vehicle.flat],
          link: "/dashboard/history",
          metadata: { vehicleId: vehicle._id, vehicleNumber: vehicle.vehicleNumber || vehicle.number },
        });

        await createNotification({
          title: "Visitor exit recorded",
          message: `${vehicle.vehicleNumber || vehicle.number} exited and slot ${slot?.slotNumber || "N/A"} was released.`,
          type: "info",
          category: "visitor",
          targetRoles: ["guard"],
          link: "/guard/visitors",
          metadata: { vehicleId: vehicle._id, vehicleNumber: vehicle.vehicleNumber || vehicle.number },
        });
      } else {
        await createNotification({
          title: "Resident vehicle exit recorded",
          message: `${vehicle.vehicleNumber || vehicle.number} exited and slot ${slot?.slotNumber || "N/A"} was released.`,
          type: "info",
          category: "vehicle",
          targetFlats: [vehicle.flat],
          link: "/dashboard/vehicles",
          metadata: { vehicleId: vehicle._id, vehicleNumber: vehicle.vehicleNumber || vehicle.number },
        });
      }

      await createNotification({
        title: "Vehicle exit recorded",
        message: `${vehicle.vehicleNumber || vehicle.number} exited and slot ${slot?.slotNumber || "N/A"} was released.`,
        type: "info",
        category: "vehicle",
        targetRoles: ["admin"],
        link: "/admin/activity",
        metadata: { vehicleId: vehicle._id, vehicleNumber: vehicle.vehicleNumber || vehicle.number },
      });

      res.json({

        success: true,

        vehicle

      })

    } catch (error) {

      res.status(500).json({

        success: false,

        message: error.message

      })

    }

  })

/* ACTIVE */

router.get(
  "/active",

  authMiddleware,

  roleMiddleware(
    "guard",
    "admin"
  ),

  async (req, res) => {

    try {

      const vehicles =
        await Vehicle.find({

          isParked: true

        })
          .populate("slot")
          .sort({

            entryTime: -1

          })

      res.json({

        success: true,

        vehicles,

        count:
          vehicles.length

      })

    } catch (error) {

      res.status(500).json({

        success: false,

        message: error.message

      })

    }

  })

module.exports =
  router;
