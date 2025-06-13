const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const authMiddleware = require('../middlewares/auth');
const { verifyToken } = require('../middlewares/authJWT');

// Routes protégées par authentification
router.post('/create', patientController.createPatient);
router.get('/thispatient', verifyToken, patientController.getCurrentPatient);
router.get('/:id/aidants', authMiddleware, patientController.getAidants);
router.put('/update/:id', authMiddleware, patientController.updatePatient);


module.exports = router;
