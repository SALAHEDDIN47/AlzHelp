const express = require('express');
const router = express.Router();
const rappelsController = require('../controllers/rappelsController');
const { verifyToken } = require('../middlewares/authJWT');

// Routes GET
router.get('/thisrappels', verifyToken, rappelsController.getRappelsForLoggedInPatient);
router.get('/aidant_rappels', verifyToken, rappelsController.getRappelsForLoggedInAidant);
router.get('/patient/:id_patient', rappelsController.getRappelsByPatientId);
router.get('/patient/:id_patient/stats', rappelsController.getPatientRappelsStats); // Nouvelle route pour les statistiques

// Routes PUT
router.put('/:id_rappel/pin', verifyToken, rappelsController.togglePin);
router.put('/:id_rappel/confirm', verifyToken, rappelsController.toggleConfirm);
router.get('/:id_rappel/aidant-info', verifyToken, rappelsController.getAidantInfoForRappel);
router.put('/:id_rappel', verifyToken, rappelsController.updateRappel);

// Routes POST
router.post('/create', verifyToken, rappelsController.createRappel);
router.post('/:id_rappel/resend', verifyToken, rappelsController.resendRappel); // Nouvelle route pour renvoyer un rappel

// Routes DELETE
router.delete('/:id_rappel/delete', verifyToken, rappelsController.deleteRappel);

module.exports = router;
