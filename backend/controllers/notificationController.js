const pool = require('../config/db');

// Assurer que la table des notifications existe
const ensureNotificationTableExists = async () => {
  const tableQuery = `
    CREATE TABLE IF NOT EXISTS aidant_notifications (
      id SERIAL PRIMARY KEY,
      id_aidant CHARACTER VARYING REFERENCES aidants(id_aidant) ON DELETE CASCADE,
      id_rappel INTEGER REFERENCES rappels(id_rappel) ON DELETE CASCADE,
      type VARCHAR(20) NOT NULL, -- 'confirme' ou 'non_confirme'
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      is_dismissed BOOLEAN DEFAULT FALSE,
      resend BOOLEAN DEFAULT FALSE,
      date_resend TIMESTAMP WITH TIME ZONE
    );
  `;
  try {
    await pool.query(tableQuery);
    
    // Vérifier si la colonne is_dismissed existe, sinon l'ajouter
    const columnCheck = await pool.query(`
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='aidant_notifications' AND column_name='is_dismissed'
    `);
    
    if (columnCheck.rowCount === 0) {
        await pool.query('ALTER TABLE aidant_notifications ADD COLUMN is_dismissed BOOLEAN DEFAULT FALSE');
    }

    // Vérifier si la colonne resend existe, sinon l'ajouter
    const resendCheck = await pool.query(`
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='aidant_notifications' AND column_name='resend'
    `);
    
    if (resendCheck.rowCount === 0) {
        await pool.query('ALTER TABLE aidant_notifications ADD COLUMN resend BOOLEAN DEFAULT FALSE');
    }

    // Vérifier si la colonne date_resend existe, sinon l'ajouter
    const dateResendCheck = await pool.query(`
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='aidant_notifications' AND column_name='date_resend'
    `);
    
    if (dateResendCheck.rowCount === 0) {
        await pool.query('ALTER TABLE aidant_notifications ADD COLUMN date_resend TIMESTAMP WITH TIME ZONE');
    }

  } catch (error) {
    console.error('Erreur lors de la création/mise à jour de la table "aidant_notifications":', error);
  }
};

// Appeler cette fonction au démarrage pour s'assurer que la table est prête
ensureNotificationTableExists();

// Fonction pour sauvegarder le token dans la base de données
const saveTokenToDatabase = async (req, res) => {
  try {
    const { token, patientId, aidantId } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token requis' });
    }

    let query, params;

    if (patientId) {
      // Sauvegarder le token pour un patient
      query = `
        INSERT INTO subscriptions (token, id_patient, endpoint, keys_p256dh, keys_auth) 
        VALUES ($1, $2, $3, $4, $5) 
        ON CONFLICT (id_patient) 
        DO UPDATE SET 
          token = EXCLUDED.token,
          endpoint = EXCLUDED.endpoint,
          keys_p256dh = EXCLUDED.keys_p256dh,
          keys_auth = EXCLUDED.keys_auth
      `;
      
      // Pour Expo Go, on utilise le token comme endpoint
      params = [token, patientId, token, 'expo-go', 'expo-go'];
    } else {
      // Sauvegarder le token pour un aidant
      query = `
        INSERT INTO subscriptions (token, id_aidant, endpoint, keys_p256dh, keys_auth) 
        VALUES ($1, $2, $3, $4, $5) 
        ON CONFLICT (id_aidant) 
        DO UPDATE SET 
          token = EXCLUDED.token,
          endpoint = EXCLUDED.endpoint,
          keys_p256dh = EXCLUDED.keys_p256dh,
          keys_auth = EXCLUDED.keys_auth
      `;
      
      // Pour Expo Go, on utilise le token comme endpoint
      params = [token, aidantId, token, 'expo-go', 'expo-go'];
    }

    await pool.query(query, params);

    console.log(`Token sauvegardé pour ${patientId ? 'patient' : 'aidant'}: ${patientId || aidantId}`);
    res.status(200).json({ 
      success: true, 
      message: 'Token sauvegardé avec succès',
      userType: patientId ? 'patient' : 'aidant',
      userId: patientId || aidantId
    });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du token:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la sauvegarde du token',
      details: error.message 
    });
  }
};

// Fonction pour récupérer le token d'un utilisateur
const getTokenForUser = async (userId, userType) => {
  try {
    const query = `
      SELECT token, endpoint, keys_p256dh, keys_auth 
      FROM subscriptions 
      WHERE ${userType === 'patient' ? 'id_patient' : 'id_aidant'} = $1
    `;
    
    const result = await pool.query(query, [userId.toString()]);
    
    if (result.rows.length > 0) {
      const row = result.rows[0];
      return {
        token: row.token,
        endpoint: row.endpoint || row.token, // Fallback pour Expo Go
        keys_p256dh: row.keys_p256dh || 'expo-go',
        keys_auth: row.keys_auth || 'expo-go'
      };
    }
    
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération du token:', error);
    return null;
  }
};

// Fonction pour supprimer le token d'un utilisateur
const deleteTokenForUser = async (userId, userType) => {
  try {
    const query = `
      DELETE FROM subscriptions 
      WHERE ${userType === 'patient' ? 'id_patient' : 'id_aidant'} = $1
    `;
    
    await pool.query(query, [userId.toString()]);
    console.log(`Token supprimé pour ${userType}: ${userId}`);
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression du token:', error);
    return false;
  }
};

