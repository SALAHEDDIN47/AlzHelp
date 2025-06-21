const Rappel = require('../models/Rappel');
const pool = require('../config/db'); // ou le chemin vers ton fichier de configuration PostgreSQL
const webpush = require('web-push');
const { getTokenForUser } = require('./notificationController');
const { createNotification } = require('./notificationController'); // Importer la fonction

// Import fetch pour Node.js (nécessaire pour les versions < 18)
let fetch;
try {
  fetch = require('node-fetch');
} catch (error) {
  // Si node-fetch n'est pas installé, on utilise une alternative
  console.warn('node-fetch non disponible, notifications Expo désactivées');
  fetch = null;
}

// Configuration des clés VAPID pour Expo Push (à déplacer dans un fichier de config)
const publicKey = 'BKjM0HhFa0YBKRYL1iZca47RV7AjUgLhj_1kTn54CdFjPUwcbOxIcCo70MiRDcI3Mv4x3hvRgIcMvXy_NlsyRPQ';
const privateKey = 'g0Vvq8nhn2hsFTDXWGvphI_PJ6X71PiOJE60pTkKfEk';
webpush.setVapidDetails('mailto:votre_email@exemple.com', publicKey, privateKey);

// Fonction utilitaire pour notifier les aidants
async function notifyAidants(rappelId, isConfirmed) {
  try {
    // Récupérer les informations du rappel et du patient
    const rappelQuery = `
      SELECT r.*, p.nompatient, p.prenompatient, p.emailpatient, p.telephpatient
      FROM rappels r
      JOIN patients p ON r.id_patient = p.id_patient
      WHERE r.id_rappel = $1
    `;
    const rappelResult = await pool.query(rappelQuery, [rappelId]);

    if (rappelResult.rows.length === 0) {
      console.error('Rappel non trouvé:', rappelId);
      return;
    }
    
    const rappel = rappelResult.rows[0];
    console.log(`✅ Rappel ${rappelId}: confirmer_rappel mis à ${isConfirmed}`);

    // Récupérer les aidants associés au patient avec leurs tokens
    const aidantsQuery = `
      SELECT a.id_aidant, a.nomaidant, a.prenomaidant
      FROM aidants a
      JOIN accompagnements ac ON a.id_aidant = ac.id_aidant
      WHERE ac.id_patient = $1
    `;
    const aidantsResult = await pool.query(aidantsQuery, [rappel.id_patient.toString()]);

    // Pour chaque aidant, récupérer ses tokens séparément
    for (let aidant of aidantsResult.rows) {
      // Récupérer les tokens de l'aidant
      const tokenQuery = `
        SELECT endpoint, keys_p256dh, keys_auth
        FROM subscriptions 
        WHERE id_aidant = $1
      `;
      const tokenResult = await pool.query(tokenQuery, [aidant.id_aidant]);
      const tokens = tokenResult.rows[0] || {};
      
      // --- NOTIFICATION EXPO PUSH ---
      try {
        const expoTokenInfo = await getTokenForUser(aidant.id_aidant, 'aidant');
        if (expoTokenInfo && expoTokenInfo.token && typeof fetch !== 'undefined') {
          const expoMessage = {
            to: expoTokenInfo.token,
            sound: 'default',
            title: isConfirmed ? 'Rappel confirmé' : 'Rappel non confirmé',
            body: `Le rappel pour le patient ${rappel.nompatient} ${rappel.prenompatient} a été ${isConfirmed ? 'confirmé' : 'non confirmé'}.\nDescription: ${rappel.description}`,
            data: {
              rappel: {
                id: rappel.id_rappel,
                description: rappel.description,
                date: rappel.date_rappel,
                heure: rappel.heure_rappel
              },
              patient: {
                id: rappel.id_patient,
                nom: rappel.nompatient,
                prenom: rappel.prenompatient,
                email: rappel.emailpatient,
                telephone: rappel.telephpatient
              },
              statut: isConfirmed ? 'confirmé' : 'non confirmé'
            }
          };
          const expoRes = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Accept-encoding': 'gzip, deflate',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(expoMessage),
          });
          const expoResult = await expoRes.json();
          if (expoResult.data && expoResult.data.status === 'error') {
            console.error('Erreur Expo notification aidant:', expoResult.data.message);
          } else {
            console.log(`Notification Expo envoyée à l'aidant ${aidant.nomaidant}`);
          }
        }
      } catch (expoErr) {
        console.error('Erreur lors de l\'envoi de la notification Expo à l\'aidant', expoErr);
      }
      // --- NOTIFICATION WEBPUSH (ancienne logique, si besoin) ---
      if (tokens.endpoint && tokens.keys_p256dh && tokens.keys_auth) {
        const message = {
          title: isConfirmed ? 'Rappel confirmé' : 'Rappel non confirmé',
          body: `Le rappel pour le patient ${rappel.nompatient} ${rappel.prenompatient} a été ${isConfirmed ? 'confirmé' : 'non confirmé'}.\nDescription: ${rappel.description}`,
          data: {
            rappel: {
              id: rappel.id_rappel,
              description: rappel.description,
              date: rappel.date_rappel,
              heure: rappel.heure_rappel
            },
            patient: {
              id: rappel.id_patient,
              nom: rappel.nompatient,
              prenom: rappel.prenompatient,
              email: rappel.emailpatient,
              telephone: rappel.telephpatient
            },
            statut: isConfirmed ? 'confirmé' : 'non confirmé'
          }
        };
        try {
          await webpush.sendNotification({
            endpoint: tokens.endpoint,
            keys: {
              p256dh: tokens.keys_p256dh,
              auth: tokens.keys_auth
            }
          }, JSON.stringify(message));
          console.log(`Notification webpush ${isConfirmed ? 'confirmation' : 'non-confirmation'} envoyée à l'aidant ${aidant.nomaidant}`);
        } catch (error) {
          console.error('Erreur lors de l\'envoi de la notification webpush à l\'aidant', error);
        }
      }
    }
  } catch (error) {
    console.error('Erreur lors de la notification des aidants:', error);
  }
}

