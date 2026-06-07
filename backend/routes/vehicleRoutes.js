const express = require("express");
const router = express.Router();

const Vehicle = require("../models/vehicle");
const ParkingSlot = require("../models/parkingSlot");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const findVisitorOrFallbackSlot = async () => {
  let slot = await ParkingSlot.findOne({
    isActive: true,
    type: "visitor",
    status: "available",
  }).sort({ blockCode: 1, tower: 1, slotNumber: 1 });

  if (slot) return slot;

  slot = await ParkingSlot.findOne({
    isActive: true,
    type: "resident",
    status: "available",
    isReservedForFlat: false,
    allowVisitorFallback: true,
  }).sort({ blockCode: 1, tower: 1, slotNumber: 1 });

  return slot;
};

const findResidentVehicleSlot = async (flat) => {
  const normalizedFlat = flat.toUpperCase().trim();

  const flatWithoutBlock = normalizedFlat.includes("-")
    ? normalizedFlat.split("-")[1]
    : normalizedFlat;

  const blockCode = normalizedFlat.includes("-")
    ? normalizedFlat.split("-")[0]
    : null;

  let slot = await ParkingSlot.findOne({
    isActive: true,
    type: "resident",
    isReservedForFlat: true,
    status: { $in: ["available", "reserved"] },
    $or: [
      { reservedForFlat: normalizedFlat },
      { reservedForFlat: flatWithoutBlock },
      { flat: normalizedFlat },
      { flat: flatWithoutBlock },
      {
        blockCode: blockCode,
        flat: flatWithoutBlock,
      },
    ],
  }).sort({ blockCode: 1, tower: 1, slotNumber: 1 });

  if (slot) return slot;

  slot = await ParkingSlot.findOne({
    isActive: true,
    type: "visitor",
    status: "available",
  }).sort({ blockCode: 1, tower: 1, slotNumber: 1 });

  if (slot) return slot;

  slot = await ParkingSlot.findOne({
    isActive: true,
    type: "resident",
    status: "available",
    isReservedForFlat: false,
    allowVisitorFallback: true,
  }).sort({ blockCode: 1, tower: 1, slotNumber: 1 });

  return slot;
};

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
        flat,
        slotId,
      } = req.body;

      const finalVehicleType =
        vehicleType || type;

      const normalizedVehicleNumber =
        vehicleNumber
          ?.toUpperCase()
          .trim();

      if (
        !ownerName ||
        !normalizedVehicleNumber ||
        !finalVehicleType
      ) {
        return res.status(400).json({
          success: false,
          message: "Missing vehicle data"
        });
      }

      let slot;

      if (slotId) {

        slot =
          await ParkingSlot.findById(slotId);

      } else {

        slot =
          await findVisitorOrFallbackSlot();

      }

      if (!slot) {

        return res.status(400).json({
          success: false,
          message: "No slot available"
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

          flat:
            flat || null,

          slot:
            slot._id,

          isParked: true,

          entryTime:
            new Date(),

          exitTime: null

        })

      slot.status =
        "occupied";

      slot.assignedTo =
        normalizedVehicleNumber;

      await slot.save();

      res.status(201).json({

        success: true,

        vehicle,

        slot

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
        vehicleNumber
          .toUpperCase()
          .trim();

      const normalizedFlat =
        flat
          .toUpperCase()
          .trim();


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

          entryTime:
            new Date(),

          exitTime: null

        })


      slot.status =
        "occupied";

      slot.assignedTo =
        normalizedVehicleNumber;

      await slot.save();


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
        vehicleNumber
          .toUpperCase()
          .trim();

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

      vehicle.isParked =
        false;

      vehicle.exitTime =
        new Date();

      await vehicle.save();

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