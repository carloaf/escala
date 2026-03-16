function normalizePersonName(name) {
  if (!name || typeof name !== 'string') {
    return name;
  }

  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ç/gi, 'c')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function normalizeSchedulePersonRow(row) {
  if (!row) {
    return row;
  }

  return {
    ...row,
    name: normalizePersonName(row.name)
  };
}

module.exports = { normalizePersonName, normalizeSchedulePersonRow };