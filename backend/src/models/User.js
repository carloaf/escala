const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const { normalizePersonName } = require('../utils/personNameNormalizer');
const { normalizeRank } = require('../utils/rankNormalizer');

async function create(userData) {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const normalizedWarName = normalizePersonName(userData.war_name || userData.name);
  const normalizedFullName = normalizePersonName(userData.full_name || userData.war_name || userData.name);
  const normalizedRank = normalizeRank(userData.rank);
  
  const query = `
    INSERT INTO users (
      email, password_hash, war_name, full_name, military_id, 
      rank, organization, company, phone, role, is_active
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING id, email, war_name, full_name, military_id, rank, 
              organization, company, phone, role, is_active, created_at, updated_at
  `;
  
  const values = [
    userData.email,
    hashedPassword,
    normalizedWarName,
    normalizedFullName,
    userData.military_id || null,
    normalizedRank || null,
    userData.organization || null,
    userData.company || null,
    userData.phone || null,
    userData.role || 'user',
    userData.is_active !== false
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
           organization, company, phone, role, is_active, created_at, updated_at 
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
           organization, company, phone, role, is_active, created_at, updated_at 
    FROM users ORDER BY war_name ASC
  `;
  const result = await pool.query(query);
  return result.rows;
}

async function update(id, userData) {
  const normalizedWarName = normalizePersonName(userData.war_name || userData.name);
  const normalizedFullName = normalizePersonName(userData.full_name || userData.war_name || userData.name);
  const normalizedRank = normalizeRank(userData.rank);
  const hashedPassword = userData.password ? await bcrypt.hash(userData.password, 10) : null;

  const query = `
    UPDATE users
    SET email = $2,
        war_name = $3,
        full_name = $4,
        military_id = $5,
        rank = $6,
        organization = $7,
        company = $8,
        phone = $9,
        role = $10,
        is_active = $11,
        password_hash = COALESCE($12, password_hash),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id, email, war_name, full_name, military_id, rank,
              organization, company, phone, role, is_active, created_at, updated_at
  `;

  const values = [
    id,
    userData.email,
    normalizedWarName,
    normalizedFullName,
    userData.military_id || null,
    normalizedRank || null,
    userData.organization || null,
    userData.company || null,
    userData.phone || null,
    userData.role || 'user',
    userData.is_active !== false,
    hashedPassword
  ];

  const result = await pool.query(query, values);
  return result.rows[0] || null;
}

async function updateActiveStatus(id, isActive) {
  const query = `
    UPDATE users
    SET is_active = $2,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id, email, war_name, full_name, military_id, rank,
              organization, company, phone, role, is_active, created_at, updated_at
  `;
  const result = await pool.query(query, [id, isActive]);
  return result.rows[0] || null;
}

module.exports = { create, findByEmail, findById, verifyPassword, all, update, updateActiveStatus };
