const express = require('express');
const router = express.Router();
const medicalEventController = require('../controllers/medicalEventController');
const multer = require('multer');

// Configuration de Multer pour gérer les fichiers uploadés
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post(
  '/patients/:patientId/events',
  upload.single('fichier'),
  medicalEventController.createEvent
);

router.get(
  '/patients/:patientId/events',
  medicalEventController.getPatientEvents
);

router.put(
  '/events/:eventId',
  upload.single('fichier'),
  medicalEventController.updateEvent
);

router.delete(
  '/events/:eventId',
  medicalEventController.deleteEvent
);

router.get(
  '/events/:eventId/file',
  medicalEventController.downloadFile
);

module.exports = router;