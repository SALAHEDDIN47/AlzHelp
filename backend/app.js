require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const aidantRoutes = require('./routes/aidantRoutes');
const patientRoutes = require('./routes/patientRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/aidants', aidantRoutes);
app.use('/api/patients', patientRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});