const pool = require('../config/db');

// Récupérer l'accompagnement d'un patient
exports.getAccompagnementByPatientId = async (req, res) => {
  const { patientId } = req.params;
  
  if (!patientId) {
    return res.status(400).json({ error: "ID patient requis" });
  }

  try {
    const query = `
      SELECT * FROM accompagnements 
      WHERE id_patient = $1
    `;
    
    const result = await pool.query(query, [patientId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Accompagnement non trouvé" });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'accompagnement:", error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération de l'accompagnement" });
  }
};

// Créer un nouvel accompagnement
exports.createAccompagnement = async (req, res) => {
  const { id_aidant, id_patient, lien_familial } = req.body;
  console.log("Données reçues pour la création d'un accompagnement:", req.body);
  
  if (!id_aidant || !id_patient || !lien_familial) {
    return res.status(400).json({ error: "Données incomplètes" });
  }
  
  try {
    const query = `
      INSERT INTO accompagnements 
      (id_aidant, id_patient, lien_familial)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const values = [id_aidant, id_patient, lien_familial];
    const result = await pool.query(query, values);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Erreur lors de la création d'un accompagnement:", error);
    res.status(500).json({ error: "Erreur serveur lors de la création d'un accompagnement" });
  }
};

// Mettre à jour un accompagnement
exports.updateAccompagnement = async (req, res) => {
  const { id } = req.params;
  const { lien_familial } = req.body;
  
  if (!id) {
    return res.status(400).json({ error: "ID accompagnement requis" });
  }
  
  try {
    const query = `
      UPDATE accompagnements
      SET lien_familial = COALESCE($1, lien_familial)
      WHERE id = $2
      RETURNING *
    `;
    
    const values = [lien_familial, id];
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Accompagnement non trouvé" });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Erreur lors de la mise à jour d'un accompagnement:", error);
    res.status(500).json({ error: "Erreur serveur lors de la mise à jour d'un accompagnement" });
  }
};

// Supprimer un accompagnement
exports.deleteAccompagnement = async (req, res) => {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({ error: "ID accompagnement requis" });
  }
  
  try {
    const query = `
      DELETE FROM accompagnements
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Accompagnement non trouvé" });
    }
    
    res.status(200).json({ message: "Accompagnement supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression d'un accompagnement:", error);
    res.status(500).json({ error: "Erreur serveur lors de la suppression d'un accompagnement" });
  }
};