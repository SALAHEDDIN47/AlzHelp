const pool = require('../config/db');

class Patient {
  static async create(nom, prenom, email, mdp, telephone, dateNaissance, id_aidant) {
    const query = `
      INSERT INTO patients (nomPatient, prenomPatient, emailPatient, mdpPatient, telephPatient, dateNaissance, id_Aidant)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`;
    const values = [nom, prenom, email, mdp, telephone, dateNaissance, id_aidant];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM patients WHERE emailPatient = $1';
    const { rows } = await pool.query(query, [email]);
    return rows[0];
  }
}

module.exports = Patient;