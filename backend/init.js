const fs = require('fs');
const path = require('path');
const pool = require('./config/db');

// Créer le dossier uploads/profiles s'il n'existe pas
const uploadsDir = path.join(__dirname, 'uploads');
const profilesDir = path.join(uploadsDir, 'profiles');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir);
}

console.log('Dossiers uploads/profiles créés avec succès');

// Vérifier et ajouter la colonne created_at à la table accompagnements si elle n'existe pas
const checkAccompagnementsCreatedAt = async () => {
  try {
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'accompagnements' AND column_name = 'created_at'
    `;
    const result = await pool.query(checkQuery);
    
    if (result.rows.length === 0) {
      console.log('Ajout de la colonne created_at à la table accompagnements...');
      await pool.query('ALTER TABLE accompagnements ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
      console.log('Colonne created_at ajoutée avec succès à la table accompagnements');
    } else {
      console.log('Colonne created_at existe déjà dans la table accompagnements');
    }
  } catch (error) {
    console.error('Erreur lors de la vérification/ajout de la colonne created_at:', error);
  }
};

// Vérifier et ajouter les colonnes de date et heure de création à la table rappels
const checkRappelsCreationColumns = async () => {
  try {
    // Vérifier la colonne date_creation_rappel
    const checkDateQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'rappels' AND column_name = 'date_creation_rappel'
    `;
    const dateResult = await pool.query(checkDateQuery);
    
    if (dateResult.rows.length === 0) {
      console.log('Ajout de la colonne date_creation_rappel à la table rappels...');
      await pool.query('ALTER TABLE rappels ADD COLUMN date_creation_rappel DATE DEFAULT CURRENT_DATE');
      console.log('Colonne date_creation_rappel ajoutée avec succès à la table rappels');
    } else {
      console.log('Colonne date_creation_rappel existe déjà dans la table rappels');
    }

    // Vérifier la colonne heure_creation_rappel
    const checkHeureQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'rappels' AND column_name = 'heure_creation_rappel'
    `;
    const heureResult = await pool.query(checkHeureQuery);
    
    if (heureResult.rows.length === 0) {
      console.log('Ajout de la colonne heure_creation_rappel à la table rappels...');
      await pool.query('ALTER TABLE rappels ADD COLUMN heure_creation_rappel TIME DEFAULT CURRENT_TIME');
      console.log('Colonne heure_creation_rappel ajoutée avec succès à la table rappels');
    } else {
      console.log('Colonne heure_creation_rappel existe déjà dans la table rappels');
    }
  } catch (error) {
    console.error('Erreur lors de la vérification/ajout des colonnes de création des rappels:', error);
  }
};

// Appeler toutes les fonctions de vérification
checkAccompagnementsCreatedAt();
checkRappelsCreationColumns();