const pool = require('../config/db');

class PatientProfileModification {
  // Créer une nouvelle modification en attente
  static async create(patientId, oldData, newData) {
    const query = `
      INSERT INTO patient_profile_modifications 
      (patient_id, old_nom, old_prenom, old_email, old_telephone, old_adresse, old_date_naissance, old_profile_image,
       new_nom, new_prenom, new_email, new_telephone, new_adresse, new_date_naissance, new_profile_image, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'pending')
      RETURNING *
    `;
    
    const values = [
      patientId,
      oldData.nom,
      oldData.prenom,
      oldData.email,
      oldData.telephone,
      oldData.adresse,
      oldData.datenaissance,
      oldData.profile_image,
      newData.nom,
      newData.prenom,
      newData.email,
      newData.telephone,
      newData.adresse,
      newData.datenaissance,
      newData.profile_image
    ];
    
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  // Obtenir toutes les modifications en attente pour un patient
  static async getPendingByPatient(patientId) {
    const query = `
      SELECT * FROM patient_profile_modifications 
      WHERE patient_id = $1 AND status = 'pending'
      ORDER BY created_at DESC
    `;
    const { rows } = await pool.query(query, [patientId]);
    return rows;
  }

  // Obtenir toutes les modifications en attente pour tous les patients
  static async getAllPending() {
    const query = `
      SELECT pm.*, 
             p.nompatient as current_nom, 
             p.prenompatient as current_prenom,
             p.profile_image as current_profile_image
      FROM patient_profile_modifications pm
      JOIN patients p ON pm.patient_id = p.id_patient
      WHERE pm.status = 'pending'
      ORDER BY pm.created_at DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  // Approuver une modification
  static async approve(modificationId) {
    const query = `
      UPDATE patient_profile_modifications 
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
      UPDATE patient_profile_modifications 
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
             p.nompatient as current_nom, 
             p.prenompatient as current_prenom,
             p.profile_image as current_profile_image
      FROM patient_profile_modifications pm
      JOIN patients p ON pm.patient_id = p.id_patient
      WHERE pm.id = $1
    `;
    const { rows } = await pool.query(query, [modificationId]);
    return rows[0];
  }

  // Supprimer les anciennes modifications (plus de 30 jours)
  static async cleanupOld() {
    const query = `
      DELETE FROM patient_profile_modifications 
      WHERE created_at < NOW() - INTERVAL '30 days'
      AND status IN ('approved', 'rejected')
    `;
    await pool.query(query);
  }
}

module.exports = PatientProfileModification; 