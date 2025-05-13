const pool = require('../config/db');

class Patient {
  static async create(nom, prenom, email, mdp, telephone, dateNaissance, id_aidant) {
    const query = `
      INSERT INTO patients 
      (nompatient, prenompatient, emailpatient, mdppatient, telephpatient, datenaissance, id_aidant)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING 
        id_patient as id,
        nompatient as nom,
        prenompatient as prenom,
        emailpatient as email,
        telephpatient as telephone,
        datenaissance as dateNaissance,
        id_aidant`;
    const values = [nom, prenom, email, mdp, telephone, dateNaissance, id_aidant];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async findByEmail(email) {
  const query = 'SELECT * FROM patients WHERE emailpatient = $1';
  const { rows } = await pool.query(query, [email]);
  return rows[0];
}
}

module.exports = Patient;