const express = require('express');
const router = express.Router();
const aidantController = require('../controllers/aidantController');
const authMiddleware = require('../middlewares/auth');
const authController = require('../controllers/authController'); // Assurez-vous que ce fichier est bien importé
const { addPatientForAidant } = require('../controllers/authController'); // Assurez-vous d'importer le contrôleur correctement
const { verifyToken } = require('../middlewares/authJWT');
// Définir la route pour ajouter un patient à un aidant
router.post('/addPatientForAidant', authController.addPatientForAidant);

// Routes protégées par authentification
router.post('/', aidantController.createAidant);
router.get('/me', verifyToken, aidantController.getCurrentAidant); // mettre AVANT
router.get('/:id/getPatients', verifyToken, aidantController.getPatients);
router.get('/patients/:id', verifyToken,aidantController.getAidantsByPatient);
router.put('/:id', verifyToken, aidantController.updateAidant);
router.post('/addPatientForAidant', addPatientForAidant);  // Route pour ajouter le patient à l'aidant
module.exports = router;