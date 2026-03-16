const pool = require('../config/database');
const { normalizeBaseServiceName } = require('../utils/serviceNameNormalizer');

async function all() {
  const query = `
    SELECT id, alias_name, canonical_name, created_at, updated_at
    FROM service_aliases
    ORDER BY canonical_name ASC, alias_name ASC
  `;
  const result = await pool.query(query);
  return result.rows;
}

async function aliasEntries() {
  const query = `SELECT alias_name, canonical_name FROM service_aliases ORDER BY alias_name ASC`;
  const result = await pool.query(query);
  return result.rows;
}

async function upsert({ aliasName, canonicalName }) {
  const normalizedAliasName = normalizeBaseServiceName(aliasName);
  const normalizedCanonicalName = normalizeBaseServiceName(canonicalName);

  const query = `
    INSERT INTO service_aliases (alias_name, canonical_name)
    VALUES ($1, $2)
    ON CONFLICT (alias_name)
    DO UPDATE SET canonical_name = EXCLUDED.canonical_name, updated_at = CURRENT_TIMESTAMP
    RETURNING id, alias_name, canonical_name, created_at, updated_at
  `;
  const result = await pool.query(query, [normalizedAliasName, normalizedCanonicalName]);
  return result.rows[0];
}

async function remove(id) {
  const query = `DELETE FROM service_aliases WHERE id = $1 RETURNING id, alias_name, canonical_name`;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

async function applyAliasToExistingData({ aliasName, canonicalName }) {
  const normalizedAliasName = normalizeBaseServiceName(aliasName);
  const normalizedCanonicalName = normalizeBaseServiceName(canonicalName);

  const schedulesResult = await pool.query(
    `UPDATE schedules SET service = $2 WHERE service = $1`,
    [normalizedAliasName, normalizedCanonicalName]
  );

  const oldChangesResult = await pool.query(
    `UPDATE schedule_changes SET old_service = $2 WHERE old_service = $1`,
    [normalizedAliasName, normalizedCanonicalName]
  );

  const newChangesResult = await pool.query(
    `UPDATE schedule_changes SET new_service = $2 WHERE new_service = $1`,
    [normalizedAliasName, normalizedCanonicalName]
  );

  return {
    schedulesUpdated: schedulesResult.rowCount,
    oldChangesUpdated: oldChangesResult.rowCount,
    newChangesUpdated: newChangesResult.rowCount
  };
}

module.exports = { all, aliasEntries, upsert, remove, applyAliasToExistingData };