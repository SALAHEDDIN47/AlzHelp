const MedicalEvent = require('../models/MedicalEvent');
const fs = require('fs');

exports.createEvent = async (req, res) => {
  try {
    const { titre, date_event, description } = req.body;
    const id_patient = req.params.patientId;
    
    // Vérifier si le fichier est présent
    console.log("Fichier reçu:", req.file);
    console.log("Corps de la requête:", req.body);
    
    const fichier_path = req.file ? `uploads/medicalevent/${req.file.filename}` : null;
    const fichier_type = req.file ? req.file.mimetype : null;
    
    console.log("fichier_path:", fichier_path);
    console.log("fichier_type:", fichier_type);
    console.log("id_patient:", id_patient);

    if (!titre || !date_event || !id_patient) {
      return res.status(400).json({ message: 'Titre, date et ID patient sont obligatoires' });
    }

    // Si req.file existe mais n'a pas de buffer, ajoutez-le
    let fichier = null;
    if (req.file) {
      fichier = {
        buffer: req.file.buffer || fs.readFileSync(req.file.path),
        mimetype: req.file.mimetype,
        originalname: req.file.originalname
      };
    }

    const event = await MedicalEvent.create({ 
      titre, 
      date_event, 
      description, 
      fichier, // Passer l'objet fichier complet
      id_patient 
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Erreur création événement:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getPatientEvents = async (req, res) => {
  try {
    const { patientId } = req.params;
    const events = await MedicalEvent.findByPatient(patientId);
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { titre, date_event, description } = req.body;
    const fichier = req.file;

    const updatedEvent = await MedicalEvent.update(eventId, { 
      titre, 
      date_event, 
      description, 
      fichier 
    });

    if (!updatedEvent) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    res.json(updatedEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const deleted = await MedicalEvent.delete(eventId);

    if (!deleted) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.downloadFile = async (req, res) => {
  try {
    const { eventId } = req.params;
    const file = await MedicalEvent.getFile(eventId);

    if (!file) {
      return res.status(404).json({ message: 'Fichier non trouvé' });
    }

    res.download(file.path, file.name, (err) => {
      if (err) {
        console.error('Erreur téléchargement:', err);
        res.status(500).json({ message: 'Erreur lors du téléchargement' });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}; 
