const pool = require('../config/database');

async function insert(row) {
  const query = `
    INSERT INTO schedules (service, date, time, name, military_id, rank)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (COALESCE(date::text,''), COALESCE(service,''), COALESCE(rank,''), COALESCE(name,'')) DO NOTHING
    RETURNING *
  `;
  const values = [
    row.service || null,
    row.date || null,
    row.time || null,
    row.name || null,
    row.military_id || null,
    row.rank || null
  ];
  
  const result = await pool.query(query, values);
  return result.rows[0] || null; // null if duplicate was skipped
}

async function all() {
  const query = `SELECT * FROM schedules ORDER BY date ASC, id ASC`;
  const result = await pool.query(query);
  return result.rows;
}

async function findByName(name) {
  const query = `SELECT * FROM schedules WHERE name ILIKE $1 ORDER BY date ASC`;
  const result = await pool.query(query, [`%${name}%`]);
  return result.rows;
}

async function findByRankAndName(rank, name) {
  const query = `
    SELECT * FROM schedules 
    WHERE LOWER(rank) = LOWER($1) AND name ILIKE $2 
    ORDER BY date ASC
  `;
  // Use LOWER() for exact rank match (case-insensitive) and ILIKE for name (partial match)
  const result = await pool.query(query, [rank, `%${name}%`]);
  return result.rows;
}

async function findByMilitaryId(militaryId) {
  const query = `SELECT * FROM schedules WHERE military_id = $1 ORDER BY date ASC`;
  const result = await pool.query(query, [militaryId]);
  return result.rows;
}

async function deleteAll() {
  const query = `DELETE FROM schedules`;
  await pool.query(query);
}

async function exists({ service, date, rank, name }) {
  const query = `
    SELECT 1 FROM schedules
    WHERE service = $1 AND date = $2 AND rank = $3 AND name = $4
    LIMIT 1
  `;
  const values = [service || null, date || null, rank || null, name || null];
  const result = await pool.query(query, values);
  return result.rowCount > 0;
}

module.exports = { insert, all, findByName, findByRankAndName, findByMilitaryId, deleteAll, exists };