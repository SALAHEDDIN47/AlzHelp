// Configuration initiale
require('dotenv').config(); // Charge les variables d'environnement depuis .env
require('./init'); // Exécuter le script d'initialisation
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const { startCronJob, checkAndSendReminders } = require('./cronJob');  // Import correct de la fonction

const authRoutes = require('./routes/authRoutes');
const aidantRoutes = require('./routes/aidantRoutes');
const patientRoutes = require('./routes/patientRoutes');
const medicalEventRoutes = require('./routes/medicalEventRoutes');
const rappelsRoutes = require('./routes/rappelsRoutes'); // Import des routes
const notificationRoutes = require('./routes/notificationRoutes'); // Import des routes de notification
const accompagnementRoutes = require('./routes/accompagnementsRoutes');
const { exec } = require('child_process');
const cron = require('node-cron');
const { checkReminderConfirmations } = require('./cronJob.js');


// Middleware pour parser le corps des requêtes en JSON
app.use(bodyParser.json());

// Middleware pour parser les données des formulaires
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());

// Démarrer le cron job pour les rappels
startCronJob();

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Test DB connection
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('Database connection error', err.stack);
  } else {
    console.log('Database connected');
  }
});

// Test DB connection immediately
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed!', err.stack);
  } else {
    console.log('✅ Database connected successfully at:', res.rows[0].now);
  }
});

// Route de base pour tester l'API
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API AlzHelp' });
});

app.use('/api/auth', authRoutes);
app.use('/api/aidants', aidantRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/medical-events', medicalEventRoutes);
app.use('/api/rappels', rappelsRoutes);
app.use('/api/accompagnements', accompagnementRoutes);
app.use('/api/notifications', notificationRoutes); // Route pour les notifications

// Tâche CRON pour vérifier les confirmations de rappel toutes les minutes
cron.schedule('* * * * *', async () => {
  // ... existing code ...
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT},kheddam alme3alem`);
});


// Middleware pour gérer les erreurs non capturées
app.use((err, req, res, next) => {
  console.error('⚠️ Erreur:', err.stack);
  res.status(500).json({ 
    success: false,
    message: 'Une erreur serveur est survenue',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`🔗 http://localhost:${PORT}`);
  console.log(`⚡ Environnement: ${process.env.NODE_ENV || 'development'}`);
});