const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { verifyToken } = require('../middlewares/authJWT');

// Routes protégées par authentification
router.post('/create', patientController.createPatient);
router.get('/thispatient', verifyToken, patientController.getCurrentPatient);
router.get('/:id/aidants', verifyToken, patientController.getAidants);
router.put('/update/:id', verifyToken, patientController.updatePatient);
router.get('/:id', patientController.getPatientById);

module.exports = router;
