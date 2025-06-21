const express = require('express');
const router = express.Router();
const accompagnementsController = require('../controllers/accompagnementsController');
const { verifyToken } = require('../middlewares/authJWT');

// Routes pour les accompagnements
router.get('/patient/:patientId', verifyToken, accompagnementsController.getAccompagnementByPatientId);
router.post('/', verifyToken, accompagnementsController.createAccompagnement);
router.put('/:id', verifyToken, accompagnementsController.updateAccompagnement);
router.delete('/:id', verifyToken, accompagnementsController.deleteAccompagnement);

module.exports = router;