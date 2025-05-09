const pool = require('../config/db');

class Aidant {
  static async create(nom, prenom, email, mdp, telephone, dateNaissance, id_patient) {
    const query = `
      INSERT INTO aidants 
      (nomAidant, prenomAidant, emailAidant, mdpAidant, telephAidant, D_NaissanceAidant, id_patient)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING 
        id_aidant as id,
        nomAidant as nom,
        prenomAidant as prenom,
        emailAidant as email,
        telephAidant as telephone,
        D_NaissanceAidant as dateNaissance,
        id_patient as id_lien`;
    const values = [nom, prenom, email, mdp, telephone, dateNaissance, id_patient];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM aidants WHERE emailAidant = $1';
    const { rows } = await pool.query(query, [email]);
    return rows[0];
  }
  
}

module.exports = Aidant;