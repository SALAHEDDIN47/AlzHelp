const jwt = require('jsonwebtoken');
require('dotenv').config();

function authenticate(req, res, next) {
  console.log("Middleware exécuté");

const authHeader = req.header('Authorization');
console.log("Authorization header reçu :", authHeader);

   // Vérifie que le header existe et est bien formaté
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Accès refusé. Token manquant ou mal formaté.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Accès refusé. Token manquant.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token décodé :", decoded);
    req.userId = decoded.id;      // important pour que `req.userId` fonctionne ailleurs
    console.log("userId décodé :", req.userId);
    req.userType = decoded.type; 
    console.log("Type décodé :", req.userType);
    req.user = decoded;
    console.log("user décodé :", req.user);
    next();
  } catch (err) {
    res.status(400).json({ message: 'Token invalide.' });
  }
}


// Middleware pour vérifier le token JWT
const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  // Retirer le "Bearer" du token
  const tokenWithoutBearer = token.split(' ')[1];

  try {
    // Vérifier et décoder le token
    const decoded = jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET);
    req.userId = decoded.id; // Ajouter l'ID de l'utilisateur décodé à la requête
    next(); // Passer au prochain middleware
  } catch (error) {
    return res.status(401).json({ error: 'Token invalide' });
  }
};

module.exports = authMiddleware;
module.exports = authenticate;
