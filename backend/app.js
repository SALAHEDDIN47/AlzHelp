require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const aidantRoutes = require('./routes/aidantRoutes');
const patientRoutes = require('./routes/patientRoutes');
const pool = require('./config/db');
const rappelsRoutes = require('./routes/rappelsRoutes'); // Import des routes
const app = express();
const { cronJob } = require('./cronJob');  // Assurez-vous que le chemin est correct

app.use(cors());
app.use(express.json());
cronJob;
app.use('/api/rappels', rappelsRoutes);
// Test DB connection
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('Database connection error', err.stack);
  } else {
    console.log('Database connected');
  }
});

// Test DB connection immediately
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed!', err.stack);
  } else {
    console.log('✅ Database connected successfully at:', res.rows[0].now);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/aidants', aidantRoutes);
app.use('/api/patients', patientRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT},kheddam alme3alem`);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});
app.listen(3000, () => {
  console.log('Serveur démarré sur le port 3000');
});