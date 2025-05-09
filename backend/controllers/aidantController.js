const Aidant = require('../models/Aidant');
const Accompagnement = require('../models/Accompagnement');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Créer un aidant
exports.createAidant = async (req, res) => {
  try {
    const { nom, prenom, email, password, telephone, dateNaissance, id_patient } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const aidant = await Aidant.create(
      nom, 
      prenom, 
      email, 
      hashedPassword, 
      telephone, 
      dateNaissance, 
      id_patient
    );

    if(id_patient) {
      await Accompagnement.create(aidant.id, id_patient); // Notez le changement pour aidant.id
    }

    const token = jwt.sign(
      { id: aidant.id, type: 'aidant' }, // Changé de aidant.id_aidant à aidant.id
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ 
      token,
      aidant: {
        id: aidant.id,
        nom: aidant.nom,
        prenom: aidant.prenom,
        email: aidant.email,
        telephone: aidant.telephone,
        dateNaissance: aidant.dateNaissance,
        id_lien: aidant.id_lien
      }
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message,
      details: error.details || null // Pour plus d'informations de débogage
    });
  }
};

// Obtenir tous les patients d'un aidant
exports.getPatients = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT p.* FROM patients p
      JOIN accompagnements a ON p.id_patient = a.id_patient
      WHERE a.id_aidant = $1`;
    const { rows } = await pool.query(query, [id]);
    res.json(rows);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Mettre à jour un aidant
exports.updateAidant = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, telephone } = req.body;
    
    const query = `
      UPDATE aidants 
      SET nomAidant = $1, prenomAidant = $2, telephAidant = $3
      WHERE id_aidant = $4
      RETURNING *`;
    const { rows } = await pool.query(query, [nom, prenom, telephone, id]);
    
    res.json(rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
// Ajouter cette nouvelle méthode
exports.getCurrentAidant = async (req, res) => {
  try {
    const query = `
      SELECT 
        id_aidant as id,
        nomAidant as nom,
        prenomAidant as prenom,
        emailAidant as email,
        telephAidant as telephone,
        D_NaissanceAidant as dateNaissance
      FROM aidants 
      WHERE id_aidant = $1`;
    const { rows } = await pool.query(query, [req.userId]);
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Aidant non trouvé' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};