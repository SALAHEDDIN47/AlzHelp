const pool = require('../config/db');  // Connexion à la base de données

// Fonction pour sauvegarder le token dans la base de données
const saveTokenToDatabase = async (req, res) => {
  const { token, patientId } = req.body;

  try {
    const query = 'INSERT INTO subscriptions (token, id_patient) VALUES ($1, $2) ON CONFLICT (id_patient) DO UPDATE SET token = $1';
    await pool.query(query, [token, patientId]);

    res.status(200).send('Token sauvegardé avec succès');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur lors de la sauvegarde du token');
  }
};

module.exports = { saveTokenToDatabase };
