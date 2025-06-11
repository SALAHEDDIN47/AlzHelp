const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db'); // Connexion à la base de données
require('dotenv').config();

// Fonction d'enregistrement
const register = async (req, res) => {
  try {
    const { userType, ...userData } = req.body;
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    let user;
    if (userType === 'patient') {
      const result = await pool.query(
        `INSERT INTO patients (nompatient, prenompatient, emailpatient, mdppatient, telephpatient, datenaissance)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_patient`,
        [userData.nom, userData.prenom, userData.email, hashedPassword, userData.telephone, userData.dateNaissance]
      );
      user = result.rows[0];
    } else if (userType === 'aidant') {
      const result = await pool.query(
        `INSERT INTO aidants (nomaidant, prenomaidant, emailaidant, mdpaidant, telephaidant, d_naissanceaidant)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_aidant`,
        [userData.nom, userData.prenom, userData.email, hashedPassword, userData.telephone, userData.dateNaissance,]
      );
      user = result.rows[0];
    } else {
      return res.status(400).json({ error: 'Type d\'utilisateur inconnu' });
    }

    const token = jwt.sign(
      { id: user.id_patient || user.id_aidant, type: userType },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ token, userType, userId: user.id_patient || user.id_aidant });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Fonction de connexion
const login = async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    let user;
    if (userType === 'patient') {
      const result = await pool.query('SELECT * FROM patients WHERE emailpatient = $1', [email]);
      user = result.rows[0];
    } else if (userType === 'aidant') {
      const result = await pool.query('SELECT * FROM aidants WHERE emailaidant = $1', [email]);
      user = result.rows[0];
    }

    if (!user) {
      return res.status(401).json({ error: 'Identifiants incorrects (utilisateur non trouvé)' });
    }

    const validPassword = await bcrypt.compare(password, userType === 'patient' ? user.mdppatient : user.mdpaidant);

    if (!validPassword) {
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }

    const token = jwt.sign(
      { id: user.id_patient || user.id_aidant, type: userType },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Vérification pour l'aidant : s'il a un patient associé
    if (userType === 'aidant') {
      const result = await pool.query('SELECT * FROM accompagnements WHERE id_aidant = $1', [user.id_aidant]);

      if (result.rows.length === 0) {
        return res.json({
          token,
          userType,
          user: { id: user.id_aidant, nom: user.nom, prenom: user.prenom, email: user.email },
          isFirstLogin: true, // Indiquer qu'il est nécessaire d'ajouter un patient
        });
      }
    }

    res.json({
      token,
  userType,
  user: {
    id: user.id_aidant || user.id_patient,
    nom: user.nomaidant || user.nompatient,
    prenom: user.prenomaidant || user.prenompatient,
    email: user.emailaidant || user.emailpatient
  },
      isFirstLogin: false,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Fonction pour ajouter un patient à un aidant
const addPatientForAidant = async (req, res) => {
  const { aidantId, patientId } = req.body;

  console.log("ID de l'aidant reçu dans le backend:", aidantId);
  console.log("ID du patient reçu:", patientId);

  try {
    // Vérifier si le patient existe dans la base de données
    const patientResult = await pool.query('SELECT * FROM patients WHERE id_patient = $1', [patientId]);

    if (patientResult.rows.length === 0) {
      return res.status(400).json({ error: "Le patient avec cet ID n'existe pas." });
    }

    // Vérifier si la relation aidant-patient existe déjà
    const result = await pool.query(
      "SELECT * FROM accompagnements WHERE id_aidant = $1 AND id_patient = $2",
      [aidantId, patientId]
    );

    if (result.rows.length > 0) {
      return res.status(400).json({ error: "Ce patient est déjà associé à cet aidant." });
    }

    // Ajouter la relation aidant-patient dans la table accompagnements
    await pool.query(
      "INSERT INTO accompagnements (id_aidant, id_patient) VALUES ($1, $2)",
      [aidantId, patientId]
    );

    res.status(201).json({ message: "Patient ajouté avec succès à l'aidant." });
  } catch (error) {
    console.error("Erreur lors de l'ajout du patient:", error);
    res.status(500).json({ error: "Une erreur est survenue lors de l'ajout du patient." });
  }
};

// Vérifier si l'aidant a des patients associés
const checkPatientForAidant = async (req, res) => {
  const { aidantId } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM accompagnements WHERE id_aidant = $1",
      [aidantId]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({ isFirstLogin: true });
    }

    res.status(200).json({ isFirstLogin: false });
  } catch (error) {
    console.error("Erreur lors de la vérification de l'aidant:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { register, login, addPatientForAidant, checkPatientForAidant };
