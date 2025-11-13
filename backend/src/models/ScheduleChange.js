const pool = require('../config/database');

async function create(changeData) {
  const query = `
    INSERT INTO schedule_changes 
    (schedule_id, old_service, new_service, old_date, new_date, old_time, new_time, old_name, new_name)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;
  
  const values = [
    changeData.schedule_id,
    changeData.old_service || null,
    changeData.new_service || null,
    changeData.old_date || null,
    changeData.new_date || null,
    changeData.old_time || null,
    changeData.new_time || null,
    changeData.old_name || null,
    changeData.new_name || null
  ];
  
  const result = await pool.query(query, values);
  return result.rows[0];
}

async function findUnnotified() {
  const query = `
    SELECT sc.*, s.name, s.military_id 
    FROM schedule_changes sc
    JOIN schedules s ON sc.schedule_id = s.id
    WHERE sc.notified = false
    ORDER BY sc.detected_at DESC
  `;
  const result = await pool.query(query);
  return result.rows;
}

async function markAsNotified(id) {
  const query = `UPDATE schedule_changes SET notified = true WHERE id = $1 RETURNING *`;
  const result = await pool.query(query, [id]);
  return result.rows[0];
}

module.exports = { create, findUnnotified, markAsNotified };
