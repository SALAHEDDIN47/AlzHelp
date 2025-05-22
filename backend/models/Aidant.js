const pool = require('../config/db');

class Aidant {
  static async create(nom, prenom, email, mdp, telephone, dateNaissance, lienFamilial) {
    const query = `
      INSERT INTO aidants 
      (nomaidant, prenomaidant, emailaidant, mdpaidant, telephaidant, d_naissanceaidant,lien_familial )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING 
        id_aidant as id,
        nomaidant as nom,
        prenomaidant as prenom,
        emailaidant as email,
        telephaidant as telephone,
        d_naissanceaidant as dateNaissance,
        lien_familial as lienFamilial`;
    const values = [nom, prenom, email, mdp, telephone, dateNaissance, lienFamilial];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM aidants WHERE emailaidant = $1';
    const { rows } = await pool.query(query, [email]);
    return rows[0];
  }
}

module.exports = Aidant;