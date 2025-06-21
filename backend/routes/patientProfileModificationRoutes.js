const express = require('express');
const router = express.Router();
const patientProfileModificationController = require('../controllers/patientProfileModificationController');
const { verifyToken } = require('../middlewares/authJWT');

// Routes pour les modifications de profil patient
router.post('/create', verifyToken, patientProfileModificationController.createModification);
router.get('/pending', verifyToken, patientProfileModificationController.getPendingModifications);
router.get('/pending/:patientId', verifyToken, patientProfileModificationController.getPendingByPatient);
router.put('/approve/:modificationId', verifyToken, patientProfileModificationController.approveModification);
router.put('/reject/:modificationId', verifyToken, patientProfileModificationController.rejectModification);
router.get('/:modificationId', verifyToken, patientProfileModificationController.getModificationById);
router.delete('/cleanup', verifyToken, patientProfileModificationController.cleanupOldModifications);

module.exports = router; 