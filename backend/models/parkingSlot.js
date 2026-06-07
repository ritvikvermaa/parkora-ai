const mongoose = require("mongoose");

const parkingSlotSchema = new mongoose.Schema(
  {
    slotNumber: {
      type: String,
      required: true,
      unique: true,
    },

    block: {
      type: String,
      enum: ["Jade", "Topaz", "Nest", "Opal"],
      required: true,
    },

    blockCode: {
      type: String,
      enum: ["J", "T", "N", "O"],
      required: true,
    },

    tower: {
      type: String,
      required: true,
    },

    flat: {
      type: String,
      default: null,
    },

    floor: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["resident", "visitor"],
      required: true,
    },

    status: {
      type: String,
      enum: ["available", "occupied", "reserved"],
      default: "available",
    },

    isReservedForFlat: {
      type: Boolean,
      default: false,
    },

    reservedForFlat: {
      type: String,
      default: null,
    },

    assignedTo: {
      type: String,
      default: null,
    },

    allowVisitorFallback: {
      type: Boolean,
      default: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.ParkingSlot ||
  mongoose.model("ParkingSlot", parkingSlotSchema);