// Fonction pour créer une notification
const createNotification = async (id_rappel, type, messageGenerator) => {
    try {
        const rappelQuery = await pool.query('SELECT id_patient FROM rappels WHERE id_rappel = $1', [id_rappel]);
        if (rappelQuery.rows.length === 0) return;
        const { id_patient } = rappelQuery.rows[0];

        const accompagnementsQuery = await pool.query('SELECT id_aidant FROM accompagnements WHERE id_patient = $1', [id_patient.toString()]);
        const aidants = accompagnementsQuery.rows;

        const patientQuery = await pool.query('SELECT nompatient, prenompatient FROM patients WHERE id_patient = $1', [id_patient.toString()]);
        const patient = patientQuery.rows[0];

        for (const acc of aidants) {
            // Vérifier si une notification similaire a été créée récemment
            const existingNotif = await pool.query(
                `SELECT id FROM aidant_notifications 
                 WHERE id_aidant = $1 AND id_rappel = $2 AND type = $3 
                 AND created_at > NOW() - INTERVAL '1 minute'`,
                [acc.id_aidant, id_rappel, type]
            );

            if (existingNotif.rows.length === 0) {
                const message = messageGenerator(patient);
                await pool.query(
                    'INSERT INTO aidant_notifications (id_aidant, id_rappel, type, message) VALUES ($1, $2, $3, $4)',
                    [acc.id_aidant, id_rappel, type, message]
                );
            } else {
                console.log(`Notification pour rappel ${id_rappel}, aidant ${acc.id_aidant}, type ${type} existe déjà. Insertion ignorée.`);
            }
        }
    } catch (error) {
        console.error('Erreur lors de la création de la notification:', error);
    }
};

// Fonction pour récupérer les notifications d'un aidant
const getNotificationsForAidant = async (req, res) => {
    try {
        const id_aidant = req.userId;
        const query = `
            SELECT 
                n.*,
                r.description, r.heure_rappel, r.date_rappel, r.type_rappel,
                p.id_patient, p.nompatient, p.prenompatient, p.profile_image, p.telephpatient,
                ac.lien_familial
            FROM aidant_notifications n
            JOIN rappels r ON n.id_rappel = r.id_rappel
            JOIN patients p ON r.id_patient = p.id_patient
            JOIN accompagnements ac ON p.id_patient = ac.id_patient AND n.id_aidant = ac.id_aidant
            WHERE n.id_aidant = $1 AND n.is_dismissed = FALSE
            ORDER BY n.created_at DESC
        `;
        const { rows } = await pool.query(query, [id_aidant]);
        res.json(rows);
    } catch (error) {
        console.error('Erreur getNotificationsForAidant:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Fonction pour récupérer le nombre de notifications non lues
const getUnreadCount = async (req, res) => {
    try {
        const id_aidant = req.userId;
        const { rows } = await pool.query('SELECT COUNT(*) FROM aidant_notifications WHERE id_aidant = $1 AND is_read = FALSE', [id_aidant]);
        res.json({ count: parseInt(rows[0].count, 10) });
    } catch (error) {
        console.error('Erreur getUnreadCount:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Fonction pour marquer toutes les notifications comme lues
const markAllAsRead = async (req, res) => {
    try {
        const id_aidant = req.userId;
        await pool.query('UPDATE aidant_notifications SET is_read = TRUE WHERE id_aidant = $1', [id_aidant]);
        res.status(200).json({ success: true, message: 'Toutes les notifications ont été marquées comme lues.' });
    } catch (error) {
        console.error('Erreur markAllAsRead:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Fonction pour masquer (supprimer logiquement) une notification
const dismissNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const id_aidant = req.userId;
        
        await pool.query(
            'UPDATE aidant_notifications SET is_dismissed = TRUE WHERE id = $1 AND id_aidant = $2',
            [id, id_aidant]
        );
        
        res.json({ success: true, message: 'Notification masquée avec succès' });
    } catch (error) {
        console.error('Erreur lors du masquage de la notification:', error);
        res.status(500).json({ error: 'Erreur lors du masquage de la notification' });
    }
};

// Fonction pour renvoyer une notification
const resendNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const id_aidant = req.userId;
        
        // Mettre à jour la notification pour indiquer qu'elle a été renvoyée
        await pool.query(
            'UPDATE aidant_notifications SET resend = TRUE, date_resend = CURRENT_TIMESTAMP WHERE id = $1 AND id_aidant = $2',
            [id, id_aidant]
        );
        
        res.json({ success: true, message: 'Notification renvoyée avec succès' });
    } catch (error) {
        console.error('Erreur lors du renvoi de la notification:', error);
        res.status(500).json({ error: 'Erreur lors du renvoi de la notification' });
    }
};

module.exports = { 
  saveTokenToDatabase,
  getTokenForUser,
  deleteTokenForUser,
  createNotification,
  getNotificationsForAidant,
  getUnreadCount,
  markAllAsRead,
  dismissNotification,
  resendNotification
}; 