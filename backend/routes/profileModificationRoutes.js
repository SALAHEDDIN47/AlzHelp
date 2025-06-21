const express = require('express');
const router = express.Router();
const profileModificationController = require('../controllers/profileModificationController');
const { verifyToken } = require('../middlewares/authJWT');

// Routes pour les modifications de profil
router.post('/create', verifyToken, profileModificationController.createModification);
router.get('/pending', verifyToken, profileModificationController.getPendingModifications);
router.get('/pending/:aidantId', verifyToken, profileModificationController.getPendingByAidant);
router.put('/approve/:modificationId', verifyToken, profileModificationController.approveModification);
router.put('/reject/:modificationId', verifyToken, profileModificationController.rejectModification);
router.get('/:modificationId', verifyToken, profileModificationController.getModificationById);
router.delete('/cleanup', verifyToken, profileModificationController.cleanupOldModifications);

module.exports = router; 