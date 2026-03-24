require("dotenv").config();

const express = require("express");
const cors = require("cors");

const employeeRoutes = require("./routes/employeeRoutes");
const authRoutes = require("./routes/authRoutes");
const salaryRoutes = require("./routes/salaryRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "HRMS backend is running" });
});

app.use("/employees", employeeRoutes);
app.use("/auth", authRoutes);
app.use("/salary", salaryRoutes);
app.use("/leave", leaveRoutes);

module.exports = app;