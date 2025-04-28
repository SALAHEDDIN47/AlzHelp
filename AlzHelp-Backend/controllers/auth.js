const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, userType, birthDate } = req.body;
    
    // Validation des données
    if (!email.includes('@')) {
      return res.status(400).json({ error: "Email invalide" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await db.query(
      `INSERT INTO users (first_name, last_name, email, password, user_type, birth_date) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, first_name, last_name, email, user_type`,
      [firstName, lastName, email, hashedPassword, userType, birthDate]
    );

    const token = jwt.sign({ userId: result.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    
    res.status(201).json({ user: result.rows[0], token });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: "Email déjà utilisé" });
    }
    res.status(500).json({ error: "Erreur serveur" });
  }
};