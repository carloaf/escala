const pool = require('../config/database');
const bcrypt = require('bcryptjs');

async function create(userData) {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  
  const query = `
    INSERT INTO users (email, password_hash, name, military_id, rank, role)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, email, name, military_id, rank, role, created_at
  `;
  
  const values = [
    userData.email,
    hashedPassword,
    userData.name,
    userData.military_id || null,
    userData.rank || null,
    userData.role || 'user'
  ];
  
  const result = await pool.query(query, values);
  return result.rows[0];
}

async function findByEmail(email) {
  const query = `SELECT * FROM users WHERE email = $1`;
  const result = await pool.query(query, [email]);
  return result.rows[0];
}

async function findById(id) {
  const query = `SELECT id, email, name, military_id, rank, role, created_at FROM users WHERE id = $1`;
  const result = await pool.query(query, [id]);
  return result.rows[0];
}

async function verifyPassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

async function all() {
  const query = `SELECT id, email, name, military_id, rank, role, created_at FROM users ORDER BY name ASC`;
  const result = await pool.query(query);
  return result.rows;
}

module.exports = { create, findByEmail, findById, verifyPassword, all };
