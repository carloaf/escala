UPDATE users
SET rank = CASE UPPER(TRIM(rank))
    WHEN '1º TEN' THEN '1º Ten'
    WHEN '2º TEN' THEN '2º Ten'
    WHEN '1º SGT' THEN '1º Sgt'
    WHEN '2º SGT' THEN '2º Sgt'
    WHEN '3º SGT' THEN '3º Sgt'
    WHEN 'SD EP' THEN 'Sd Ep'
    WHEN 'SD EV' THEN 'Sd Ev'
    WHEN 'SD' THEN 'Sd'
    ELSE rank
END
WHERE rank IS NOT NULL;