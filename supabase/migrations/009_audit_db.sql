-- ============================================================
-- MIGRACIÓN 009: Auditoría de Base de Datos
-- Fecha: 2026-04-02
--
-- Problemas corregidos:
--   1. Columnas updated_at faltantes en 5 tablas
--   2. Triggers updated_at faltantes (incluye rachas que tenía
--      updated_at manual pero sin trigger)
--   3. Índices en FK sin índice: conductas_ancla, grupos,
--      grupo_miembros
--   4. SET search_path = public faltante en 10 funciones
--      SECURITY DEFINER (previene search_path injection)
--   5. Grants faltantes en tablas nuevas del motor ICS
--   6. SECURITY INVOKER en vista_estado_pacientes_ics
--
-- Inconsistencias de naming documentadas (no se renombra
-- para no romper código existente):
--   - alertas (es) vs alerts (en) — doble sistema legacy+nuevo
--   - user_id vs patient_id vs paciente_id en FK
-- ============================================================

-- ============================================================
-- 1. COLUMNAS updated_at FALTANTES
-- ============================================================

ALTER TABLE public.conductas_ancla
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.grupos
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.grupo_miembros
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.alertas
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.alerts
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- ============================================================
-- 2. TRIGGERS updated_at FALTANTES
-- ============================================================

-- conductas_ancla
DROP TRIGGER IF EXISTS conductas_ancla_updated_at ON public.conductas_ancla;
CREATE TRIGGER conductas_ancla_updated_at
  BEFORE UPDATE ON public.conductas_ancla
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- grupos
DROP TRIGGER IF EXISTS grupos_updated_at ON public.grupos;
CREATE TRIGGER grupos_updated_at
  BEFORE UPDATE ON public.grupos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- grupo_miembros
DROP TRIGGER IF EXISTS grupo_miembros_updated_at ON public.grupo_miembros;
CREATE TRIGGER grupo_miembros_updated_at
  BEFORE UPDATE ON public.grupo_miembros
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- alertas (legacy)
DROP TRIGGER IF EXISTS alertas_updated_at ON public.alertas;
CREATE TRIGGER alertas_updated_at
  BEFORE UPDATE ON public.alertas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- alerts (ICS)
DROP TRIGGER IF EXISTS alerts_updated_at ON public.alerts;
CREATE TRIGGER alerts_updated_at
  BEFORE UPDATE ON public.alerts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- rachas — tenía updated_at pero no trigger (era manual en save_checkin_ics)
DROP TRIGGER IF EXISTS rachas_updated_at ON public.rachas;
CREATE TRIGGER rachas_updated_at
  BEFORE UPDATE ON public.rachas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 3. ÍNDICES FALTANTES EN FK
-- ============================================================

-- conductas_ancla: queries por user_id + activa + orden
CREATE INDEX IF NOT EXISTS conductas_ancla_user_activa_idx
  ON public.conductas_ancla(user_id, activa, orden);

-- grupos: queries de facilitador por sus grupos activos
CREATE INDEX IF NOT EXISTS grupos_facilitador_activo_idx
  ON public.grupos(facilitador_id, activo);

-- grupo_miembros: queries de paciente por su membresía activa
CREATE INDEX IF NOT EXISTS grupo_miembros_user_activo_idx
  ON public.grupo_miembros(user_id, activo);

-- alerts: queries por semana (usado en cron)
CREATE INDEX IF NOT EXISTS alerts_week_patient_idx
  ON public.alerts(week_start, patient_id);

-- ============================================================
-- 4. SET search_path = public EN FUNCIONES SECURITY DEFINER
--    (previene ataques de search_path injection)
-- ============================================================

