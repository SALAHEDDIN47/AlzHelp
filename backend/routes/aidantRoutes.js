const express = require('express');
const router = express.Router();
const aidantController = require('../controllers/aidantController');
const authMiddleware = require('../middlewares/auth');
const authController = require('../controllers/authController'); // Assurez-vous que ce fichier est bien importé
const { addPatientForAidant } = require('../controllers/authController'); // Assurez-vous d'importer le contrôleur correctement
// Définir la route pour ajouter un patient à un aidant
router.post('/addPatientForAidant', authController.addPatientForAidant);

// Routes protégées par authentification
router.post('/', aidantController.createAidant);
router.get('/me', authMiddleware, aidantController.getCurrentAidant); // mettre AVANT
router.get('/:id/patients', authMiddleware, aidantController.getPatients);
router.put('/:id', authMiddleware, aidantController.updateAidant);
router.post('/addPatientForAidant', addPatientForAidant);  // Route pour ajouter le patient à l'aidant
module.exports = router;