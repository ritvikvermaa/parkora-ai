const mongoose = require("mongoose");

const parkingSlotSchema = new mongoose.Schema(
  {
    slotNumber: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ["resident", "visitor", "reserved"],
      default: "resident",
    },
    status: {
      type: String,
      enum: ["available", "occupied", "reserved"],
      default: "available",
    },
    tower: {
      type: String,
      default: "A",
    },
    floor: {
      type: String,
      default: "Ground",
    },
    assignedTo: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.ParkingSlot || mongoose.model("ParkingSlot", parkingSlotSchema);