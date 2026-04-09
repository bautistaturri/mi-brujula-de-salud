-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MIGRACIÓN 016: save_checkin_ics — Mental Fitness + Emoción
--
-- Extiende el RPC save_checkin_ics para aceptar los nuevos
-- campos de Mental Fitness (saboteador_score, observador_score)
-- y la emoción principal, incorporados en migración 013.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION public.save_checkin_ics(
  p_user_id             uuid,
  p_week_start          date,
  p_ica_days            integer[],
  p_ica_barriers        integer,
  p_be_energy           integer,
  p_be_regulation       integer,
  p_ini_score           integer,
  p_semaphore           text,
  p_alerts              text[],
  p_scores              jsonb,
  p_dominant            text,
  -- Nuevos campos Mental Fitness (opcionales para retrocompat)
  p_emocion_principal   text    DEFAULT NULL,
  p_saboteador_score    integer DEFAULT NULL,
  p_observador_score    integer DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_checkin_id   uuid;
  v_green_streak integer := 0;
BEGIN
  INSERT INTO checkins_semanales (
    user_id, week_start,
    ica_days, ica_barriers,
    be_energy, be_regulation,
    ini_score,
    semaphore, alerts, scores, dominant_domain,
    emocion_principal, saboteador_score, observador_score,
    submitted_at
  ) VALUES (
    p_user_id, p_week_start,
    p_ica_days, p_ica_barriers,
    p_be_energy, p_be_regulation,
    p_ini_score,
    p_semaphore, p_alerts, p_scores, p_dominant,
    p_emocion_principal, p_saboteador_score, p_observador_score,
    now()
  )
  ON CONFLICT (user_id, week_start) DO UPDATE SET
    ica_days           = EXCLUDED.ica_days,
    ica_barriers       = EXCLUDED.ica_barriers,
    be_energy          = EXCLUDED.be_energy,
    be_regulation      = EXCLUDED.be_regulation,
    ini_score          = EXCLUDED.ini_score,
    semaphore          = EXCLUDED.semaphore,
    alerts             = EXCLUDED.alerts,
    scores             = EXCLUDED.scores,
    dominant_domain    = EXCLUDED.dominant_domain,
    emocion_principal  = EXCLUDED.emocion_principal,
    saboteador_score   = EXCLUDED.saboteador_score,
    observador_score   = EXCLUDED.observador_score,
    submitted_at       = EXCLUDED.submitted_at
  RETURNING id INTO v_checkin_id;

  -- Actualizar racha verde
  IF p_semaphore = 'green' THEN
    SELECT COUNT(*) INTO v_green_streak
    FROM (
      SELECT week_start, semaphore,
             ROW_NUMBER() OVER (ORDER BY week_start DESC) -
             ROW_NUMBER() OVER (PARTITION BY semaphore ORDER BY week_start DESC) AS grp
      FROM checkins_semanales
      WHERE user_id = p_user_id
        AND week_start <= p_week_start
    ) sub
    WHERE semaphore = 'green' AND grp = 0;

    INSERT INTO rachas (paciente_id, tipo, semanas_consecutivas, updated_at)
    VALUES (p_user_id, 'green_streak', v_green_streak, now())
    ON CONFLICT (paciente_id, tipo) DO UPDATE SET
      semanas_consecutivas = EXCLUDED.semanas_consecutivas,
      updated_at           = now();
  ELSE
    INSERT INTO rachas (paciente_id, tipo, semanas_consecutivas, updated_at)
    VALUES (p_user_id, 'green_streak', 0, now())
    ON CONFLICT (paciente_id, tipo) DO UPDATE SET
      semanas_consecutivas = 0,
      updated_at           = now();
  END IF;

  RETURN v_checkin_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_checkin_ics(
  uuid, date, integer[], integer, integer, integer, integer,
  text, text[], jsonb, text, text, integer, integer
) TO authenticated;
