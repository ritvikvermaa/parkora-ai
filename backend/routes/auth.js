const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const { isLegacyApprovedUser } = require("../utils/userStatus");
const { canonicalFlat } = require("../utils/society");
const { createNotification } = require("../utils/notifications");

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, flat, phone, block } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const finalRole = role || "resident";

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: finalRole,
      flat: flat ? canonicalFlat(flat, block) : "",
      phone: phone || "",
      block: block || "",
      approvalStatus: finalRole === "admin" ? "approved" : "pending",
    });

    if (user.approvalStatus === "pending") {
      await createNotification({
        title: "New registration request",
        message: `${user.name} requested resident access for flat ${user.flat || "not assigned"}.`,
        type: "warning",
        category: "registration",
        targetRoles: ["admin"],
        link: "/admin/approvals",
        metadata: { userId: user._id, flat: user.flat },
      });
    }

    res.status(201).json({
      success: true,
      message:
        user.approvalStatus === "approved"
          ? "User registered successfully"
          : "Registration sent to admin for approval",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        approvalStatus: user.approvalStatus,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    const rawUser = await User.collection.findOne({ _id: user._id });

    if (
      (user.role === "admin" || isLegacyApprovedUser(rawUser)) &&
      user.approvalStatus !== "approved"
    ) {
      user.approvalStatus = "approved";
      await user.save();
    }

    if (user.approvalStatus !== "approved") {
      return res.status(403).json({
        success: false,
        message:
          user.approvalStatus === "rejected"
            ? "Your registration request was rejected"
            : "Your registration is pending admin approval",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET || "parkora_secret",
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        flat: canonicalFlat(user.flat, user.block),
        approvalStatus: user.approvalStatus,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
});

module.exports = router;
