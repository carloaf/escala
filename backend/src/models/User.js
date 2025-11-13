const pool = require('../config/database');
const bcrypt = require('bcryptjs');

async function create(userData) {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  
  const query = `
    INSERT INTO users (
      email, password_hash, war_name, full_name, military_id, 
      rank, organization, company, phone, role
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id, email, war_name, full_name, military_id, rank, 
              organization, company, phone, role, created_at
  `;
  
  const values = [
    userData.email,
    hashedPassword,
    userData.war_name || userData.name, // compatibilidade com código antigo
    userData.full_name || userData.war_name || userData.name,
    userData.military_id || null,
    userData.rank || null,
    userData.organization || null,
    userData.company || null,
    userData.phone || null,
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
  const query = `
    SELECT id, email, war_name, full_name, military_id, rank, 
           organization, company, phone, role, created_at 
    FROM users WHERE id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
}

async function verifyPassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

async function all() {
  const query = `
    SELECT id, email, war_name, full_name, military_id, rank, 
           organization, company, phone, role, created_at 
    FROM users ORDER BY war_name ASC
  `;
  const result = await pool.query(query);
  return result.rows;
}

module.exports = { create, findByEmail, findById, verifyPassword, all };
