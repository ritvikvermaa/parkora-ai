const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "guard", "resident"],
      default: "resident",
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    flat: {
      type: String,
      default: ""
    },
    phone: {
      type: String,
      default: "",
    },
    block: {
      type: String,
      enum: ["Jade", "Topaz", "Nest", "Opal", ""],
      default: "",
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.User || mongoose.model("User", userSchema);
