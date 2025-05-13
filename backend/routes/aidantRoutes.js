const express = require('express');
const router = express.Router();
const aidantController = require('../controllers/aidantController');
const authMiddleware = require('../middlewares/auth');

// Routes protégées par authentification
router.post('/', aidantController.createAidant);
router.get('/me', authMiddleware, aidantController.getCurrentAidant); // mettre AVANT
router.get('/:id/patients', authMiddleware, aidantController.getPatients);
router.put('/:id', authMiddleware, aidantController.updateAidant);

module.exports = router;