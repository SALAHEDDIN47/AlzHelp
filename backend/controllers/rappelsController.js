const Rappel = require('../models/Rappel');

exports.getRappelsForLoggedInPatient = async (req, res) => {
  try {
    const id_patient = req.userId;
    const rappels = await Rappel.findByPatient(id_patient);
    res.json(rappels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

