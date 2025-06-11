const cron = require('node-cron');
const webpush = require('web-push');
const pool = require('./config/db');

// Configuration des clés VAPID pour Expo Push
const publicKey = 'BKjM0HhFa0YBKRYL1iZca47RV7AjUgLhj_1kTn54CdFjPUwcbOxIcCo70MiRDcI3Mv4x3hvRgIcMvXy_NlsyRPQ';  // Remplacez par votre clé publique
const privateKey = 'g0Vvq8nhn2hsFTDXWGvphI_PJ6X71PiOJE60pTkKfEk'; // Remplacez par votre clé privée
webpush.setVapidDetails('mailto:votre_email@exemple.com', publicKey, privateKey);

// Cron job qui vérifie chaque minute si un rappel doit être envoyé
cron.schedule('* * * * *', async () => {
  const currentTime = new Date();
  const formattedDate = currentTime.toISOString().split('T')[0];
  const formattedTime = currentTime.toTimeString().split(' ')[0];
     
      console.log(`Vérification des rappels à ${formattedDate} ${formattedTime}`);
  const query = `
    SELECT * FROM rappels
    WHERE date_rappel = $1 AND heure_rappel = $2 AND confirmer_rappel = false
  `;
  const result = await pool.query(query, [formattedDate, formattedTime]);

  if (result.rows.length > 0) {
    for (let rappel of result.rows) {
      const subscription = await getSubscription(rappel.id_patient);

      if (subscription) {
        const message = {
          title: 'Rappel Médical',
          body: rappel.description,
        };

        try {
          await webpush.sendNotification(subscription, JSON.stringify(message));
          console.log('Notification envoyée');

          // Mise à jour du rappel pour qu'il soit marqué comme confirmé
          await pool.query('UPDATE rappels SET confirmer_rappel = true WHERE id = $1', [rappel.id]);
        } catch (error) {
          console.error('Erreur lors de l\'envoi de la notification', error);
        }
      }
    }
  }
});

// Fonction pour obtenir l'abonnement du patient
const getSubscription = async (patientId) => {
  const query = 'SELECT * FROM subscriptions WHERE id_patient = $1';
  const result = await pool.query(query, [patientId]);

  return result.rows[0] ? {
    endpoint: result.rows[0].endpoint,
    keys: {
      p256dh: result.rows[0].keys_p256dh,
      auth: result.rows[0].keys_auth,
    },
  } : null;
};

module.exports = { cronJob: cron };