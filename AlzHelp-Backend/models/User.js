const pool = require('../config/db');

const createUser = async (userData) => {
  const { firstName, lastName, email, password, userType, birthDate } = userData;
  const query = `
    INSERT INTO users (first_name, last_name, email, password, user_type, birth_date)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const values = [firstName, lastName, email, password, userType, birthDate];
  const result = await pool.query(query, values);
  return result.rows[0];
};

module.exports = { createUser };