-- 4a. crear_conductas_default
CREATE OR REPLACE FUNCTION public.crear_conductas_default(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO conductas_ancla (user_id, nombre, icono, orden) VALUES
    (p_user_id, 'Me hidraté correctamente', '💧', 0),
    (p_user_id, 'Hice actividad física',    '🏃', 1),
    (p_user_id, 'Dormí bien (7-8 hrs)',     '😴', 2),
    (p_user_id, 'Comí saludable',           '🥗', 3),
    (p_user_id, 'Tomé mi medicación',       '💊', 4)
  ON CONFLICT (user_id, nombre) DO NOTHING;
END;
$$;

-- 4b. calcular_score_riesgo
CREATE OR REPLACE FUNCTION public.calcular_score_riesgo(p_user_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score             int := 0;
  v_dias_sin_registro int;
  v_iem_promedio      numeric;
  v_dias_rojo         int;
  v_dias_periodo      int := 7;
BEGIN
  SELECT (v_dias_periodo - count(*))
  INTO v_dias_sin_registro
  FROM checkins_diarios_legacy
  WHERE user_id = p_user_id
    AND fecha >= current_date - v_dias_periodo;

  SELECT coalesce(avg(iem), 0)
  INTO v_iem_promedio
  FROM checkins_diarios_legacy
  WHERE user_id = p_user_id
    AND fecha >= current_date - v_dias_periodo;

  SELECT count(*)
  INTO v_dias_rojo
  FROM checkins_diarios_legacy
  WHERE user_id = p_user_id
    AND fecha >= current_date - v_dias_periodo
    AND semaforo = 'rojo';

  v_score := v_score + (v_dias_sin_registro * 10);

  IF v_iem_promedio < 3 THEN
    v_score := v_score + 20;
  ELSIF v_iem_promedio < 4 THEN
    v_score := v_score + 10;
  END IF;

  v_score := v_score + (v_dias_rojo * 5);

  RETURN least(v_score, 100);
END;
$$;

-- 4c. calcular_racha (legacy)
CREATE OR REPLACE FUNCTION public.calcular_racha(p_user_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_racha          int  := 0;
  v_fecha          date := current_date;
  v_tiene_checkin  boolean;
BEGIN
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM checkins_diarios_legacy
      WHERE user_id = p_user_id AND fecha = v_fecha
    ) INTO v_tiene_checkin;

    EXIT WHEN NOT v_tiene_checkin;

    v_racha := v_racha + 1;
    v_fecha := v_fecha - 1;
  END LOOP;

  RETURN v_racha;
END;
$$;

-- 4d. generar_alertas_automaticas (legacy)
CREATE OR REPLACE FUNCTION public.generar_alertas_automaticas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user record;
BEGIN
  FOR v_user IN
    SELECT DISTINCT gm.user_id
    FROM grupo_miembros gm
    JOIN grupos g ON g.id = gm.grupo_id
    WHERE gm.activo = true
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM checkins_diarios_legacy
      WHERE user_id = v_user.user_id
        AND fecha >= current_date - 2
    ) THEN
      IF NOT EXISTS (
        SELECT 1 FROM alertas
        WHERE user_id = v_user.user_id
          AND tipo     = 'ausencia'
          AND resuelta = false
          AND fecha   >= current_date - 3
      ) THEN
        INSERT INTO alertas (user_id, tipo, descripcion, prioridad)
        VALUES (v_user.user_id, 'ausencia',
                'Sin registro por 2 o más días consecutivos', 'urgente');
      END IF;
    END IF;

    IF (
      SELECT coalesce(avg(iem), 0)
      FROM checkins_diarios_legacy
      WHERE user_id = v_user.user_id
        AND fecha >= current_date - 3
    ) < 3 THEN
      IF NOT EXISTS (
        SELECT 1 FROM alertas
        WHERE user_id = v_user.user_id
          AND tipo     = 'iem_bajo'
          AND resuelta = false
          AND fecha   >= current_date - 3
      ) THEN
        INSERT INTO alertas (user_id, tipo, descripcion, prioridad)
        VALUES (v_user.user_id, 'iem_bajo',
                'IEM promedio por debajo de 3 en los últimos 3 días', 'urgente');
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- 4e. handle_new_user (trigger de auth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO users (id, email, nombre, role)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'paciente')
  );
  RETURN new;
END;
$$;

-- 4f. handle_checkin_alerta (trigger)
CREATE OR REPLACE FUNCTION public.handle_checkin_alerta()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF new.semaforo = 'rojo' THEN
    IF NOT EXISTS (
      SELECT 1 FROM alertas
      WHERE user_id = new.user_id
        AND tipo  = 'semaforo_rojo'
        AND fecha = new.fecha
    ) THEN
      INSERT INTO alertas (user_id, tipo, descripcion, prioridad, fecha)
      VALUES (
        new.user_id,
        'semaforo_rojo',
        'Semáforo en ROJO: IEM ' || new.iem || '/7, emoción ' || new.emocion,
        'urgente',
        new.fecha
      );
    END IF;
  END IF;
  RETURN new;
END;
$$;

-- 4g. save_checkin (RPC legacy)
-- DROP necesario porque cambia el tipo de retorno (checkins → checkins_diarios_legacy)
DROP FUNCTION IF EXISTS public.save_checkin(date, text, uuid[], smallint, text, text, text);

