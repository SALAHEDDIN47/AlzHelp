const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'alzhelp',
  password: 'salaheddine',
  port: 5432,
  ssl:false
});

module.exports = pool;

// Testez la connexion
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error("Erreur de connexion à PostgreSQL :", err);
  else console.log("Connexion à PostgreSQL réussie :", res.rows[0]);
});