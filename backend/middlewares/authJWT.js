const jwt = require('jsonwebtoken');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header manquant' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.userId = decoded.id;
    console.log("decoded id:",req.userId);
    req.userType = decoded.type;
    console.log("decoded id:",req.userType);
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentification invalide' });
  }
};

module.exports = { verifyToken };