exports.getRappelsForLoggedInPatient = async (req, res) => {
  try {
    const id_patient = req.userId;
    const rappels = await Rappel.findByPatient(id_patient);
    res.json(rappels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getRappelsForLoggedInAidant = async (req, res) => {
  try {
    const id_aidant = req.userId;
    console.log("id_aidant Controllers:", id_aidant);
    const rappels = await Rappel.findByAidant(id_aidant);
    
    // Log pour vérifier les valeurs de confirmer_rappel
    console.log("Rappels trouvés (premiers 3):", rappels.slice(0, 3).map(r => ({
      id_rappel: r.id_rappel,
      confirmer_rappel: r.confirmer_rappel,
      type_confirmer_rappel: typeof r.confirmer_rappel
    })));
    
    // Normaliser les valeurs booléennes avant de les envoyer
    const normalizedRappels = rappels.map(r => ({
      ...r,
      confirmer_rappel: r.confirmer_rappel === true || r.confirmer_rappel === 1,
      favori: r.favori === true || r.favori === 1
    }));
    
    res.status(200).json(normalizedRappels);
  } catch (err) {
    console.error("Erreur complète :", err.stack || err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
// PUT /rappels/:id/pin
exports.togglePin = async (req, res) => {
   console.log("req.params:", req.params);
  const { id_rappel } = req.params;
  console.log("id togglepin:",id_rappel);
  try {
    const favori = await Rappel.togglePin(id_rappel);
    res.json({ success: true, favori });
  } catch (err) {
    console.error("Erreur togglePin:", err.message);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
// Exemple dans RappelController
exports.toggleConfirm = async (req, res) => {
  const { id_rappel } = req.params;
   console.log("id confirm rappel :",id_rappel);
  try {
    // Utiliser confirmRappel pour mettre confirmer_rappel = true
    const est_confirmer = await Rappel.confirmRappel(id_rappel);
    
    // Récupérer les informations du rappel pour le message
    const rappelInfo = await pool.query(
      `SELECT r.description, r.type_rappel, r.date_rappel, r.heure_rappel, p.nompatient, p.prenompatient
       FROM rappels r
       JOIN patients p ON r.id_patient = p.id_patient
       WHERE r.id_rappel = $1`,
      [id_rappel]
    );
    
    if (rappelInfo.rows.length > 0) {
      const rappel = rappelInfo.rows[0];
      
      // Créer une notification dans la table aidant_notifications
      await createNotification(
        id_rappel,
        'confirme',
        (patient) => `✅ ${patient.nompatient} ${patient.prenompatient} a confirmé le rappel "${rappel.description}" (${rappel.type_rappel}) prévu le ${new Date(rappel.date_rappel).toLocaleDateString('fr-FR')} à ${rappel.heure_rappel}.`
      );
    }
    
    // Notifier les aidants immédiatement après la confirmation
    await notifyAidants(id_rappel, est_confirmer);
    
    res.json({ success: true, est_confirmer });
  } catch (err) {
    console.error("Erreur toggleconfirm:", err.message);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// controllers/rappelsController.js
exports.createRappel = async (req, res) => {
  try {
    const {
      description,
      type_rappel,
      date_rappel,
      heure_rappel,
      confirmer_rappel,
      favori,
      id_patient,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO rappels
       (id_patient, description, type_rappel, date_rappel, heure_rappel, confirmer_rappel, favori, date_creation_rappel, heure_creation_rappel)
       VALUES ($1,$2,$3,$4,$5,$6,$7,CURRENT_DATE,CURRENT_TIME) RETURNING *`,
      [id_patient, description, type_rappel, date_rappel, heure_rappel, confirmer_rappel, favori]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur createRappel:', err);
    res.status(500).json({ error: err.message });
  }
};


exports.updateRappel = async (req, res) => {
  try {
    const id = req.params.id_rappel;
    const { description, type_rappel, date_rappel, heure_rappel, confirmer_rappel, favori } = req.body;

    if (!description || !type_rappel || !date_rappel || !heure_rappel) {
      return res.status(400).json({ error: 'Champs requis manquants' });
    }

    // Réinitialiser les colonnes de notification pour permettre le renvoi
    const result = await pool.query(
      `UPDATE rappels 
       SET description = $1, type_rappel = $2, date_rappel = $3, heure_rappel = $4, confirmer_rappel = $5, favori = $6,
           notification_envoyee = false, derniere_notification = NULL,
           date_creation_rappel = CURRENT_DATE, heure_creation_rappel = CURRENT_TIME
       WHERE id_rappel = $7 
       RETURNING *`,
      [description, type_rappel, date_rappel, heure_rappel, confirmer_rappel, favori, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rappel non trouvé' });
    }

    console.log(`🔄 Rappel ${id} modifié par l'aidant - notifications réinitialisées`);

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Erreur updateRappel:', err);
    res.status(500).json({ error: err.message });
  }
};


exports.deleteRappel = async (req, res) => {
  try {
    await pool.query('DELETE FROM rappels WHERE id_rappel = $1', [req.params.id_rappel]);
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur deleteRappel:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Nouvelle fonction pour obtenir les rappels d'un patient par son id
exports.getRappelsByPatientId = async (req, res) => {
  try {
    const { id_patient } = req.params;
    console.log("id_patient back:", id_patient);
    const rappels = await Rappel.findByPatient(id_patient);
    res.json(rappels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Nouvelle fonction pour obtenir les statistiques des rappels d'un patient
exports.getPatientRappelsStats = async (req, res) => {
  try {
    const { id_patient } = req.params;
    console.log("Récupération des statistiques pour le patient ID:", id_patient);
    
    if (!id_patient) {
      return res.status(400).json({ error: 'ID patient manquant' });
    }
    
    // Récupérer tous les rappels du patient
    const rappels = await Rappel.findByPatient(id_patient);
    
    if (!rappels || !Array.isArray(rappels)) {
      return res.status(404).json({ error: 'Aucun rappel trouvé pour ce patient' });
    }
    
    // Calculer les statistiques
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayStr = today.toISOString().split('T')[0];
    const total = rappels.length;
    
    // Filtrer les rappels d'aujourd'hui
    const todayRappels = rappels.filter(r => {
      const rappelDate = new Date(r.date_rappel);
      rappelDate.setHours(0, 0, 0, 0);
      return rappelDate.toISOString().split('T')[0] === todayStr;
    });
    
    const todayCount = todayRappels.length;
    
    // Compter les rappels confirmés
    const confirmes = rappels.filter(r => r.confirmer_rappel === true).length;
    
    // Compter les rappels favoris
    const favoris = rappels.filter(r => r.favori === true).length;
    
    // Calculer les pourcentages
    const confPct = total ? Math.round((confirmes/total)*100) : 0;
    const favPct = total ? Math.round((favoris/total)*100) : 0;
    
    // Récupérer le nombre d'aidants pour ce patient
    const aidantsQuery = `
      SELECT COUNT(*) as count
      FROM accompagnements
      WHERE id_patient = $1
    `;
    const aidantsResult = await pool.query(aidantsQuery, [id_patient]);
    const aidantsCount = parseInt(aidantsResult.rows[0].count, 10);
    
    // Construire l'objet de statistiques
    const stats = {
      total,
      today: todayCount,
      confirmes,
      favoris,
      confPct,
      favPct,
      aidants: aidantsCount
    };
    
    console.log("Statistiques calculées:", stats);
    res.status(200).json(stats);
    
  } catch (err) {
    console.error("Erreur lors du calcul des statistiques:", err);
    res.status(500).json({ error: err.message || "Erreur serveur lors du calcul des statistiques" });
  }
};

// Nouvelle fonction pour renvoyer un rappel
exports.resendRappel = async (req, res) => {
  try {
    const { id_rappel } = req.params;
    const aidantId = req.userId; // ID de l'aidant qui renvoie le rappel

    // Vérifier que le rappel existe et récupérer ses informations
    const rappelQuery = `
      SELECT r.*, p.nompatient, p.prenompatient, p.emailpatient, p.telephpatient
      FROM rappels r
      JOIN patients p ON r.id_patient = p.id_patient
      WHERE r.id_rappel = $1
    `;
    const rappelResult = await pool.query(rappelQuery, [id_rappel]);
    
    if (rappelResult.rows.length === 0) {
      return res.status(404).json({ error: 'Rappel non trouvé' });
    }

    const rappel = rappelResult.rows[0];

    // Vérifier que l'aidant est bien associé à ce patient
    const accompagnementQuery = `
      SELECT * FROM accompagnements 
      WHERE id_aidant = $1 AND id_patient = $2
    `;
    const accompagnementResult = await pool.query(accompagnementQuery, [aidantId, rappel.id_patient]);
    
    if (accompagnementResult.rows.length === 0) {
      return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à renvoyer ce rappel' });
    }

    // Mettre à jour les colonnes resend et date_resend dans la table aidant_notifications
    const updateNotificationQuery = `
      UPDATE aidant_notifications 
      SET resend = TRUE, date_resend = CURRENT_TIMESTAMP 
      WHERE id_rappel = $1 AND id_aidant = $2
    `;
    await pool.query(updateNotificationQuery, [id_rappel, aidantId]);

    // Récupérer le token du patient
    const patientTokenQuery = `
      SELECT token, endpoint, keys_p256dh, keys_auth
      FROM subscriptions 
      WHERE id_patient = $1
    `;
    const patientTokenResult = await pool.query(patientTokenQuery, [rappel.id_patient]);

    if (patientTokenResult.rows.length === 0) {
      return res.status(400).json({ error: 'Patient non connecté ou token non disponible' });
    }

    const patientToken = patientTokenResult.rows[0];

    // Préparer la notification pour le patient
    const notificationData = {
      rappel: {
        id: rappel.id_rappel,
        description: rappel.description,
        date: rappel.date_rappel,
        heure: rappel.heure_rappel,
        type: rappel.type_rappel
      },
      patient: {
        id: rappel.id_patient,
        nom: rappel.nompatient,
        prenom: rappel.prenompatient,
        email: rappel.emailpatient,
        telephone: rappel.telephpatient
      },
      aidant: {
        id: aidantId,
        action: 'resend'
      },
      statut: 'renvoye'
    };

    // Envoyer la notification au patient via Expo
    try {
      // Vérifier si fetch est disponible
      if (typeof fetch === 'undefined') {
        console.warn('fetch non disponible, notification Expo ignorée');
        // Enregistrer quand même l'action de renvoi dans la base de données
        const resendLogQuery = `
          INSERT INTO rappel_resend_logs (id_rappel, id_aidant, date_resend, statut)
          VALUES ($1, $2, NOW(), 'envoye_sans_notification')
        `;
        await pool.query(resendLogQuery, [id_rappel, aidantId]);

        console.log(`Rappel ${id_rappel} renvoyé par l'aidant ${aidantId} au patient ${rappel.id_patient} (sans notification)`);
        res.status(200).json({ 
          success: true, 
          message: 'Rappel renvoyé avec succès (notification désactivée)',
          rappel: {
            id: rappel.id_rappel,
            description: rappel.description,
            date: rappel.date_rappel,
            heure: rappel.heure_rappel
          }
        });
        return;
      }

      const message = {
        to: patientToken.token,
        sound: 'default',
        title: 'Rappel Renvoyé',
        body: `Votre aidant a renvoyé votre rappel: ${rappel.description}`,
        data: notificationData,
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      
      if (result.data && result.data.status === 'error') {
        console.error('Erreur Expo notification:', result.data.message);
        return res.status(500).json({ error: 'Erreur lors de l\'envoi de la notification' });
      }

      // Enregistrer l'action de renvoi dans la base de données
      const resendLogQuery = `
        INSERT INTO rappel_resend_logs (id_rappel, id_aidant, date_resend, statut)
        VALUES ($1, $2, NOW(), 'envoye')
      `;
      await pool.query(resendLogQuery, [id_rappel, aidantId]);

      // Créer une notification pour informer les autres aidants
      await createNotification(
        id_rappel,
        'renvoye',
        (patient) => `🔄 Le rappel "${rappel.description}" (${rappel.type_rappel}) prévu le ${new Date(rappel.date_rappel).toLocaleDateString('fr-FR')} à ${rappel.heure_rappel} pour ${patient.nompatient} ${patient.prenompatient} a été renvoyé par un aidant.`
      );

      console.log(`Rappel ${id_rappel} renvoyé par l'aidant ${aidantId} au patient ${rappel.id_patient}`);
      res.status(200).json({ 
        success: true, 
        message: 'Rappel renvoyé avec succès',
        rappel: {
          id: rappel.id_rappel,
          description: rappel.description,
          date: rappel.date_rappel,
          heure: rappel.heure_rappel
        }
      });

    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error);
      res.status(500).json({ error: 'Erreur lors de l\'envoi de la notification' });
    }

  } catch (err) {
    console.error('Erreur resendRappel:', err);
    res.status(500).json({ error: err.message });
  }
};

// Nouvelle fonction pour obtenir les informations de l'aidant propriétaire d'un rappel
exports.getAidantInfoForRappel = async (req, res) => {
  try {
    const { id_rappel } = req.params;
    
    // Récupérer les informations de l'aidant qui a créé le rappel
    const query = `
      SELECT DISTINCT a.id_aidant, a.nomaidant, a.prenomaidant, a.emailaidant, ac.lien_familial
      FROM aidants a
      JOIN accompagnements ac ON a.id_aidant = ac.id_aidant
      JOIN rappels r ON ac.id_patient = r.id_patient
      WHERE r.id_rappel = $1
      LIMIT 1
    `;
    
    const result = await pool.query(query, [id_rappel]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Aucun aidant trouvé pour ce rappel' });
    }
    
    const aidantInfo = result.rows[0];
    console.log(`📋 Informations aidant récupérées pour le rappel ${id_rappel}:`, aidantInfo);
    
    res.status(200).json(aidantInfo);
    
  } catch (err) {
    console.error('Erreur lors de la récupération des infos aidant:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.confirmRappel = async (req, res) => {
    const { id_rappel } = req.params;
    try {
        const result = await pool.query(
            'UPDATE rappels SET confirmer_rappel = TRUE WHERE id_rappel = $1 RETURNING *',
            [id_rappel]
        );

        if (result.rows.length > 0) {
            // Récupérer les informations complètes du rappel
            const rappelInfo = await pool.query(
                `SELECT r.description, r.type_rappel, r.date_rappel, r.heure_rappel, p.nompatient, p.prenompatient
                 FROM rappels r
                 JOIN patients p ON r.id_patient = p.id_patient
                 WHERE r.id_rappel = $1`,
                [id_rappel]
            );
            
            if (rappelInfo.rows.length > 0) {
                const rappel = rappelInfo.rows[0];
                
                // Créer une notification pour les aidants avec les détails
                await createNotification(
                    id_rappel,
                    'confirme',
                    (patient) => `✅ ${patient.nompatient} ${patient.prenompatient} a confirmé le rappel "${rappel.description}" (${rappel.type_rappel}) prévu le ${new Date(rappel.date_rappel).toLocaleDateString('fr-FR')} à ${rappel.heure_rappel}.`
                );
            }

            res.status(200).json({ success: true, rappel: result.rows[0] });
        } else {
            res.status(404).json({ error: 'Rappel non trouvé' });
        }
    } catch (error) {
        console.error("Erreur lors de la confirmation du rappel :", error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};




