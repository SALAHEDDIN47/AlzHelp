const pool = require('../config/db');

class ProfileModification {
  // Créer une nouvelle modification en attente
  static async create(aidantId, oldData, newData) {
    const query = `
      INSERT INTO profile_modifications 
      (aidant_id, old_nom, old_prenom, old_email, old_telephone, old_date_naissance, old_image_url,
       new_nom, new_prenom, new_email, new_telephone, new_date_naissance, new_image_url, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending')
      RETURNING *
    `;
    
    const values = [
      aidantId,
      oldData.nom,
      oldData.prenom,
      oldData.email,
      oldData.telephone,
      oldData.dateNaissance,
      oldData.image_url,
      newData.nom,
      newData.prenom,
      newData.email,
      newData.telephone,
      newData.dateNaissance,
      newData.image_url
    ];
    
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  // Obtenir toutes les modifications en attente pour un aidant
  static async getPendingByAidant(aidantId) {
    const query = `
      SELECT * FROM profile_modifications 
      WHERE aidant_id = $1 AND status = 'pending'
      ORDER BY created_at DESC
    `;
    const { rows } = await pool.query(query, [aidantId]);
    return rows;
  }

  // Obtenir toutes les modifications en attente pour tous les aidants
  static async getAllPending() {
    const query = `
      SELECT pm.*, 
             a.nomaidant as current_nom, 
             a.prenomaidant as current_prenom,
             a.image_url as current_image_url
      FROM profile_modifications pm
      JOIN aidants a ON pm.aidant_id = a.id_aidant
      WHERE pm.status = 'pending'
      ORDER BY pm.created_at DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  // Approuver une modification
  static async approve(modificationId) {
    const query = `
      UPDATE profile_modifications 
      SET status = 'approved', approved_at = NOW()
      WHERE id = $1 AND status = 'pending'
      RETURNING *
    `;
    const { rows } = await pool.query(query, [modificationId]);
    return rows[0];
  }

  // Rejeter une modification
  static async reject(modificationId) {
    const query = `
      UPDATE profile_modifications 
      SET status = 'rejected', rejected_at = NOW()
      WHERE id = $1 AND status = 'pending'
      RETURNING *
    `;
    const { rows } = await pool.query(query, [modificationId]);
    return rows[0];
  }

  // Obtenir une modification par ID
  static async getById(modificationId) {
    const query = `
      SELECT pm.*, 
             a.nomaidant as current_nom, 
             a.prenomaidant as current_prenom,
             a.image_url as current_image_url
      FROM profile_modifications pm
      JOIN aidants a ON pm.aidant_id = a.id_aidant
      WHERE pm.id = $1
    `;
    const { rows } = await pool.query(query, [modificationId]);
    return rows[0];
  }

  // Supprimer les anciennes modifications (plus de 30 jours)
  static async cleanupOld() {
    const query = `
      DELETE FROM profile_modifications 
      WHERE created_at < NOW() - INTERVAL '30 days'
      AND status IN ('approved', 'rejected')
    `;
    await pool.query(query);
  }
}

module.exports = ProfileModification; 