const Patient = require('../models/Patient');
const Accompagnement = require('../models/Accompagnement');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

exports.createPatient = async (req, res) => {
  try {
    const { nom, prenom, email, password, telephone, dateNaissance, id_aidant } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Créer un patient dans la base de données
    const patientResult = await pool.query(
      `INSERT INTO patients (nompatient, prenompatient, emailpatient, mdppatient, telephpatient, datenaissance, id_aidant)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id_patient`,
      [nom, prenom, email, hashedPassword, telephone, dateNaissance, id_aidant]
    );

    const patient = patientResult.rows[0];

    // Si un aidant est fourni, ajouter la relation dans la table 'accompagnants'
    if (id_aidant) {
      await pool.query(
        "INSERT INTO accompagnants (id_aidant, id_patient) VALUES ($1, $2)",
        [id_aidant, patient.id_patient]
      );
    }

    // Générer un token pour le patient
    const token = jwt.sign(
      { id: patient.id_patient, type: 'patient' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Répondre avec les informations du patient et le token
    res.status(201).json({ 
      token,
      patient: {
        id: patient.id_patient,
        nom: patient.nompatient,
        prenom: patient.prenompatient,
        email: patient.emailpatient
      }
    });
  } catch (error) {
    console.error('Error in createPatient:', error);
    res.status(400).json({ error: error.message });
  }
};

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

// Récupérer les informations du patient actuel
exports.getCurrentPatient = async (req, res) => {
  try {
    const query = `
      SELECT 
        id_patient as id,
        nompatient as nom,
        prenompatient as prenom,
        emailpatient as email,
        telephpatient as telephone,
        datenaissance
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

// Obtenir tous les aidants associés à un patient
exports.getAidants = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT a.*
      FROM aidants a
      JOIN accompagnants ac ON a.id_aidant = ac.id_aidant
      WHERE ac.id_patient = $1
    `;

    const { rows } = await pool.query(query, [id]);
    res.json(rows);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

