// server.js
const express = require('express');
const cors = require('cors');
const rappelsRoutes = require('./routes/rappels');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const authRoutes = require('./routes/authRoutes');

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);  // <--- Route correcte
app.use('/api/rappels', rappelsRoutes);

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