CREATE OR REPLACE FUNCTION public.save_checkin(
  p_fecha    date,
  p_turno    text,
  p_conductas uuid[],
  p_iem      smallint,
  p_emocion  text,
  p_semaforo text,
  p_notas    text DEFAULT NULL
)
RETURNS public.checkins_diarios_legacy
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_result  public.checkins_diarios_legacy;
BEGIN
  IF EXISTS (
    SELECT 1 FROM checkins_diarios_legacy
    WHERE user_id = v_user_id
      AND fecha   = p_fecha
      AND turno   = p_turno
  ) THEN
    RAISE EXCEPTION 'Ya existe un check-in para este turno del día';
  END IF;

  INSERT INTO checkins_diarios_legacy (
    user_id, fecha, turno,
    conductas_completadas, iem, emocion, semaforo, notas
  ) VALUES (
    v_user_id, p_fecha, p_turno,
    p_conductas, p_iem, p_emocion, p_semaforo, p_notas
  )
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.save_checkin FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_checkin TO authenticated;

-- 4h. get_facilitador_whatsapp
CREATE OR REPLACE FUNCTION public.get_facilitador_whatsapp(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_whatsapp text;
BEGIN
  SELECT u.whatsapp
  INTO v_whatsapp
  FROM grupo_miembros gm
  JOIN grupos g ON g.id = gm.grupo_id
  JOIN users  u ON u.id = g.facilitador_id
  WHERE gm.user_id = p_user_id
    AND gm.activo  = true
    AND g.activo   = true
  LIMIT 1;

  RETURN v_whatsapp;
END;
$$;

REVOKE ALL ON FUNCTION public.get_facilitador_whatsapp FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_facilitador_whatsapp TO authenticated;

-- 4i. es_miembro_grupo
CREATE OR REPLACE FUNCTION public.es_miembro_grupo(p_grupo_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM grupo_miembros
    WHERE grupo_id = p_grupo_id
      AND user_id  = p_user_id
      AND activo   = true
  )
$$;

GRANT EXECUTE ON FUNCTION public.es_miembro_grupo TO authenticated;

-- 4j. save_checkin_ics
CREATE OR REPLACE FUNCTION public.save_checkin_ics(
  p_user_id       uuid,
  p_week_start    date,
  p_ica_days      integer[],
  p_ica_barriers  integer,
  p_be_energy     integer,
  p_be_regulation integer,
  p_ini_score     integer,
  p_semaphore     text,
  p_alerts        text[],
  p_scores        jsonb,
  p_dominant      text
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
    submitted_at
  ) VALUES (
    p_user_id, p_week_start,
    p_ica_days, p_ica_barriers,
    p_be_energy, p_be_regulation,
    p_ini_score,
    p_semaphore, p_alerts, p_scores, p_dominant,
    now()
  )
  ON CONFLICT (user_id, week_start) DO UPDATE SET
    ica_days        = EXCLUDED.ica_days,
    ica_barriers    = EXCLUDED.ica_barriers,
    be_energy       = EXCLUDED.be_energy,
    be_regulation   = EXCLUDED.be_regulation,
    ini_score       = EXCLUDED.ini_score,
    semaphore       = EXCLUDED.semaphore,
    alerts          = EXCLUDED.alerts,
    scores          = EXCLUDED.scores,
    dominant_domain = EXCLUDED.dominant_domain,
    submitted_at    = EXCLUDED.submitted_at
  RETURNING id INTO v_checkin_id;

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

-- ============================================================
-- 5. GRANTS FALTANTES EN TABLAS DEL MOTOR ICS
-- ============================================================

GRANT SELECT, INSERT, UPDATE ON public.checkins_semanales TO authenticated;
GRANT SELECT, UPDATE         ON public.alerts             TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.rachas             TO authenticated;

-- ============================================================
-- 6. SECURITY INVOKER EN VISTAS
--    (evita que la vista bypasee RLS de las tablas subyacentes)
-- ============================================================

ALTER VIEW public.vista_estado_pacientes_ics
  SET (security_invoker = true);

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
-- SELECT tablename, rowsecurity
-- FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
--
-- SELECT tgname, relname FROM pg_trigger
-- JOIN pg_class ON pg_class.oid = pg_trigger.tgrelid
-- WHERE tgname LIKE '%updated_at%';
--
-- SELECT proname, prosecdef, proconfig
-- FROM pg_proc WHERE pronamespace = 'public'::regnamespace
--   AND prosecdef = true;
