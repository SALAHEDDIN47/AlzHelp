// backend/routes/patientRoutes.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: "Route patients fonctionnelle" });
});

module.exports = router;