require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const patientRoutes = require("./routes/patientRoutes");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Serveur en écoute sur http://localhost:${PORT}`)
);