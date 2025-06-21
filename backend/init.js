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

// Appeler toutes les fonctions de vérification
checkAccompagnementsCreatedAt();