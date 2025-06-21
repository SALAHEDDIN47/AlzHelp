const Patient = require('../models/patient');
const Accompagnement = require('../models/Accompagnement');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const multer = require('multer');
const path = require('path');

// Configuration de multer pour le stockage des images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profiles')
  },
  filename: function (req, file, cb) {
    cb(null, 'profile-' + Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // limite de 5MB
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées!'), false);
    }
  }
}).single('profileImage');

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

    // Si un aidant est fourni, ajouter la relation dans la table 'accompagnements'
    if (id_aidant) {
      await pool.query(
        "INSERT INTO accompagnements (id_aidant, id_patient) VALUES ($1, $2)",
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
    upload(req, res, async function(err) {
      if (err) {
        console.error('Erreur upload:', err);
        return res.status(400).json({ error: err.message });
      }

      try {
        const id = req.params.id;
        console.log("id reçu:", id);
        const { nom, prenom, telephone, email, adresse, datenaissance } = req.body;
        
        if (!id || !nom || !prenom || !telephone || !email || !adresse || !datenaissance) {
          return res.status(400).json({ error: 'Tous les champs sont obligatoires' });
        }
        
        let imagePath = null;
        if (req.file) {
          imagePath = req.file.path;
        }
        
        const query = `
          UPDATE patients 
          SET nompatient = $1, 
              prenompatient = $2, 
              telephpatient = $3,
              emailpatient = $4,
              adresspat = $5,
              datenaissance = $6,
              profile_image = COALESCE($7, profile_image)
          WHERE id_patient = $8
          RETURNING *`;
        const { rows } = await pool.query(query, [
          nom, 
          prenom, 
          telephone, 
          email, 
          adresse, 
          datenaissance, 
          imagePath,
          id
        ]);
        
        if (rows.length === 0) {
          return res.status(404).json({ error: 'Patient non trouvé' });
        }
        
        res.json(rows[0]);
      } catch (error) {
        console.error('Erreur dans updatePatient:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour du patient' });
      }
    });
  } catch (error) {
    console.error('Erreur dans updatePatient:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer les informations du patient actuel
//api/patients/thispatient:
exports.getCurrentPatient = async (req, res) => {
  try {
    const query = `
      SELECT 
        id_patient as id_patient,
        nompatient as nom,
        prenompatient as prenom,
        emailpatient as email,
        telephpatient as telephone,
        adresspat as adresse,
        datenaissance as datenaissance,
        profile_image as profile_image
      FROM patients 
      WHERE id_patient = $1`;
    const { rows } = await pool.query(query, [req.userId]);
    console.log("userId reçu depuis le token :", req.userId);
    
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
      JOIN accompagnements ac ON a.id_aidant = ac.id_aidant
      WHERE ac.id_patient = $1
    `;

    const { rows } = await pool.query(query, [id]);
    res.json(rows);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Obtenir un patient par son ID
exports.getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("ID patient reçu:", id);

    const query = `
      SELECT 
        id_patient,
        nompatient,
        prenompatient,
        emailpatient,
        telephpatient,
        adresspat,
        datenaissance,
        profile_image
      FROM patients 
      WHERE id_patient = $1`;
    
    const { rows } = await pool.query(query, [id]);
    console.log("Résultat de la requête:", rows);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Patient non trouvé' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Erreur dans getPatientById:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération du patient' });
  }
};

