const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeServiceName, normalizeScheduleRow } = require('../src/utils/serviceNameNormalizer');
const { normalizePersonName, normalizeSchedulePersonRow } = require('../src/utils/personNameNormalizer');
const { normalizeRank, normalizeScheduleRankRow } = require('../src/utils/rankNormalizer');

test('normaliza variacoes estaticas conhecidas de tipos de escala', () => {
  assert.equal(normalizeServiceName('Cmt da Guarda da 2ª Cia Sup'), 'Cmt da Guarda 2ª Cia Sup');
  assert.equal(normalizeServiceName('Sgt de Dia da 2º Cia Sup'), 'Sgt de Dia da 2ª Cia Sup');
  assert.equal(normalizeServiceName('Guardas ao Paióis 2ª Cia Sup'), 'Guarda aos Paióis 2ª Cia Sup');
  assert.equal(normalizeServiceName('OFICIAL DE DIA'), 'Oficial de Dia');
});

test('aplica aliases cadastrados dinamicamente sem editar codigo', () => {
  const aliases = [
    { alias_name: 'Aux Cmd Guarda 1ª cia Sup 1ª Cia Sup', canonical_name: 'Aux Cmt da Guarda 1ª Cia Sup' },
    { alias_name: 'Aux do Cassineiro de Dia 1ª Cia Sup', canonical_name: 'Aux Cassineiro de Dia 1ª Cia Sup' }
  ];

  assert.equal(
    normalizeServiceName('Aux Cmd Guarda 1ª cia Sup 1ª Cia Sup', aliases),
    'Aux Cmt da Guarda 1ª Cia Sup'
  );
  assert.equal(
    normalizeServiceName('Aux do Cassineiro de Dia 1ª Cia Sup', aliases),
    'Aux Cassineiro de Dia 1ª Cia Sup'
  );
});

test('normaliza linhas completas preservando os demais campos', () => {
  const row = {
    service: 'Cozinheiro de dia 2ª Cia Sup',
    date: '2025-11-20',
    rank: 'Sd Ev',
    name: 'ALGUEM'
  };

  assert.deepEqual(normalizeScheduleRow(row), {
    service: 'Cozinheiro de Dia 2ª Cia Sup',
    date: '2025-11-20',
    rank: 'Sd Ev',
    name: 'ALGUEM'
  });
});

test('normaliza nomes de militares removendo acentos e cedilha', () => {
  assert.equal(normalizePersonName('Álvaro'), 'ALVARO');
  assert.equal(normalizePersonName('José Gabriel'), 'JOSE GABRIEL');
  assert.equal(normalizePersonName('Françoise'), 'FRANCOISE');
});

test('normaliza nomes em linhas de escala', () => {
  assert.deepEqual(
    normalizeSchedulePersonRow({ name: 'JOSÉ GABRIEL', service: 'Oficial de Dia' }),
    { name: 'JOSE GABRIEL', service: 'Oficial de Dia' }
  );
});

test('normaliza graduações para as abreviações canônicas', () => {
  assert.equal(normalizeRank('1º TEN'), '1º Ten');
  assert.equal(normalizeRank('3º SGT'), '3º Sgt');
  assert.equal(normalizeRank('SD EV'), 'Sd Ev');
});

test('normaliza graduação em linhas de escala', () => {
  assert.deepEqual(
    normalizeScheduleRankRow({ rank: '2º SGT', name: 'ALGUEM' }),
    { rank: '2º Sgt', name: 'ALGUEM' }
  );
});