require("dotenv").config();

const express = require("express");
const cors = require("cors");
require("./config/initDb");

const employeeRoutes = require("./routes/employeeRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "HRMS backend is running" });
});

app.use("/employees", employeeRoutes);
app.use("/auth", authRoutes);

module.exports = app;