const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Patient = require('../models/Patient');
const Aidant = require('../models/Aidant');

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

    if (!user || !(await bcrypt.compare(password, user.mdpPatient || user.mdpAidant))) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const token = jwt.sign(
      { id: user.id, type: userType },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, userType });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = { register, login };