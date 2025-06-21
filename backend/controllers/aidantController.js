const Aidant = require('../models/Aidant');
const Accompagnement = require('../models/Accompagnement');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// S'assurer que le dossier uploads/profiles existe
const uploadsDir = path.join(__dirname, '..', 'uploads');
const profilesDir = path.join(uploadsDir, 'profiles');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir);
}

// Configuration de multer pour le stockage des images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, profilesDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'aidant-profile-' + uniqueSuffix + path.extname(file.originalname))
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
        id_patient: aidant.id_patient
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
    console.log("get patients for aidant id:",id);
    
    const query = `
      SELECT p.*, a.lien_familial, a.created_at as accompagnement_created_at
      FROM patients p
      JOIN accompagnements a ON p.id_patient = a.id_patient
      WHERE a.id_aidant = $1
      ORDER BY a.created_at DESC
    `;
    const { rows } = await pool.query(query, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Aucun patient trouvé pour cet aidant." });
    }
    res.json(rows);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//obtenir les details d'un aidant d'un patient donné
exports.getAidantsByPatient = async (req, res) => {
  try {
    const { id } = req.params;
         const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      
    console.log("🔍 ID reçu dans getAidantsByPatient :", id);
     if (!id) {
      return res.status(400).json({ error: "Missing patient id" });
    }

    const query = `
      SELECT a.id_aidant, a.nomaidant, a.prenomaidant, a.emailaidant, a.telephaidant,
      CONCAT('${baseUrl}/', a.image_url) AS image_url, a.image_url, a.d_naissanceaidant, a.created_at,
      ac.lien_familial, ac.created_at as accompagnement_created_at
      FROM aidants a
      JOIN accompagnements ac ON a.id_aidant = ac.id_aidant
      WHERE ac.id_patient = $1
      ORDER BY ac.created_at DESC
    `;

    const { rows } = await pool.query(query, [id]);
    res.json(rows);
  } catch (error) {
    console.error("Erreur getAidantsByPatient :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Mettre à jour un aidant
exports.updateAidant = async (req, res) => {
  try {
    upload(req, res, async function(err) {
      if (err) {
        console.error('Erreur upload:', err);
        return res.status(400).json({ error: err.message });
      }

      try {
        const { id } = req.params;
        const { nom, prenom, telephone, email, dateNaissance } = req.body;
        
        if (!id || !nom || !prenom || !telephone || !email || !dateNaissance) {
          return res.status(400).json({ error: 'Tous les champs sont obligatoires' });
        }
        
        let imagePath = null;
        if (req.file) {
          // Utilisez un chemin relatif au lieu d'un chemin absolu
          imagePath = req.file.path.replace(/\\/g, '/');
          
          // Si le chemin contient le chemin absolu du serveur, extrayez seulement la partie relative
          if (imagePath.includes('backend/')) {
            imagePath = imagePath.substring(imagePath.indexOf('backend/'));
          }
          
          // Assurez-vous que le chemin commence par 'uploads/'
          if (!imagePath.startsWith('uploads/')) {
            imagePath = `uploads/${imagePath.split('uploads/')[1]}`;
          }
        }
        
        const query = `
          UPDATE aidants 
          SET nomaidant = $1, 
              prenomaidant = $2, 
              telephaidant = $3,
              emailaidant = $4,
              d_naissanceaidant = $5,
              image_url = COALESCE($6, image_url)
          WHERE id_aidant = $7
          RETURNING 
            id_aidant as id,
            nomaidant as nom,
            prenomaidant as prenom,
            emailaidant as email,
            telephaidant as telephone,
            TO_CHAR(d_naissanceaidant, 'YYYY-MM-DD') as dateNaissance,
            d_naissanceaidant,
            image_url`;
        const { rows } = await pool.query(query, [
          nom, 
          prenom, 
          telephone, 
          email, 
          dateNaissance, 
          imagePath,
          id
        ]);
        
        if (rows.length === 0) {
          return res.status(404).json({ error: 'Aidant non trouvé' });
        }
        
        // Ajouter l'URL complète de l'image
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        if (rows[0].image_url) {
          rows[0].full_image_url = `${baseUrl}/${rows[0].image_url}`;
        }
        
        res.json(rows[0]);
      } catch (error) {
        console.error('Erreur mise à jour aidant:', error);
        res.status(400).json({ error: error.message });
      }
    });
  } catch (error) {
    console.error('Erreur générale:', error);
    res.status(500).json({ error: error.message });
  }
};

// Ajouter cette nouvelle méthode
exports.getCurrentAidant = async (req, res) => {
  try {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    
    const query = `
      SELECT 
        id_aidant as id_aidant,
        nomaidant as nom,
        prenomaidant as prenom,
        emailaidant as email,
        telephaidant as telephone,
        TO_CHAR(d_naissanceaidant, 'YYYY-MM-DD') as dateNaissance,
        d_naissanceaidant,
        image_url,
        CONCAT('${baseUrl}/', image_url) AS full_image_url
      FROM aidants 
      WHERE id_aidant = $1`;
    const { rows } = await pool.query(query, [req.userId]);
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Aidant non trouvé' });
    }
    
    // Log pour déboguer
    console.log("Données aidant envoyées au frontend:", JSON.stringify(rows[0], null, 2));
    
    res.json(rows[0]);
  } catch (error) {
    console.error("Erreur getCurrentAidant:", error);
    res.status(400).json({ error: error.message });
  }
};

// Fonction pour supprimer un patient d'un aidant
// Fonction pour supprimer l'association aidant-patient
exports.removePatient = async (req, res) => {
  const { aidantId, patientId } = req.body;

  try {
    // Log des valeurs reçues
    console.log("ID Aidant:", aidantId);
    console.log("ID Patient:", patientId);

    // Vérifier si les identifiants sont valides
    if (!aidantId || !patientId) {
      return res.status(400).json({ error: "ID de l'aidant ou du patient manquant" });
    }

    // Supprimer la relation aidant-patient de la table 'accompagnements'
    const result = await pool.query(
      'DELETE FROM accompagnements WHERE id_aidant = $1 AND id_patient = $2 RETURNING *',
      [aidantId, patientId]
    );

    // Log du résultat de la requête
    console.log("Résultat de la suppression:", result);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Le patient n'est pas associé à cet aidant." });
    }

    // Si la suppression a réussi, renvoyer un message de succès
    res.status(200).json({ message: "Le patient a été supprimé avec succès." });
  } catch (error) {
    console.error("Erreur lors de la suppression du patient:", error);
    res.status(500).json({ error: "Erreur serveur lors de la suppression du patient" });
  }
};

// Fonction pour obtenir les détails d'un patient
exports.getPatientDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `SELECT * FROM patients WHERE id_patient = $1`;
    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Patient non trouvé" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Erreur lors de la récupération des détails du patient:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Fonction pour ajouter un patient à un aidant
exports.addPatientForAidant = async (req, res) => {
  const { patientId, lienFamilial } = req.body;
  const aidantId = req.userId; // Utiliser l'ID de l'aidant depuis le token
  console.log("ID de l'aidant  for accompagnements:", aidantId);

  if (!patientId || !lienFamilial) {
    return res.status(400).json({ error: "Informations manquantes" });
  }

  try {
    // Vérification du patient
    const patientResult = await pool.query('SELECT * FROM patients WHERE id_patient = $1', [patientId]);
    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: "Patient non trouvé" });
    }

    // Vérification si l'association existe déjà
    const checkResult = await pool.query('SELECT * FROM accompagnements WHERE id_aidant = $1 AND id_patient = $2', [aidantId, patientId]);
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ error: "Le patient est déjà associé à cet aidant." });
    }

    // Ajouter l'association
    const result = await pool.query(
      "INSERT INTO accompagnements (id_aidant, id_patient, lien_familial) VALUES ($1, $2, $3) RETURNING *",
      [aidantId, patientId, lienFamilial]
    );

    res.status(201).json({ message: "Patient ajouté avec succès", data: result.rows[0] });
  } catch (error) {
    console.error("Erreur lors de l'ajout du patient:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};


