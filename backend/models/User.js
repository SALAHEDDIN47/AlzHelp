const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const createUser = async (userData) => {
  try {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const query = `
      INSERT INTO users (first_name, last_name, email, password, user_type, birth_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, first_name, email
    `;
    
    const values = [
      userData.firstName,
      userData.lastName,
      userData.email,
      hashedPassword,
      userData.userType,
      new Date(userData.birthDate) // Conversion de la date
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
    
  } catch (error) {
    throw error;
  }
};

module.exports = { createUser };