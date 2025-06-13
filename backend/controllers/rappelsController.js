const Rappel = require('../models/Rappel');
const pool = require('../config/db'); // ou le chemin vers ton fichier de configuration PostgreSQL


exports.getRappelsForLoggedInPatient = async (req, res) => {
  try {
    const id_patient = req.userId;
    const rappels = await Rappel.findByPatient(id_patient);
    res.json(rappels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getRappelsForLoggedInAidant = async (req, res) => {
  try {
    const id_aidant = req.userId;
    console.log("id_aidant Controllers:", id_aidant);
    const rappels = await Rappel.findByAidant(id_aidant);
    console.log("Rappels trouvés :", rappels);
    res.status(200).json(rappels);
  } catch (err) {
    console.error("Erreur complète :", err.stack || err);
    res.status(500).json({ error: "Erreur serveur" });
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

// controllers/rappelsController.js
exports.createRappel = async (req, res) => {
  try {
    const {
      description,
      type_rappel,
      date_rappel,
      heure_rappel,
      confirmer_rappel,
      ispinned,
      id_patient,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO rappels
       (id_patient, description, type_rappel, date_rappel, heure_rappel, confirmer_rappel, ispinned)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [id_patient, description, type_rappel, date_rappel, heure_rappel, confirmer_rappel, ispinned]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur createRappel:', err);
    res.status(500).json({ error: err.message });
  }
};


exports.updateRappel = async (req, res) => {
  try {
    const id = req.params.id_rappel;
    const { description, type_rappel, date_rappel, heure_rappel, confirmer_rappel, ispinned } = req.body;

    if (!description || !type_rappel || !date_rappel || !heure_rappel) {
      return res.status(400).json({ error: 'Champs requis manquants' });
    }

    const result = await pool.query(
      `UPDATE rappels 
       SET description = $1, type_rappel = $2, date_rappel = $3, heure_rappel = $4, confirmer_rappel = $5, ispinned = $6
       WHERE id_rappel = $7 
       RETURNING *`,
      [description, type_rappel, date_rappel, heure_rappel, confirmer_rappel, ispinned, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rappel non trouvé' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Erreur updateRappel:', err);
    res.status(500).json({ error: err.message });
  }
};


exports.deleteRappel = async (req, res) => {
  try {
    await pool.query('DELETE FROM rappels WHERE id_rappel = $1', [req.params.id_rappel]);
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur deleteRappel:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};




