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

async function deleteByDate(date) {
  // First delete related schedule_changes
  const deleteChangesQuery = `
    DELETE FROM schedule_changes 
    WHERE schedule_id IN (SELECT id FROM schedules WHERE date = $1)
  `;
  await pool.query(deleteChangesQuery, [date]);
  
  // Then delete schedules
  const deleteSchedulesQuery = `DELETE FROM schedules WHERE date = $1`;
  const result = await pool.query(deleteSchedulesQuery, [date]);
  return result.rowCount;
}

async function reportByPerson({ dateFrom, dateTo }) {
  const query = `
    SELECT
      rank,
      name,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE EXTRACT(DOW FROM date::date) BETWEEN 1 AND 5) AS weekday_total,
      COUNT(*) FILTER (WHERE EXTRACT(DOW FROM date::date) IN (0, 6))       AS weekend_total
    FROM schedules
    WHERE date BETWEEN $1 AND $2
    GROUP BY rank, name
    ORDER BY rank ASC, name ASC
  `;
  const result = await pool.query(query, [dateFrom, dateTo]);
  return result.rows;
}

async function reportByRank({ dateFrom, dateTo }) {
  const query = `
    SELECT
      rank,
      COUNT(*) AS total,
      COUNT(DISTINCT name) AS militares,
      COUNT(*) FILTER (WHERE EXTRACT(DOW FROM date::date) BETWEEN 1 AND 5)                                     AS weekday_total,
      COUNT(DISTINCT CASE WHEN EXTRACT(DOW FROM date::date) BETWEEN 1 AND 5 THEN name END) AS weekday_militares,
      COUNT(*) FILTER (WHERE EXTRACT(DOW FROM date::date) IN (0, 6))                                          AS weekend_total,
      COUNT(DISTINCT CASE WHEN EXTRACT(DOW FROM date::date) IN (0, 6) THEN name END)       AS weekend_militares
    FROM schedules
    WHERE date BETWEEN $1 AND $2
    GROUP BY rank
    ORDER BY rank ASC
  `;
  const result = await pool.query(query, [dateFrom, dateTo]);
  return result.rows;
}

async function reportDateRange() {
  const query = `SELECT MIN(date) AS date_from, MAX(date) AS date_to FROM schedules`;
  const result = await pool.query(query);
  return result.rows[0];
}

module.exports = { insert, all, findByName, findByRankAndName, findByMilitaryId, deleteAll, exists, deleteByDate, reportByPerson, reportByRank, reportDateRange };