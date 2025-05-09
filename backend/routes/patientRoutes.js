const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const authMiddleware = require('../middlewares/auth');

// Routes protégées par authentification
router.post('/', patientController.createPatient);
router.get('/:id/aidants', authMiddleware, patientController.getAidants);
router.put('/:id', authMiddleware, patientController.updatePatient);
router.get('/me', authMiddleware, patientController.getCurrentPatient);

module.exports = router;