const ProfileModification = require('../models/ProfileModification');
const pool = require('../config/db');

// Créer une modification en attente
exports.createModification = async (req, res) => {
  try {
    const { aidantId, oldData, newData } = req.body;
    
    if (!aidantId || !oldData || !newData) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    const modification = await ProfileModification.create(aidantId, oldData, newData);
    
    res.status(201).json({
      success: true,
      message: 'Modification en attente créée',
      modification
    });
  } catch (error) {
    console.error('Erreur création modification:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtenir toutes les modifications en attente
exports.getPendingModifications = async (req, res) => {
  try {
    const modifications = await ProfileModification.getAllPending();
    
    res.json({
      success: true,
      modifications
    });
  } catch (error) {
    console.error('Erreur récupération modifications:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtenir les modifications en attente d'un aidant spécifique
exports.getPendingByAidant = async (req, res) => {
  try {
    const { aidantId } = req.params;
    const modifications = await ProfileModification.getPendingByAidant(aidantId);
    
    res.json({
      success: true,
      modifications
    });
  } catch (error) {
    console.error('Erreur récupération modifications aidant:', error);
    res.status(500).json({ error: error.message });
  }
};

// Approuver une modification
exports.approveModification = async (req, res) => {
  try {
    const { modificationId } = req.params;
    
    // Récupérer la modification
    const modification = await ProfileModification.getById(modificationId);
    if (!modification) {
      return res.status(404).json({ error: 'Modification non trouvée' });
    }
    
    if (modification.status !== 'pending') {
      return res.status(400).json({ error: 'Modification déjà traitée' });
    }

    // Marquer comme approuvée
    const approvedModification = await ProfileModification.approve(modificationId);
    
    // Appliquer les modifications au profil de l'aidant
    const updateQuery = `
      UPDATE aidants 
      SET nomaidant = $1, 
          prenomaidant = $2, 
          emailaidant = $3,
          telephaidant = $4,
          d_naissanceaidant = $5,
          image_url = COALESCE($6, image_url)
      WHERE id_aidant = $7
    `;
    
    await pool.query(updateQuery, [
      modification.new_nom,
      modification.new_prenom,
      modification.new_email,
      modification.new_telephone,
      modification.new_date_naissance,
      modification.new_image_url,
      modification.aidant_id
    ]);

    res.json({
      success: true,
      message: 'Modification approuvée et appliquée',
      modification: approvedModification
    });
  } catch (error) {
    console.error('Erreur approbation modification:', error);
    res.status(500).json({ error: error.message });
  }
};

// Rejeter une modification
exports.rejectModification = async (req, res) => {
  try {
    const { modificationId } = req.params;
    
    const modification = await ProfileModification.getById(modificationId);
    if (!modification) {
      return res.status(404).json({ error: 'Modification non trouvée' });
    }
    
    if (modification.status !== 'pending') {
      return res.status(400).json({ error: 'Modification déjà traitée' });
    }

    const rejectedModification = await ProfileModification.reject(modificationId);
    
    res.json({
      success: true,
      message: 'Modification rejetée',
      modification: rejectedModification
    });
  } catch (error) {
    console.error('Erreur rejet modification:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtenir une modification par ID
exports.getModificationById = async (req, res) => {
  try {
    const { modificationId } = req.params;
    
    const modification = await ProfileModification.getById(modificationId);
    if (!modification) {
      return res.status(404).json({ error: 'Modification non trouvée' });
    }
    
    res.json({
      success: true,
      modification
    });
  } catch (error) {
    console.error('Erreur récupération modification:', error);
    res.status(500).json({ error: error.message });
  }
};

// Nettoyer les anciennes modifications
exports.cleanupOldModifications = async (req, res) => {
  try {
    await ProfileModification.cleanupOld();
    
    res.json({
      success: true,
      message: 'Nettoyage terminé'
    });
  } catch (error) {
    console.error('Erreur nettoyage modifications:', error);
    res.status(500).json({ error: error.message });
  }
}; 