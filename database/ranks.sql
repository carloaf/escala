CREATE TABLE IF NOT EXISTS ranks (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(60)  NOT NULL,
  abbreviation VARCHAR(20)  NOT NULL UNIQUE,
  order_num    INT          NOT NULL
);

INSERT INTO ranks (id, name, abbreviation, order_num) VALUES
  (1,  'Coronel',             'Cel',    1),
  (2,  'Tenente-Coronel',     'TC',     2),
  (3,  'Major',               'Maj',    3),
  (4,  'Capitão',             'Cap',    4),
  (5,  '1º Tenente',          '1º Ten', 5),
  (6,  '2º Tenente',          '2º Ten', 6),
  (7,  'Aspirante a Oficial', 'ASP',    7),
  (8,  'Subtenente',          'ST',     8),
  (9,  '1º Sargento',         '1º Sgt', 9),
  (10, '2º Sargento',         '2º Sgt', 10),
  (11, '3º Sargento',         '3º Sgt', 11),
  (12, 'Cabo',                'CB',     12),
  (13, 'Soldado EP',          'Sd Ep',  13),
  (14, 'Soldado EV',          'Sd Ev',  14)
ON CONFLICT (id) DO NOTHING;
