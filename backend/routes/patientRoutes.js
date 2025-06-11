const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const authMiddleware = require('../middlewares/auth');

// Routes protégées par authentification
router.post('/create', patientController.createPatient);
router.get('/thispatient', authMiddleware, patientController.getCurrentPatient);
router.get('/:id/aidants', authMiddleware, patientController.getAidants);
router.put('/:id', authMiddleware, patientController.updatePatient);


module.exports = router;
