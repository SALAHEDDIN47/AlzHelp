const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'alzhelp',
  password: 'salaheddine',
  port: 5432,
});

module.exports = pool;