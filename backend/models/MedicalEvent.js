const db = require('../config/db');
const fs = require('fs');
const path = require('path');

const MedicalEvent = {
  // Créer un nouvel événement médical
  create: async ({ titre, date_event, description, fichier, id_patient }) => {
    let fichier_path = null;
    let fichier_type = null;

    if (fichier) {
      console.log("Fichier reçu par le modèle:", fichier);
      
      // Créer le dossier uploads s'il n'existe pas
      const uploadDir = path.join(__dirname, '../uploads/medicalevent');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Générer un nom de fichier unique
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      fichier_type = fichier.mimetype;
      
      // Utiliser le dossier medicalevent pour organiser les fichiers
      fichier_path = path.join('uploads/medicalevent', uniqueSuffix + '-' + fichier.originalname);

      // Vérifier si le fichier a un buffer ou un chemin
      if (fichier.buffer) {
        // Écrire le fichier sur le disque à partir du buffer
        fs.writeFileSync(path.join(__dirname, '../', fichier_path), fichier.buffer);
      } else if (fichier.path) {
        // Copier le fichier depuis le chemin temporaire
        fs.copyFileSync(fichier.path, path.join(__dirname, '../', fichier_path));
      } else {
        console.error("Le fichier n'a ni buffer ni path:", fichier);
      }
    }

    const { rows } = await db.query(
      `INSERT INTO medicalevent 
       (titre, date_event, description, fichier_path, fichier_type, id_patient) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [titre, date_event, description, fichier_path, fichier_type, id_patient]
    );
    return rows[0];
  },

  // Récupérer tous les événements d'un patient
  findByPatient: async (id_patient) => {
    const { rows } = await db.query(
      'SELECT * FROM medicalevent WHERE id_patient = $1 ORDER BY date_event DESC',
      [id_patient]
    );
    return rows;
  },

  // Récupérer un événement par son ID
  findById: async (id_event) => {
    const { rows } = await db.query(
      'SELECT * FROM medicalevent WHERE id_event = $1',
      [id_event]
    );
    return rows[0];
  },

  // Mettre à jour un événement
  update: async (id_event, { titre, date_event, description, fichier }) => {
    let updates = [];
    let params = [];
    let paramIndex = 1;

    if (titre) {
      updates.push(`titre = $${paramIndex}`);
      params.push(titre);
      paramIndex++;
    }

    if (date_event) {
      updates.push(`date_event = $${paramIndex}`);
      params.push(date_event);
      paramIndex++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(description);
      paramIndex++;
    }

    // Gestion du fichier
    let fichier_path = null;
    let fichier_type = null;

    if (fichier) {
      // Supprimer l'ancien fichier s'il existe
      const existingEvent = await MedicalEvent.findById(id_event);
      if (existingEvent && existingEvent.fichier_path) {
        try {
          fs.unlinkSync(path.join(__dirname, '../', existingEvent.fichier_path));
        } catch (err) {
          console.error('Erreur suppression ancien fichier:', err);
        }
      }

      // Créer un nouveau fichier
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      fichier_type = fichier.mimetype;
      fichier_path = path.join('uploads', uniqueSuffix + '-' + fichier.originalname);
      fs.writeFileSync(path.join(__dirname, '../', fichier_path), fichier.buffer);

      updates.push(`fichier_path = $${paramIndex}`);
      params.push(fichier_path);
      paramIndex++;

      updates.push(`fichier_type = $${paramIndex}`);
      params.push(fichier_type);
      paramIndex++;
    }

    if (updates.length === 0) {
      throw new Error('Aucune donnée à mettre à jour');
    }

    params.push(id_event);
    const query = `UPDATE medicalevent SET ${updates.join(', ')} WHERE id_event = $${paramIndex} RETURNING *`;
    
    const { rows } = await db.query(query, params);
    return rows[0];
  },

  // Supprimer un événement
  delete: async (id_event) => {
    // Supprimer le fichier associé s'il existe
    const event = await MedicalEvent.findById(id_event);
    if (event && event.fichier_path) {
      try {
        fs.unlinkSync(path.join(__dirname, '../', event.fichier_path));
      } catch (err) {
        console.error('Erreur suppression fichier:', err);
      }
    }

    const { rowCount } = await db.query(
      'DELETE FROM medicalevent WHERE id_event = $1',
      [id_event]
    );
    return rowCount > 0;
  },

  // Récupérer le fichier d'un événement
  getFile: async (id_event) => {
    const event = await MedicalEvent.findById(id_event);
    if (!event || !event.fichier_path) {
      return null;
    }

    const filePath = path.join(__dirname, '../', event.fichier_path);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    return {
      path: filePath,
      type: event.fichier_type,
      name: path.basename(event.fichier_path),
    };
  },
};

module.exports = MedicalEvent; 
