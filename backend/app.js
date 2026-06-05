const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const parkingSlotRoutes = require("./routes/parkingSlotRoutes");
app.use("/api/slots", parkingSlotRoutes);

const vehicleRoutes = require("./routes/vehicleRoutes");
app.use("/api/vehicles", vehicleRoutes);

const aiRoutes = require("./routes/aiRoutes");
app.use("/api/ai", aiRoutes);

const visitorRoutes = require("./routes/visitorRoutes");
app.use("/api/visitors", visitorRoutes);

const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);

const residentRoutes = require("./routes/residentRoutes");
app.use("/api/resident", residentRoutes);

app.get("/", (req, res) => {
  res.send("Parkora AI Backend is running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Parkora AI Backend running on http://localhost:${PORT}`);
});