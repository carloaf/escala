UPDATE schedules
SET service = CASE
    WHEN service = 'Aux do Oficial de Dia 1ª Cia Sup' THEN 'Aux Oficial de Dia 1ª Cia Sup'
    WHEN service = 'Cassineiro de dia 2ª Cia Sup' THEN 'Cassineiro de Dia 2ª Cia Sup'
    WHEN service = 'Cozinheiro de dia 2ª Cia Sup' THEN 'Cozinheiro de Dia 2ª Cia Sup'
    WHEN service = 'OFICIAL DE DIA' THEN 'Oficial de Dia'
    ELSE service
END
WHERE service IN (
    'Aux do Oficial de Dia 1ª Cia Sup',
    'Cassineiro de dia 2ª Cia Sup',
    'Cozinheiro de dia 2ª Cia Sup',
    'OFICIAL DE DIA'
);

UPDATE schedule_changes
SET old_service = CASE
    WHEN old_service = 'Aux do Oficial de Dia 1ª Cia Sup' THEN 'Aux Oficial de Dia 1ª Cia Sup'
    WHEN old_service = 'Cassineiro de dia 2ª Cia Sup' THEN 'Cassineiro de Dia 2ª Cia Sup'
    WHEN old_service = 'Cozinheiro de dia 2ª Cia Sup' THEN 'Cozinheiro de Dia 2ª Cia Sup'
    WHEN old_service = 'OFICIAL DE DIA' THEN 'Oficial de Dia'
    ELSE old_service
END
WHERE old_service IN (
    'Aux do Oficial de Dia 1ª Cia Sup',
    'Cassineiro de dia 2ª Cia Sup',
    'Cozinheiro de dia 2ª Cia Sup',
    'OFICIAL DE DIA'
);

UPDATE schedule_changes
SET new_service = CASE
    WHEN new_service = 'Aux do Oficial de Dia 1ª Cia Sup' THEN 'Aux Oficial de Dia 1ª Cia Sup'
    WHEN new_service = 'Cassineiro de dia 2ª Cia Sup' THEN 'Cassineiro de Dia 2ª Cia Sup'
    WHEN new_service = 'Cozinheiro de dia 2ª Cia Sup' THEN 'Cozinheiro de Dia 2ª Cia Sup'
    WHEN new_service = 'OFICIAL DE DIA' THEN 'Oficial de Dia'
    ELSE new_service
END
WHERE new_service IN (
    'Aux do Oficial de Dia 1ª Cia Sup',
    'Cassineiro de dia 2ª Cia Sup',
    'Cozinheiro de dia 2ª Cia Sup',
    'OFICIAL DE DIA'
);