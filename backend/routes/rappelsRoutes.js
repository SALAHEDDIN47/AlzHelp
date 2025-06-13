const express = require('express');
const router = express.Router();
const rappelsController = require('../controllers/rappelsController');
const { verifyToken } = require('../middlewares/authJWT');

// Routes GET
router.get('/thisrappels', verifyToken, rappelsController.getRappelsForLoggedInPatient);
router.get('/aidant_rappels', verifyToken, rappelsController.getRappelsForLoggedInAidant);

// Routes PUT
router.put('/:id_rappel/pin', verifyToken, rappelsController.togglePin);
router.put('/:id_rappel/confirm', verifyToken, rappelsController.toggleConfirm);
router.put('/:id_rappel', verifyToken, rappelsController.updateRappel);

// Routes POST
router.post('/create', verifyToken, rappelsController.createRappel);

// Routes DELETE
router.delete('/:id_rappel/delete', verifyToken, rappelsController.deleteRappel);

module.exports = router;
