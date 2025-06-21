const express = require('express');
const router = express.Router();
const medicalEventsController = require('../controllers/medicalEventsController');
const { verifyToken } = require('../middlewares/authJWT');

// Routes pour les événements médicaux
router.get('/patients/:patientId/events', verifyToken, medicalEventsController.getEventsByPatientId);
router.post('/patients/:patientId/events', verifyToken, medicalEventsController.createEvent);
router.put('/events/:eventId', verifyToken, medicalEventsController.updateEvent);
router.delete('/events/:eventId', verifyToken, medicalEventsController.deleteEvent);

module.exports = router;
