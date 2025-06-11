const express = require('express');
const router = express.Router();
const rappelsController = require('../controllers/rappelsController');
const { authPatient } = require('../middlewares/auth');
const { getRappelsForLoggedInPatient } = require('../controllers/rappelsController');
const { verifyToken } = require('../middlewares/authJWT');



router.get('/thisrappels', verifyToken, getRappelsForLoggedInPatient);
router.put('/:id_rappel/pin', verifyToken,rappelsController.togglePin);
router.put('/:id_rappel/confirm', verifyToken,rappelsController.toggleConfirm)

module.exports = router;