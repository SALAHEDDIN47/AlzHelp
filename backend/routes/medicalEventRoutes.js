const express = require('express');
const router = express.Router();
const medicalEventController = require('../controllers/medicalEventController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration de Multer pour gérer les fichiers uploadés
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Créer le dossier s'il n'existe pas
    const uploadDir = path.join(__dirname, '../uploads/medicalevent');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Ajouter des logs pour déboguer
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    console.log("Fichier reçu par multer:", file);
    cb(null, true);
  }
});

router.post(
  '/patients/:patientId/events',
  upload.single('fichier'), // Assurez-vous que 'fichier' correspond au nom du champ dans le FormData
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
