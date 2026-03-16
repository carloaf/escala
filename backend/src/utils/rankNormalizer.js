const RANK_ALIASES = new Map([
  ['1º TEN', '1º Ten'],
  ['2º TEN', '2º Ten'],
  ['1º SGT', '1º Sgt'],
  ['2º SGT', '2º Sgt'],
  ['3º SGT', '3º Sgt'],
  ['ASP', 'ASP'],
  ['CB', 'CB'],
  ['SD EP', 'Sd Ep'],
  ['SD EV', 'Sd Ev'],
  ['SD', 'Sd']
]);

function normalizeRank(rank) {
  if (!rank || typeof rank !== 'string') {
    return rank;
  }

  const compact = rank.replace(/\s+/g, ' ').trim();
  return RANK_ALIASES.get(compact.toUpperCase()) || compact;
}

function normalizeScheduleRankRow(row) {
  if (!row) {
    return row;
  }

  return {
    ...row,
    rank: normalizeRank(row.rank)
  };
}

module.exports = { normalizeRank, normalizeScheduleRankRow };