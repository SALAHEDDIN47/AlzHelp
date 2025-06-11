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
// PUT /rappels/:id/pin
exports.togglePin = async (req, res) => {
   console.log("req.params:", req.params);
  const { id_rappel } = req.params;
  console.log("id togglepin:",id_rappel);
  try {
    const ispinned = await Rappel.togglePin(id_rappel);
    res.json({ success: true, ispinned });
  } catch (err) {
    console.error("Erreur togglePin:", err.message);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
// Exemple dans RappelController
exports.toggleConfirm = async (req, res) => {
  const { id_rappel } = req.params;
   console.log("id confirm rappel :",id_rappel);
  try {
    const est_confirmer = await Rappel.toggleConfirm(id_rappel);
    res.json({ success: true, est_confirmer });
  } catch (err) {
    console.error("Erreur toggleconfirm:", err.message);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};




