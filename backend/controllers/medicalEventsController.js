const pool = require('../config/db');

// Récupérer tous les événements médicaux d'un patient avec le lien familial
exports.getEventsByPatientId = async (req, res) => {
  const { patientId } = req.params;
  
  console.log("Récupération des événements médicaux pour le patient:", patientId);
  
  if (!patientId) {
    console.error("ID patient manquant");
    return res.status(400).json({ error: "ID patient requis" });
  }

  try {
    // Requête SQL modifiée pour gérer le cas où il n'y a pas d'accompagnement
    const query = `
      SELECT em.*, a.lien_familial
      FROM evenements_medicaux em
      LEFT JOIN accompagnements a ON em.id_patient = a.id_patient
      WHERE em.id_patient = $1
      ORDER BY em.date_event DESC
    `;
    
    const result = await pool.query(query, [patientId]);
    console.log(`Événements trouvés: ${result.rows.length}`);
    
    // Toujours renvoyer un tableau, même vide
    res.status(200).json(result.rows || []);
  } catch (error) {
    console.error("Erreur lors de la récupération des événements médicaux:", error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des événements médicaux" });
  }
};

// Créer un nouvel événement médical
exports.createEvent = async (req, res) => {
  const { patientId } = req.params;
  const { titre, description, date_event, fichier_path, fichier_type } = req.body;
  
  if (!patientId || !titre || !date_event) {
    return res.status(400).json({ error: "Données incomplètes" });
  }
  
  try {
    const query = `
      INSERT INTO evenements_medicaux 
      (id_patient, titre, description, date_event, fichier_path, fichier_type)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [patientId, titre, description, date_event, fichier_path, fichier_type];
    const result = await pool.query(query, values);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Erreur lors de la création d'un événement médical:", error);
    res.status(500).json({ error: "Erreur serveur lors de la création d'un événement médical" });
  }
};

// Mettre à jour un événement médical
exports.updateEvent = async (req, res) => {
  const { eventId } = req.params;
  const { titre, description, date_event, fichier_path, fichier_type } = req.body;
  
  if (!eventId) {
    return res.status(400).json({ error: "ID événement requis" });
  }
  
  try {
    const query = `
      UPDATE evenements_medicaux
      SET titre = COALESCE($1, titre),
          description = COALESCE($2, description),
          date_event = COALESCE($3, date_event),
          fichier_path = COALESCE($4, fichier_path),
          fichier_type = COALESCE($5, fichier_type)
      WHERE id_event = $6
      RETURNING *
    `;
    
    const values = [titre, description, date_event, fichier_path, fichier_type, eventId];
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Événement non trouvé" });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Erreur lors de la mise à jour d'un événement médical:", error);
    res.status(500).json({ error: "Erreur serveur lors de la mise à jour d'un événement médical" });
  }
};

// Supprimer un événement médical
exports.deleteEvent = async (req, res) => {
  const { eventId } = req.params;
  
  if (!eventId) {
    return res.status(400).json({ error: "ID événement requis" });
  }
  
  try {
    const query = `
      DELETE FROM evenements_medicaux
      WHERE id_event = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [eventId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Événement non trouvé" });
    }
    
    res.status(200).json({ message: "Événement supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression d'un événement médical:", error);
    res.status(500).json({ error: "Erreur serveur lors de la suppression d'un événement médical" });
  }
};


