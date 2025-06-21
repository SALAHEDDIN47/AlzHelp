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

// Mettre à jour un aidant (modification directe)
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
        
        // Vérifier que l'aidant existe
        const checkAidantQuery = `
          SELECT id_aidant FROM aidants WHERE id_aidant = $1
        `;
        const checkResult = await pool.query(checkAidantQuery, [id]);
        
        if (checkResult.rows.length === 0) {
          return res.status(404).json({ error: 'Aidant non trouvé' });
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
        
        // Mettre à jour directement le profil de l'aidant
        let updateQuery, updateParams;
        
        if (imagePath) {
          // Mise à jour avec nouvelle image
          updateQuery = `
            UPDATE aidants 
            SET nomaidant = $1, prenomaidant = $2, emailaidant = $3, 
                telephaidant = $4, d_naissanceaidant = $5, image_url = $6
            WHERE id_aidant = $7
            RETURNING *
          `;
          updateParams = [nom, prenom, email, telephone, dateNaissance, imagePath, id];
        } else {
          // Mise à jour sans nouvelle image
          updateQuery = `
            UPDATE aidants 
            SET nomaidant = $1, prenomaidant = $2, emailaidant = $3, 
                telephaidant = $4, d_naissanceaidant = $5
            WHERE id_aidant = $6
            RETURNING *
          `;
          updateParams = [nom, prenom, email, telephone, dateNaissance, id];
        }
        
        const updateResult = await pool.query(updateQuery, updateParams);
        
        if (updateResult.rows.length === 0) {
          return res.status(404).json({ error: 'Aidant non trouvé' });
        }
        
        const updatedAidant = updateResult.rows[0];
        
        res.json({
          success: true,
          message: 'Profil mis à jour avec succès',
          nomaidant: updatedAidant.nomaidant,
          prenomaidant: updatedAidant.prenomaidant,
          emailaidant: updatedAidant.emailaidant,
          telephaidant: updatedAidant.telephaidant,
          d_naissanceaidant: updatedAidant.d_naissanceaidant,
          image_url: updatedAidant.image_url
        });
        
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

// Fonction pour obtenir les logs des aidants qui ont le même patient
exports.getAidantLogs = async (req, res) => {
  try {
    const { patientId } = req.params;
    const aidantId = req.userId; // ID de l'aidant connecté

    if (!patientId) {
      return res.status(400).json({ error: "ID du patient manquant" });
    }

    // Vérifier que l'aidant connecté a bien ce patient
    const checkAccompagnement = await pool.query(
      'SELECT * FROM accompagnements WHERE id_aidant = $1 AND id_patient = $2',
      [aidantId, patientId]
    );

    if (checkAccompagnement.rows.length === 0) {
      return res.status(403).json({ error: "Vous n'avez pas accès à ce patient" });
    }

    // Récupérer tous les aidants qui ont ce patient
    const aidantsQuery = `
      SELECT DISTINCT a.id_aidant, a.nomaidant, a.prenomaidant, a.image_url, ac.lien_familial
      FROM aidants a
      JOIN accompagnements ac ON a.id_aidant = ac.id_aidant
      WHERE ac.id_patient = $1 AND a.id_aidant != $2
      ORDER BY a.nomaidant, a.prenomaidant
    `;

    const { rows: aidants } = await pool.query(aidantsQuery, [patientId, aidantId]);

    // Pour chaque aidant, récupérer ses logs
    const logsWithAidants = await Promise.all(
      aidants.map(async (aidant) => {
        // Récupérer les modifications de rappels
        const rappelsQuery = `
          SELECT 
            'rappel_modification' as type,
            r.id_rappel,
            r.description,
            r.type_rappel,
            r.created_at,
            r.updated_at,
            'Rappel modifié' as action_description
          FROM rappels r
          WHERE r.id_patient = $1 AND r.id_aidant = $2
          AND r.updated_at > r.created_at
          ORDER BY r.updated_at DESC
          LIMIT 10
        `;

        // Récupérer les nouveaux rappels ajoutés
        const newRappelsQuery = `
          SELECT 
            'rappel_ajout' as type,
            r.id_rappel,
            r.description,
            r.type_rappel,
            r.created_at,
            r.updated_at,
            'Nouveau rappel ajouté' as action_description
          FROM rappels r
          WHERE r.id_patient = $1 AND r.id_aidant = $2
          AND r.created_at >= NOW() - INTERVAL '7 days'
          ORDER BY r.created_at DESC
          LIMIT 10
        `;

        // Récupérer les rappels supprimés (si on a une table d'audit)
        const deletedRappelsQuery = `
          SELECT 
            'rappel_suppression' as type,
            NULL as id_rappel,
            'Rappel supprimé' as description,
            'Autre' as type_rappel,
            NOW() as created_at,
            NOW() as updated_at,
            'Rappel supprimé' as action_description
          WHERE EXISTS (
            SELECT 1 FROM rappels r 
            WHERE r.id_patient = $1 AND r.id_aidant = $2
          )
          LIMIT 5
        `;

        // Récupérer les confirmations de modifications de profil patient
        const confirmationsQuery = `
          SELECT 
            'confirmation_modification' as type,
            ppm.id,
            ppm.description,
            'Profil Patient' as type_rappel,
            ppm.updated_at as created_at,
            ppm.updated_at,
            CASE 
              WHEN ppm.status = 'approved' THEN 'Modification de profil patient approuvée'
              WHEN ppm.status = 'rejected' THEN 'Modification de profil patient rejetée'
              ELSE 'Modification de profil patient traitée'
            END as action_description
          FROM patient_profile_modifications ppm
          WHERE ppm.id_patient = $1 AND ppm.id_aidant = $2
          AND ppm.status IN ('approved', 'rejected')
          AND ppm.updated_at >= NOW() - INTERVAL '7 days'
          ORDER BY ppm.updated_at DESC
          LIMIT 10
        `;

        const [rappelsModifies, nouveauxRappels, confirmations] = await Promise.all([
          pool.query(rappelsQuery, [patientId, aidant.id_aidant]),
          pool.query(newRappelsQuery, [patientId, aidant.id_aidant]),
          pool.query(confirmationsQuery, [patientId, aidant.id_aidant])
        ]);

        // Combiner tous les logs
        const allLogs = [
          ...rappelsModifies.rows,
          ...nouveauxRappels.rows,
          ...confirmations.rows
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        return {
          aidant: {
            id: aidant.id_aidant,
            nom: aidant.nomaidant,
            prenom: aidant.prenomaidant,
            image_url: aidant.image_url,
            lien_familial: aidant.lien_familial
          },
          logs: allLogs.slice(0, 15) // Limiter à 15 logs les plus récents
        };
      })
    );

    res.json({
      success: true,
      data: logsWithAidants.filter(item => item.logs.length > 0) // Ne retourner que les aidants avec des logs
    });

  } catch (error) {
    console.error("Erreur getAidantLogs:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Fonction pour envoyer un message aux aidants d'un patient
exports.sendMessageToAidants = async (req, res) => {
  try {
    const { patientId, message } = req.body;
    const aidantId = req.userId; // ID de l'aidant qui envoie le message

    if (!patientId || !message) {
      return res.status(400).json({ error: "ID du patient et message sont obligatoires" });
    }

    // Vérifier que l'aidant connecté a bien ce patient
    const checkAccompagnement = await pool.query(
      'SELECT * FROM accompagnements WHERE id_aidant = $1 AND id_patient = $2',
      [aidantId, patientId]
    );

    if (checkAccompagnement.rows.length === 0) {
      return res.status(403).json({ error: "Vous n'avez pas accès à ce patient" });
    }

    // Récupérer tous les aidants qui ont ce patient (sauf l'expéditeur)
    const aidantsQuery = `
      SELECT DISTINCT a.id_aidant, a.nomaidant, a.prenomaidant, a.emailaidant
      FROM aidants a
      JOIN accompagnements ac ON a.id_aidant = ac.id_aidant
      WHERE ac.id_patient = $1 AND a.id_aidant != $2
    `;

    const { rows: aidants } = await pool.query(aidantsQuery, [patientId, aidantId]);

    if (aidants.length === 0) {
      return res.status(404).json({ error: "Aucun autre aidant trouvé pour ce patient" });
    }

    // Ici vous pourriez implémenter l'envoi de notifications push ou emails
    // Pour l'instant, on retourne juste un succès
    const messageData = {
      from_aidant_id: aidantId,
      patient_id: patientId,
      message: message,
      sent_at: new Date(),
      recipients: aidants.map(a => ({
        id: a.id_aidant,
        nom: a.nomaidant,
        prenom: a.prenomaidant,
        email: a.emailaidant
      }))
    };

    res.json({
      success: true,
      message: `Message envoyé à ${aidants.length} aidant(s)`,
      data: messageData
    });

  } catch (error) {
    console.error("Erreur sendMessageToAidants:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};


