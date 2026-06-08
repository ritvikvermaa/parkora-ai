const mongoose = require("mongoose");

const visitorSchema = new mongoose.Schema(
  {
    visitorName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    vehicleNumber: {
      type: String,
      required: true,
    },
    hostResident: {
      type: String,
      required: true,
    },
    hostFlat: {
      type: String,
      default: "",
    },
    createdByRole: {
      type: String,
      enum: ["resident", "guard", "admin", "public"],
      default: "public",
    },
    purpose: {
      type: String,
      default: "Guest Visit",
    },
    slot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ParkingSlot",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "parking_unavailable", "rejected", "exited"],
      default: "pending",
    },
    entryTime: {
      type: Date,
      default: null,
    },
    exitTime: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Visitor || mongoose.model("Visitor", visitorSchema);
