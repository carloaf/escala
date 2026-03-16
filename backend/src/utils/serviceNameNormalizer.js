const STATIC_SERVICE_ALIASES = [
  ['Cmt da Guarda da 2ª Cia Sup', 'Cmt da Guarda 2ª Cia Sup'],
  ['Sgt de Dia 1ª Cia Sup', 'Sgt de Dia da 1ª Cia Sup'],
  ['Sgt de Dia 2ª Cia Sup', 'Sgt de Dia da 2ª Cia Sup'],
  ['Sgt de Dia da 1º Cia Sup', 'Sgt de Dia da 1ª Cia Sup'],
  ['Sgt de Dia da 2º Cia Sup', 'Sgt de Dia da 2ª Cia Sup'],
  ['Sgt de Dia da 2ª cia Sup 2ª Cia Sup', 'Sgt de Dia da 2ª Cia Sup'],
  ['Aux Sgt de Dia da 2ª cia Sup 2ª Cia Sup', 'Aux Sgt de Dia 2ª Cia Sup'],
  ['Guardas ao Paióis 2ª Cia Sup', 'Guarda aos Paióis 2ª Cia Sup'],
  ['Aux do Oficial de Dia 1ª Cia Sup', 'Aux Oficial de Dia 1ª Cia Sup'],
  ['Cassineiro de dia 2ª Cia Sup', 'Cassineiro de Dia 2ª Cia Sup'],
  ['Cozinheiro de dia 2ª Cia Sup', 'Cozinheiro de Dia 2ª Cia Sup'],
  ['OFICIAL DE DIA', 'Oficial de Dia']
];

function normalizeBaseServiceName(serviceName) {
  if (!serviceName || typeof serviceName !== 'string') {
    return serviceName;
  }

  let normalized = serviceName.trim().replace(/\s+/g, ' ');

  normalized = normalized
    .replace(/\b1º\s+Cia\s+Sup\b/gi, '1ª Cia Sup')
    .replace(/\b2º\s+Cia\s+Sup\b/gi, '2ª Cia Sup')
    .replace(/\b([12]ª)\s+cia\s+Sup\b/gi, '$1 Cia Sup')
    .replace(/\b([12]ª\s+Cia\s+Sup)\s+\1\b/gi, '$1')
    .replace(/^Cmt da Guarda da\s+([12]ª\s+Cia\s+Sup)$/i, 'Cmt da Guarda $1')
    .replace(/^Sgt de Dia\s+([12]ª\s+Cia\s+Sup)$/i, 'Sgt de Dia da $1')
    .replace(/^Sgt de Dia da\s+([12]ª\s+Cia\s+Sup)\s+\1$/i, 'Sgt de Dia da $1')
    .replace(/^Aux Sgt de Dia da\s+([12]ª\s+Cia\s+Sup)\s+\1$/i, 'Aux Sgt de Dia $1')
    .replace(/^Aux Sgt de Dia da\s+([12]ª\s+Cia\s+Sup)$/i, 'Aux Sgt de Dia $1')
    .replace(/^Guardas ao Paióis\s+/i, 'Guarda aos Paióis ');

  return normalized;
}

function toAliasKey(serviceName) {
  return normalizeBaseServiceName(serviceName)
    ?.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildAliasLookup(extraAliases = []) {
  const entries = [];

  STATIC_SERVICE_ALIASES.forEach(([aliasName, canonicalName]) => {
    entries.push([aliasName, canonicalName]);
  });

  if (extraAliases instanceof Map) {
    extraAliases.forEach((canonicalName, aliasName) => {
      entries.push([aliasName, canonicalName]);
    });
  } else if (Array.isArray(extraAliases)) {
    extraAliases.forEach((entry) => {
      if (Array.isArray(entry) && entry.length >= 2) {
        entries.push([entry[0], entry[1]]);
      } else if (entry && entry.alias_name && entry.canonical_name) {
        entries.push([entry.alias_name, entry.canonical_name]);
      }
    });
  }

  const lookup = new Map();
  entries.forEach(([aliasName, canonicalName]) => {
    const aliasKey = toAliasKey(aliasName);
    if (aliasKey) {
      lookup.set(aliasKey, normalizeBaseServiceName(canonicalName));
    }
  });

  return lookup;
}

function normalizeServiceName(serviceName, extraAliases = []) {
  const normalized = normalizeBaseServiceName(serviceName);
  const lookup = buildAliasLookup(extraAliases);

  let current = normalized;
  const visited = new Set();

  while (current) {
    const key = toAliasKey(current);
    if (!key || visited.has(key) || !lookup.has(key)) {
      break;
    }

    visited.add(key);
    current = lookup.get(key);
  }

  return current;
}

function normalizeScheduleRow(row, extraAliases = []) {
  if (!row) {
    return row;
  }

  return {
    ...row,
    service: normalizeServiceName(row.service, extraAliases)
  };
}

module.exports = { STATIC_SERVICE_ALIASES, normalizeBaseServiceName, normalizeServiceName, normalizeScheduleRow, toAliasKey, buildAliasLookup };