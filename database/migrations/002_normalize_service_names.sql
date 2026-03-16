UPDATE schedules
SET service = CASE
    WHEN service = 'Cmt da Guarda da 2ª Cia Sup' THEN 'Cmt da Guarda 2ª Cia Sup'
    WHEN service = 'Sgt de Dia 1ª Cia Sup' THEN 'Sgt de Dia da 1ª Cia Sup'
    WHEN service = 'Sgt de Dia 2ª Cia Sup' THEN 'Sgt de Dia da 2ª Cia Sup'
    WHEN service = 'Sgt de Dia da 1º Cia Sup' THEN 'Sgt de Dia da 1ª Cia Sup'
    WHEN service = 'Sgt de Dia da 2º Cia Sup' THEN 'Sgt de Dia da 2ª Cia Sup'
    WHEN service = 'Sgt de Dia da 2ª cia Sup 2ª Cia Sup' THEN 'Sgt de Dia da 2ª Cia Sup'
    WHEN service = 'Aux Sgt de Dia da 2ª cia Sup 2ª Cia Sup' THEN 'Aux Sgt de Dia 2ª Cia Sup'
    WHEN service = 'Guardas ao Paióis 2ª Cia Sup' THEN 'Guarda aos Paióis 2ª Cia Sup'
    ELSE service
END
WHERE service IN (
    'Cmt da Guarda da 2ª Cia Sup',
    'Sgt de Dia 1ª Cia Sup',
    'Sgt de Dia 2ª Cia Sup',
    'Sgt de Dia da 1º Cia Sup',
    'Sgt de Dia da 2º Cia Sup',
    'Sgt de Dia da 2ª cia Sup 2ª Cia Sup',
    'Aux Sgt de Dia da 2ª cia Sup 2ª Cia Sup',
    'Guardas ao Paióis 2ª Cia Sup'
);

UPDATE schedule_changes
SET old_service = CASE
    WHEN old_service = 'Cmt da Guarda da 2ª Cia Sup' THEN 'Cmt da Guarda 2ª Cia Sup'
    WHEN old_service = 'Sgt de Dia 1ª Cia Sup' THEN 'Sgt de Dia da 1ª Cia Sup'
    WHEN old_service = 'Sgt de Dia 2ª Cia Sup' THEN 'Sgt de Dia da 2ª Cia Sup'
    WHEN old_service = 'Sgt de Dia da 1º Cia Sup' THEN 'Sgt de Dia da 1ª Cia Sup'
    WHEN old_service = 'Sgt de Dia da 2º Cia Sup' THEN 'Sgt de Dia da 2ª Cia Sup'
    WHEN old_service = 'Sgt de Dia da 2ª cia Sup 2ª Cia Sup' THEN 'Sgt de Dia da 2ª Cia Sup'
    WHEN old_service = 'Aux Sgt de Dia da 2ª cia Sup 2ª Cia Sup' THEN 'Aux Sgt de Dia 2ª Cia Sup'
    WHEN old_service = 'Guardas ao Paióis 2ª Cia Sup' THEN 'Guarda aos Paióis 2ª Cia Sup'
    ELSE old_service
END
WHERE old_service IN (
    'Cmt da Guarda da 2ª Cia Sup',
    'Sgt de Dia 1ª Cia Sup',
    'Sgt de Dia 2ª Cia Sup',
    'Sgt de Dia da 1º Cia Sup',
    'Sgt de Dia da 2º Cia Sup',
    'Sgt de Dia da 2ª cia Sup 2ª Cia Sup',
    'Aux Sgt de Dia da 2ª cia Sup 2ª Cia Sup',
    'Guardas ao Paióis 2ª Cia Sup'
);

UPDATE schedule_changes
SET new_service = CASE
    WHEN new_service = 'Cmt da Guarda da 2ª Cia Sup' THEN 'Cmt da Guarda 2ª Cia Sup'
    WHEN new_service = 'Sgt de Dia 1ª Cia Sup' THEN 'Sgt de Dia da 1ª Cia Sup'
    WHEN new_service = 'Sgt de Dia 2ª Cia Sup' THEN 'Sgt de Dia da 2ª Cia Sup'
    WHEN new_service = 'Sgt de Dia da 1º Cia Sup' THEN 'Sgt de Dia da 1ª Cia Sup'
    WHEN new_service = 'Sgt de Dia da 2º Cia Sup' THEN 'Sgt de Dia da 2ª Cia Sup'
    WHEN new_service = 'Sgt de Dia da 2ª cia Sup 2ª Cia Sup' THEN 'Sgt de Dia da 2ª Cia Sup'
    WHEN new_service = 'Aux Sgt de Dia da 2ª cia Sup 2ª Cia Sup' THEN 'Aux Sgt de Dia 2ª Cia Sup'
    WHEN new_service = 'Guardas ao Paióis 2ª Cia Sup' THEN 'Guarda aos Paióis 2ª Cia Sup'
    ELSE new_service
END
WHERE new_service IN (
    'Cmt da Guarda da 2ª Cia Sup',
    'Sgt de Dia 1ª Cia Sup',
    'Sgt de Dia 2ª Cia Sup',
    'Sgt de Dia da 1º Cia Sup',
    'Sgt de Dia da 2º Cia Sup',
    'Sgt de Dia da 2ª cia Sup 2ª Cia Sup',
    'Aux Sgt de Dia da 2ª cia Sup 2ª Cia Sup',
    'Guardas ao Paióis 2ª Cia Sup'
);