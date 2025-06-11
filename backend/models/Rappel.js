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
     'UPDATE rappels SET ispinned = NOT ispinned WHERE id_rappel = $1 RETURNING ispinned',
      [id_rappel]
    );
    return result.rows[0].ispinned; // Attention à la casse
  }


  static async toggleConfirm(id_rappel) {
    const result = await pool.query(
     'UPDATE rappels SET confirmer_rappel = NOT confirmer_rappel WHERE id_rappel = $1 RETURNING confirmer_rappel',
      [id_rappel]
    );
    return result.rows[0].confirmer_rappel; // Attention à la casse
  }
}
module.exports = Rappel;