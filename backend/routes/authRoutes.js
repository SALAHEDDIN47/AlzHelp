const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const authenticate = require('../middlewares/auth');
const jwt = require('jsonwebtoken');
const authController = require('../controllers/authController');
require('dotenv').config();

// Route d'inscription
router.post('/register', authController.register);

// Route de connexion
router.post('/login', authController.login); // Utilisation de la méthode login du contrôleur

// Ajouter un patient à un aidant
router.post('/aidants/addPatientForAidant', authController.addPatientForAidant);

// Vérifier si un aidant a des patients associés
router.get('/checkPatientForAidant/:aidantId', authController.checkPatientForAidant);

// Route protégée
router.get('/profile', authenticate, (req, res) => {
  res.json({ message: `Bienvenue utilisateur ${req.user.id}` });
});

module.exports = router;
