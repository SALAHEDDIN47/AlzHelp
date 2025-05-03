const jwt = require('jsonwebtoken');
const { createUser } = require('../models/User');
const pool = require('../config/db');

exports.signup = async (req, res) => {
  try {
    const newUser = await createUser(req.body);
    const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ user: newUser, token });
    
  } catch (error) {
    if (error.code === '23505') {
      res.status(400).json({ error: "Email déjà utilisé" });
    } else {
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
};

exports.login = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [req.body.email]);
    
    if (!rows.length) return res.status(401).json({ error: "Identifiants invalides" });

    const validPassword = await bcrypt.compare(req.body.password, rows[0].password);
    if (!validPassword) return res.status(401).json({ error: "Identifiants invalides" });

    const token = jwt.sign({ id: rows[0].id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ user: { id: rows[0].id, email: rows[0].email }, token });

  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};