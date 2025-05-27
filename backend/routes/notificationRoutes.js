const express = require('express');
const router = express.Router();
const { saveTokenToDatabase } = require('../controllers/notificationController');

// Route pour sauvegarder le token dans la base de données
router.post('/saveToken', saveTokenToDatabase);

module.exports = router;
