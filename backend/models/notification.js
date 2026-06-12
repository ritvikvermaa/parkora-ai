const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["info", "success", "warning", "destructive"],
      default: "info",
    },
    category: {
      type: String,
      enum: ["registration", "visitor", "parking", "vehicle", "settings", "system"],
      default: "system",
    },
    targetRoles: [
      {
        type: String,
        enum: ["admin", "guard", "resident"],
      },
    ],
    targetUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    targetFlats: [
      {
        type: String,
      },
    ],
    link: {
      type: String,
      default: "",
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
