const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Patient = require('../models/Patient');
const Aidant = require('../models/Aidant');
const pool = require('../config/db');

const register = async (req, res) => {
  try {
    const { userType, ...userData } = req.body;
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    let user;
    if (userType === 'patient') {
      user = await Patient.create(
        userData.nom,
        userData.prenom,
        userData.email,
        hashedPassword,
        userData.telephone,
        userData.dateNaissance,
        userData.id_lien
      );
    } else {
      user = await Aidant.create(
        userData.nom,
        userData.prenom,
        userData.email,
        hashedPassword,
        userData.telephone,
        userData.dateNaissance,
        userData.id_lien
      );
    }

    const token = jwt.sign(
      { id: user.id, type: userType },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ token, userType });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


const login = async (req, res) => {
  try {
    const { email, password, userType } = req.body;
    
    let user;
    if (userType === 'patient') {
      user = await Patient.findByEmail(email);
    } else {
      user = await Aidant.findByEmail(email);
    }

    const hashedPassword = userType === 'patient' ? user.mdppatient : user.mdpaidant;

if (!user || !(await bcrypt.compare(password, hashedPassword))) {
  return res.status(401).json({ error: 'Identifiants incorrects' });
}


    const token = jwt.sign(
      { id: user.id, type: userType },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      token, 
      userType,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ error: error.message });
  }
};

// [Keep register method but ensure field names match]

module.exports = { register, login };

