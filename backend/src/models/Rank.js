const pool = require('../config/database');

async function all() {
  const result = await pool.query('SELECT id, name, abbreviation FROM ranks ORDER BY order_num ASC');
  return result.rows;
}

module.exports = { all };
