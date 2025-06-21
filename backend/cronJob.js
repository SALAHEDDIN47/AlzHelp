const cron = require('node-cron');
const pool = require('./config/db');
const { createNotification } = require('./controllers/notificationController');

// Vérifier et créer la colonne notification_envoyee si elle n'existe pas
const ensureNotificationColumn = async () => {
  try {
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'rappels' AND column_name = 'notification_envoyee'
    `;
    const result = await pool.query(checkQuery);
    
    if (result.rows.length === 0) {
      console.log('Création de la colonne notification_envoyee...');
      await pool.query('ALTER TABLE rappels ADD COLUMN notification_envoyee BOOLEAN DEFAULT FALSE');
      console.log('Colonne notification_envoyee créée avec succès');
    } else {
      console.log('Colonne notification_envoyee existe déjà');
    }
  } catch (error) {
    console.error('Erreur lors de la vérification/création de la colonne notification_envoyee:', error);
  }
};

// Fonction pour vérifier et envoyer les rappels
const checkAndSendReminders = async () => {
  try {
    const currentTime = new Date();
    const currentDate = currentTime.toISOString().split('T')[0];
    // Utiliser l'heure locale sans conversion de fuseau horaire
    const currentTimeString = currentTime.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false // Format 24h
    });

    console.log(`🔔 Vérification des rappels pour ${currentDate} à ${currentTimeString}`);

    // Récupérer les rappels pour l'heure actuelle qui ne sont pas encore confirmés
    // ET qui n'ont pas reçu de notification dans les 5 dernières minutes
    const query = `
      SELECT r.*, 
             p.nompatient, p.prenompatient, p.emailpatient, p.telephpatient
      FROM rappels r
      JOIN patients p ON r.id_patient = p.id_patient
      WHERE r.date_rappel = $1 
      AND r.heure_rappel = $2 
      AND (r.confirmer_rappel IS NULL OR r.confirmer_rappel = false)
      AND (
        r.derniere_notification IS NULL 
        OR r.derniere_notification < NOW() - INTERVAL '5 minutes'
      )
    `;

    const result = await pool.query(query, [currentDate, currentTimeString]);

    if (result.rows.length > 0) {
      console.log(`📋 ${result.rows.length} rappel(s) trouvé(s) pour cette heure`);

    for (const rappel of result.rows) {
        console.log(`📢 Envoi de notification pour le rappel ${rappel.id_rappel}: ${rappel.description}`);

        // Marquer la notification comme envoyée
        await pool.query(
          'UPDATE rappels SET notification_envoyee = true WHERE id_rappel = $1',
          [rappel.id_rappel]
        );

        // Programmer la vérification de confirmation après 5 minutes
        setTimeout(async () => {
          await checkReminderConfirmation(rappel.id_rappel);
        }, 5 * 60 * 1000); // 5 minutes

        console.log(`✅ Notification marquée comme envoyée pour le rappel ${rappel.id_rappel}`);
      }
    } else {
      console.log('📭 Aucun rappel à envoyer à cette heure');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification des rappels:', error);
  }
};

// Fonction pour vérifier la confirmation d'un rappel après 5 minutes
const checkReminderConfirmation = async (rappelId) => {
  try {
    // Vérifier si le rappel a été confirmé
    const result = await pool.query(
      `SELECT r.*, p.nompatient, p.prenompatient 
       FROM rappels r
       JOIN patients p ON r.id_patient = p.id_patient 
       WHERE r.id_rappel = $1`,
      [rappelId]
    );

    if (result.rows.length === 0) {
      console.log(`❓ Rappel ${rappelId} non trouvé`);
      return;
    }

    const rappel = result.rows[0];

    if (!rappel.confirmer_rappel) {
      console.log(`⚠️ Rappel ${rappelId} non confirmé après 5 minutes`);

      // Créer une notification de non-confirmation dans la table aidant_notifications
      await createNotification(
        rappelId,
        'non_confirme',
        (patient) => `❌ Le rappel "${rappel.description}" (${rappel.type_rappel}) prévu le ${new Date(rappel.date_rappel).toLocaleDateString('fr-FR')} à ${rappel.heure_rappel} pour ${patient.nompatient} ${patient.prenompatient} n'a pas été confirmé.`
      );

      // Récupérer les aidants associés au patient
      const aidantsResult = await pool.query(
        `SELECT a.id_aidant, a.nomaidant, a.prenomaidant 
         FROM aidants a 
         JOIN accompagnements ac ON a.id_aidant = ac.id_aidant
         WHERE ac.id_patient = $1`,
        [rappel.id_patient]
      );
      
      const aidants = aidantsResult.rows;

      if (aidants.length > 0) {
        console.log(`📞 ${aidants.length} aidant(s) à notifier pour le rappel non confirmé`);
        for (const aidant of aidants) {
          console.log(`📱 Aidant ${aidant.prenomaidant} ${aidant.nomaidant} notifié du non-confirmation du rappel ${rappelId}`);
        }
      } else {
        console.log(`ℹ️ Aucun aidant associé au patient pour le rappel ${rappelId}`);
      }
    } else {
      console.log(`✅ Rappel ${rappelId} confirmé, pas de notification à l'aidant`);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification de confirmation:', error);
  }
};

// Démarrer le cron job pour vérifier les rappels toutes les minutes
const startCronJob = async () => {
  console.log('🚀 Démarrage du cron job pour les rappels médicaux...');
  
  // Vérifier que la colonne notification_envoyee existe
  await ensureNotificationColumn();
  
  // Vérifier les rappels toutes les minutes
  cron.schedule('* * * * *', () => {
    checkAndSendReminders();
  });

  // Vérifier les confirmations de rappels toutes les 5 minutes
  cron.schedule('*/5 * * * *', () => {
    checkReminderConfirmations();
  });

  console.log('⏰ Cron job démarré - vérification des rappels toutes les minutes');
};

async function checkReminderConfirmations() {
    try {
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000);

        const reminders = await pool.query(
            `SELECT r.*, p.nompatient, p.prenompatient
             FROM rappels r
             JOIN patients p ON r.id_patient = p.id_patient
             WHERE (r.confirmer_rappel IS NULL OR r.confirmer_rappel = FALSE)
               AND (r.date_rappel + r.heure_rappel) < $1`,
            [fiveMinutesAgo]
        );

        for (const rappel of reminders.rows) {
            // Vérifier si une notification de non-confirmation a déjà été envoyée pour ce rappel
            const existingNotif = await pool.query(
                'SELECT id FROM aidant_notifications WHERE id_rappel = $1 AND type = $2',
                [rappel.id_rappel, 'non_confirme']
            );

            if (existingNotif.rows.length === 0) {
                // Créer une notification de non-confirmation avec les détails
                await createNotification(
                    rappel.id_rappel,
                    'non_confirme',
                    (patient) => `❌ Le rappel "${rappel.description}" (${rappel.type_rappel}) prévu le ${new Date(rappel.date_rappel).toLocaleDateString('fr-FR')} à ${rappel.heure_rappel} pour ${patient.nompatient} ${patient.prenompatient} n'a pas été confirmé.`
                );
            }
        }
    } catch (error) {
        console.error('Erreur lors de la vérification des confirmations de rappel:', error);
    }
}

module.exports = {
  startCronJob,
  checkAndSendReminders,
  checkReminderConfirmation,
  checkReminderConfirmations
};
