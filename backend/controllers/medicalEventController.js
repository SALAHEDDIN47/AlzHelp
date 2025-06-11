const MedicalEvent = require('../models/MedicalEvent');

exports.createEvent = async (req, res) => {
  try {
    const { titre, date_event, description } = req.body;
    const id_patient = req.params.patientId;
    const fichier = req.file;

    if (!titre || !date_event || !id_patient) {
      return res.status(400).json({ message: 'Titre, date et ID patient sont obligatoires' });
    }

    const event = await MedicalEvent.create({ 
      titre, 
      date_event, 
      description, 
      fichier, 
      id_patient 
    });

    res.status(201).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
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