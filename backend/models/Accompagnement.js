const pool = require('../config/db');

class Accompagnement {
  static async create(id_aidant, id_patient) {
    const query = `
      INSERT INTO accompagnements (id_aidant, id_patient)
      VALUES ($1, $2)
      RETURNING *`;
    const { rows } = await pool.query(query, [id_aidant, id_patient]);
    return rows[0];
  }
}

module.exports = Accompagnement;