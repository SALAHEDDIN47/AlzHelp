const pool = require('../config/db');

class Rappel {
  static async findByPatient(id_patient) {
    const query = `
      SELECT * FROM rappels
      WHERE id_patient = $1
      ORDER BY date_rappel, heure_rappel
    `;
    const { rows } = await pool.query(query, [id_patient]);
    return rows;
  }

  static async togglePin(id_rappel) {
    const result = await pool.query(
     'UPDATE rappels SET favori = NOT favori WHERE id_rappel = $1 RETURNING favori',
      [id_rappel]
    );
    return result.rows[0].favori; // Attention à la casse
  }
  // Récupère tous les rappels des patients associés à un aidant
static async findByAidant(id_aidant) {
  const query = `
    SELECT r.*, p.nompatient, p.prenompatient
    FROM rappels r
    JOIN patients p ON r.id_patient = p.id_patient
    JOIN accompagnements a ON p.id_patient = a.id_patient
    WHERE a.id_aidant = $1
    ORDER BY r.date_rappel DESC, r.heure_rappel ASC
  `;
  
  const { rows } = await pool.query(query, [id_aidant]);
  
  // Normaliser les valeurs booléennes
  return rows.map(row => ({
    ...row,
    confirmer_rappel: Boolean(row.confirmer_rappel),
    favori: Boolean(row.favori)
  }));
}



  static async toggleConfirm(id_rappel) {
    // D'abord, vérifier l'état actuel du rappel
    const checkResult = await pool.query(
      'SELECT confirmer_rappel FROM rappels WHERE id_rappel = $1',
      [id_rappel]
    );
    
    if (checkResult.rows.length === 0) {
      throw new Error('Rappel non trouvé');
    }
    
    const currentStatus = checkResult.rows[0].confirmer_rappel;
    const newStatus = !currentStatus; // Inverser le statut
    
    // Mettre à jour avec la nouvelle valeur
    const result = await pool.query(
      'UPDATE rappels SET confirmer_rappel = $1 WHERE id_rappel = $2 RETURNING confirmer_rappel',
      [newStatus, id_rappel]
    );
    
    console.log(`🔄 Rappel ${id_rappel}: confirmer_rappel changé de ${currentStatus} à ${newStatus}`);
    
    // Convertir explicitement en booléen
    return Boolean(result.rows[0].confirmer_rappel);
  }

  // Fonction pour confirmer directement un rappel (mettre à true)
  static async confirmRappel(id_rappel) {
    const result = await pool.query(
      'UPDATE rappels SET confirmer_rappel = true WHERE id_rappel = $1 RETURNING confirmer_rappel',
      [id_rappel]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Rappel non trouvé');
    }
    
    console.log(`✅ Rappel ${id_rappel}: confirmer_rappel mis à true`);
    
    return Boolean(result.rows[0].confirmer_rappel);
  }
}
module.exports = Rappel;
