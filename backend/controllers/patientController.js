const Patient = require('../models/Patient');
const Accompagnement = require('../models/Accompagnement');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

exports.createPatient = async (req, res) => {
  try {
    const { nom, prenom, email, password, telephone, dateNaissance, id_aidant } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const patient = await Patient.create(
      nom, prenom, email, hashedPassword, telephone, dateNaissance, id_aidant
    );

    if(id_aidant) {
      await Accompagnement.create(id_aidant, patient.id);
    }

    const token = jwt.sign(
      { id: patient.id, type: 'patient' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ 
      token,
      patient: {
        id: patient.id,
        nom: patient.nom,
        prenom: patient.prenom,
        email: patient.email
      }
    });
  } catch (error) {
    console.error('Error in createPatient:', error);
    res.status(400).json({ error: error.message });
  }
};

// [Keep other methods the same but ensure field names match database]

// Mettre à jour un patient
exports.updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, telephone } = req.body;
    
    const query = `
      UPDATE patients 
      SET nompatient = $1, prenompatient = $2, telephpatient = $3
      WHERE id_patient = $4
      RETURNING *`;
    const { rows } = await pool.query(query, [nom, prenom, telephone, id]);
    
    res.json(rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
// Ajouter cette nouvelle méthode
exports.getCurrentPatient = async (req, res) => {
  try {
    const query = `
      SELECT 
        id_patient as id,
        nomPatient as nom,
        prenomPatient as prenom,
        emailPatient as email,
        telephPatient as telephone,
        dateNaissance
      FROM patients 
      WHERE id_patient = $1`;
    const { rows } = await pool.query(query, [req.userId]);
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Patient non trouvé' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
// Obtenir tous les aidants d’un patient
exports.getAidants = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT a.*
      FROM aidants a
      JOIN accompagnements ac ON a.id_aidant = ac.id_aidant
      WHERE ac.id_patient = $1
    `;

    const { rows } = await pool.query(query, [id]);
    res.json(rows);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
