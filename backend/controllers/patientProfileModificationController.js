const PatientProfileModification = require('../models/PatientProfileModification');
const pool = require('../config/db');

// Créer une modification en attente
exports.createModification = async (req, res) => {
  try {
    const { patientId, oldData, newData } = req.body;
    
    if (!patientId || !oldData || !newData) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    const modification = await PatientProfileModification.create(patientId, oldData, newData);
    
    res.status(201).json({
      success: true,
      message: 'Modification en attente créée',
      modification
    });
  } catch (error) {
    console.error('Erreur création modification patient:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtenir toutes les modifications en attente
exports.getPendingModifications = async (req, res) => {
  try {
    const modifications = await PatientProfileModification.getAllPending();
    
    res.json({
      success: true,
      modifications
    });
  } catch (error) {
    console.error('Erreur récupération modifications patient:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtenir les modifications en attente d'un patient spécifique
exports.getPendingByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const modifications = await PatientProfileModification.getPendingByPatient(patientId);
    
    res.json({
      success: true,
      modifications
    });
  } catch (error) {
    console.error('Erreur récupération modifications patient:', error);
    res.status(500).json({ error: error.message });
  }
};

// Approuver une modification
exports.approveModification = async (req, res) => {
  try {
    const { modificationId } = req.params;
    
    // Récupérer la modification
    const modification = await PatientProfileModification.getById(modificationId);
    if (!modification) {
      return res.status(404).json({ error: 'Modification non trouvée' });
    }
    
    if (modification.status !== 'pending') {
      return res.status(400).json({ error: 'Modification déjà traitée' });
    }

    // Marquer comme approuvée
    const approvedModification = await PatientProfileModification.approve(modificationId);
    
    // Appliquer les modifications au profil du patient
    const updateQuery = `
      UPDATE patients 
      SET nompatient = $1, 
          prenompatient = $2, 
          emailpatient = $3,
          telephpatient = $4,
          adresspat = $5,
          datenaissance = $6,
          profile_image = COALESCE($7, profile_image)
      WHERE id_patient = $8
    `;
    
    await pool.query(updateQuery, [
      modification.new_nom,
      modification.new_prenom,
      modification.new_email,
      modification.new_telephone,
      modification.new_adresse,
      modification.new_date_naissance,
      modification.new_profile_image,
      modification.patient_id
    ]);

    res.json({
      success: true,
      message: 'Modification approuvée et appliquée',
      modification: approvedModification
    });
  } catch (error) {
    console.error('Erreur approbation modification patient:', error);
    res.status(500).json({ error: error.message });
  }
};

// Rejeter une modification
exports.rejectModification = async (req, res) => {
  try {
    const { modificationId } = req.params;
    
    const modification = await PatientProfileModification.getById(modificationId);
    if (!modification) {
      return res.status(404).json({ error: 'Modification non trouvée' });
    }
    
    if (modification.status !== 'pending') {
      return res.status(400).json({ error: 'Modification déjà traitée' });
    }

    const rejectedModification = await PatientProfileModification.reject(modificationId);
    
    res.json({
      success: true,
      message: 'Modification rejetée',
      modification: rejectedModification
    });
  } catch (error) {
    console.error('Erreur rejet modification patient:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtenir une modification par ID
exports.getModificationById = async (req, res) => {
  try {
    const { modificationId } = req.params;
    
    const modification = await PatientProfileModification.getById(modificationId);
    if (!modification) {
      return res.status(404).json({ error: 'Modification non trouvée' });
    }
    
    res.json({
      success: true,
      modification
    });
  } catch (error) {
    console.error('Erreur récupération modification patient:', error);
    res.status(500).json({ error: error.message });
  }
};

// Nettoyer les anciennes modifications
exports.cleanupOldModifications = async (req, res) => {
  try {
    await PatientProfileModification.cleanupOld();
    
    res.json({
      success: true,
      message: 'Nettoyage terminé'
    });
  } catch (error) {
    console.error('Erreur nettoyage modifications patient:', error);
    res.status(500).json({ error: error.message });
  }
}; 