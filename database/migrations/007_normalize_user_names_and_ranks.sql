UPDATE users
SET war_name = UPPER(
    REGEXP_REPLACE(
        TRANSLATE(war_name,
            'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ',
            'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn'
        ),
        '\s+',
        ' ',
        'g'
    )
)
WHERE war_name IS NOT NULL;

UPDATE users
SET full_name = UPPER(
    REGEXP_REPLACE(
        TRANSLATE(full_name,
            'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ',
            'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn'
        ),
        '\s+',
        ' ',
        'g'
    )
)
WHERE full_name IS NOT NULL;

UPDATE users
SET rank = CASE
    WHEN rank = '1º TEN' THEN '1º Ten'
    WHEN rank = '2º TEN' THEN '2º Ten'
    WHEN rank = '1º SGT' THEN '1º Sgt'
    WHEN rank = '2º SGT' THEN '2º Sgt'
    WHEN rank = '3º SGT' THEN '3º Sgt'
    WHEN rank = 'SD EP' THEN 'Sd Ep'
    WHEN rank = 'SD EV' THEN 'Sd Ev'
    ELSE rank
END
WHERE rank IN ('1º TEN', '2º TEN', '1º SGT', '2º SGT', '3º SGT', 'SD EP', 'SD EV');