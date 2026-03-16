UPDATE schedules
SET name = UPPER(
    REGEXP_REPLACE(
        TRANSLATE(name,
            'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ',
            'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn'
        ),
        '\s+',
        ' ',
        'g'
    )
)
WHERE name IS NOT NULL;

UPDATE schedule_changes
SET old_name = UPPER(
    REGEXP_REPLACE(
        TRANSLATE(old_name,
            'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ',
            'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn'
        ),
        '\s+',
        ' ',
        'g'
    )
)
WHERE old_name IS NOT NULL;

UPDATE schedule_changes
SET new_name = UPPER(
    REGEXP_REPLACE(
        TRANSLATE(new_name,
            'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ',
            'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn'
        ),
        '\s+',
        ' ',
        'g'
    )
)
WHERE new_name IS NOT NULL;