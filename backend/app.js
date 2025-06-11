// Configuration initiale
require('dotenv').config(); // Charge les variables d'environnement depuis .env
require('./cronJob'); // Initialise les tâches cron (planifiées)

// Importation des dépendances
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Importation des routes
const authRoutes = require('./routes/authRoutes');
const aidantRoutes = require('./routes/aidantRoutes');
const patientRoutes = require('./routes/patientRoutes');
const medicalEventRoutes = require('./routes/medicalEventRoutes');
const rappelsRoutes = require('./routes/rappelsRoutes');

// Importation de la configuration de la base de données
const pool = require('./config/db');

// Initialisation de l'application Express
const app = express();
const PORT = process.env.PORT || 3000;

/**********************************/
/*      MIDDLEWARES GLOBAUX       */
/**********************************/

// Middleware pour parser le corps des requêtes en JSON
app.use(bodyParser.json());

// Middleware pour parser les données des formulaires
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware pour gérer les CORS (Cross-Origin Resource Sharing)
app.use(cors());

// Middleware pour parser automatiquement le JSON (alternative à bodyParser.json())
app.use(express.json());

/**********************************/
/*         CONFIGURATION          */
/*          DES ROUTES            */
/**********************************/

// Route de base pour tester l'API
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API AlzHelp' });
});

// Routes pour l'authentification
app.use('/api/auth', authRoutes);

// Routes pour les aidants
app.use('/api/aidants', aidantRoutes);

// Routes pour les patients
app.use('/api/patients', patientRoutes);

// Routes pour les événements médicaux
app.use('/api/medical-events', medicalEventRoutes); // Note: J'ai renommé pour une meilleure convention REST

// Routes pour les rappels
app.use('/api/rappels', rappelsRoutes);

/**********************************/
/*   CONNEXION À LA BASE DE       */
/*          DONNÉES               */
/**********************************/

// Test de la connexion à la base de données
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Échec de la connexion à la base de données!', err.stack);
  } else {
    console.log('✅ Connexion à la base de données réussie à:', res.rows[0].now);
  }
});

/**********************************/
/*  GESTIONNAIRE D'ERREURS GLOBAL */
/**********************************/

// Middleware pour gérer les erreurs non capturées
app.use((err, req, res, next) => {
  console.error('⚠️ Erreur:', err.stack);
  res.status(500).json({ 
    success: false,
    message: 'Une erreur serveur est survenue',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

/**********************************/
/*        DÉMARRAGE DU SERVEUR    */
/**********************************/

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`🔗 http://localhost:${PORT}`);
  console.log(`⚡ Environnement: ${process.env.NODE_ENV || 'development'}`);
});