-- ============================================================
-- MIGRACIÓN 008: Schema Motor ICS — Sistema de 3 dominios
-- Reemplaza el sistema de check-in diario por check-in semanal ICS
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================
--
-- Cambios:
--   1. Remplaza tabla checkins por checkins_semanales (modelo ICS)
--   2. Crea tabla alerts (motor de alertas ICS, reemplaza alertas)
--   3. Crea tabla rachas (persistencia de rachas verdes)
--   4. RLS en todas las tablas nuevas
-- ============================================================

-- ============================================================
-- PASO 1: Renombrar tabla antigua (preservar datos históricos)
-- ============================================================
ALTER TABLE public.checkins RENAME TO checkins_diarios_legacy;

-- ============================================================
-- PASO 2: Nueva tabla checkins_semanales (modelo ICS)
-- ============================================================
CREATE TABLE public.checkins_semanales (
  id              uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id         uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,

  -- Semana (lunes a domingo)
  week_start      date NOT NULL,  -- Siempre el lunes de la semana

  -- DOMINIO 1: ICA — Índice de Conductas Ancla
  ica_days        integer[] NOT NULL DEFAULT '{}',  -- 5 valores [0-7], uno por conducta
  ica_barriers    integer   NOT NULL DEFAULT 0 CHECK (ica_barriers BETWEEN 0 AND 3),

  -- DOMINIO 2: BE — Brújula Emocional
  be_energy       integer   NOT NULL CHECK (be_energy BETWEEN 1 AND 5),
  be_regulation   integer   NOT NULL CHECK (be_regulation IN (1, 3, 5)),

  -- DOMINIO 3: INI — Narrativa Interna
  ini_score       integer   NOT NULL CHECK (ini_score IN (1, 3, 5)),

  -- Resultado calculado
  semaphore       text      NOT NULL CHECK (semaphore IN ('green', 'amber', 'red')),
  alerts          text[]    NOT NULL DEFAULT '{}',  -- be_critical, ini_saboteador, ica_zero, combined_risk
  scores          jsonb     NOT NULL DEFAULT '{}',  -- { ica, be, be_norm, ini, ini_norm, ics }
  dominant_domain text      NOT NULL DEFAULT 'ica' CHECK (dominant_domain IN ('ica', 'be', 'ini')),

  submitted_at    timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),

  -- Un check-in por semana por usuario
  UNIQUE (user_id, week_start)
);

-- Índices
CREATE INDEX checkins_semanales_user_week_idx  ON public.checkins_semanales(user_id, week_start DESC);
CREATE INDEX checkins_semanales_semaphore_idx  ON public.checkins_semanales(semaphore, week_start DESC);

-- RLS
ALTER TABLE public.checkins_semanales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pacientes ven sus propios checkins semanales"
  ON public.checkins_semanales FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Pacientes crean sus propios checkins semanales"
  ON public.checkins_semanales FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Facilitadores ven checkins de sus pacientes"
  ON public.checkins_semanales FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.grupo_miembros gm
      JOIN public.grupos g ON g.id = gm.grupo_id
      WHERE gm.user_id = public.checkins_semanales.user_id
        AND g.facilitador_id = auth.uid()
    )
  );

-- ============================================================
-- PASO 3: Nueva tabla alerts (motor ICS — reemplaza alertas)
-- ============================================================
CREATE TABLE public.alerts (
  id              uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id      uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,

  type            text NOT NULL,  -- missing_checkin, red_semaphore, amber_circumstantial,
                                  -- amber_systemic, be_critical, ica_zero,
                                  -- ini_saboteador_streak, green_with_low_ica,
                                  -- green_streak_milestone, combined_risk
  color           text NOT NULL CHECK (color IN ('red', 'amber', 'celebration', 'internal')),
  assign_to       text NOT NULL,  -- medica, coach, coach_urgent, coach_note, auto
  message         text NOT NULL,
  priority        numeric NOT NULL DEFAULT 2,  -- 1=urgente, 1.5-1.8=alto, 2=normal, 3+=bajo

  scores          jsonb,          -- snapshot del ICS al momento de la alerta
  is_read         boolean NOT NULL DEFAULT false,
  week_start      date,           -- semana a la que pertenece la alerta

  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX alerts_patient_unread_idx ON public.alerts(patient_id, is_read, created_at DESC);
CREATE INDEX alerts_priority_idx       ON public.alerts(priority, is_read, created_at DESC);
CREATE INDEX alerts_color_idx          ON public.alerts(color, is_read, created_at DESC);

-- RLS
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Facilitadores ven alertas de sus pacientes"
  ON public.alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.grupo_miembros gm
      JOIN public.grupos g ON g.id = gm.grupo_id
      WHERE gm.user_id = public.alerts.patient_id
        AND g.facilitador_id = auth.uid()
    )
  );

CREATE POLICY "Facilitadores marcan alertas como leídas"
  ON public.alerts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.grupo_miembros gm
      JOIN public.grupos g ON g.id = gm.grupo_id
      WHERE gm.user_id = public.alerts.patient_id
        AND g.facilitador_id = auth.uid()
    )
  );

CREATE POLICY "Pacientes ven sus propias alertas"
  ON public.alerts FOR SELECT
  USING (auth.uid() = patient_id);

-- ============================================================
-- PASO 4: Tabla rachas (persistencia de rachas verdes semanales)
-- ============================================================
CREATE TABLE public.rachas (
  id                   uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  paciente_id          uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  tipo                 text NOT NULL DEFAULT 'green_streak' CHECK (tipo IN ('green_streak', 'ini_saboteador')),
  semanas_consecutivas integer NOT NULL DEFAULT 0,
  ultimo_hito          integer,  -- 3, 6, 12 (semanas en que se celebró)
  updated_at           timestamptz NOT NULL DEFAULT now(),

  UNIQUE (paciente_id, tipo)
);

-- RLS
ALTER TABLE public.rachas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pacientes ven sus propias rachas"
  ON public.rachas FOR SELECT
  USING (auth.uid() = paciente_id);

CREATE POLICY "Pacientes actualizan sus propias rachas"
  ON public.rachas FOR ALL
  USING (auth.uid() = paciente_id);

CREATE POLICY "Facilitadores ven rachas de sus pacientes"
  ON public.rachas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.grupo_miembros gm
      JOIN public.grupos g ON g.id = gm.grupo_id
      WHERE gm.user_id = public.rachas.paciente_id
        AND g.facilitador_id = auth.uid()
    )
  );

-- ============================================================
-- PASO 5: Función helper — lunes de la semana actual
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_week_start(p_date date DEFAULT current_date)
RETURNS date AS $$
BEGIN
  -- Retorna el lunes de la semana (ISO week)
  RETURN date_trunc('week', p_date::timestamptz)::date;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- PASO 6: RPC — guardar check-in semanal ICS
-- ============================================================
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
RETURNS uuid AS $$
DECLARE
  v_checkin_id uuid;
  v_green_streak integer := 0;
BEGIN
  -- Insertar (o reemplazar si ya existe la semana)
  INSERT INTO public.checkins_semanales (
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

  -- Actualizar racha verde
  IF p_semaphore = 'green' THEN
    -- Contar semanas verdes consecutivas hacia atrás
    SELECT COUNT(*) INTO v_green_streak
    FROM (
      SELECT week_start, semaphore,
             ROW_NUMBER() OVER (ORDER BY week_start DESC) -
             ROW_NUMBER() OVER (PARTITION BY semaphore ORDER BY week_start DESC) AS grp
      FROM public.checkins_semanales
      WHERE user_id = p_user_id
        AND week_start <= p_week_start
    ) sub
    WHERE semaphore = 'green' AND grp = 0;

    INSERT INTO public.rachas (paciente_id, tipo, semanas_consecutivas, updated_at)
    VALUES (p_user_id, 'green_streak', v_green_streak, now())
    ON CONFLICT (paciente_id, tipo) DO UPDATE SET
      semanas_consecutivas = EXCLUDED.semanas_consecutivas,
      updated_at           = EXCLUDED.updated_at;
  ELSE
    -- Resetear racha verde
    INSERT INTO public.rachas (paciente_id, tipo, semanas_consecutivas, updated_at)
    VALUES (p_user_id, 'green_streak', 0, now())
    ON CONFLICT (paciente_id, tipo) DO UPDATE SET
      semanas_consecutivas = 0,
      updated_at           = EXCLUDED.updated_at;
  END IF;

  RETURN v_checkin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PASO 7: Vista actualizada para facilitadores (usa ICS)
-- ============================================================
CREATE OR REPLACE VIEW public.vista_estado_pacientes_ics AS
SELECT
  u.id,
  u.nombre,
  u.email,
  u.avatar_url,
  cs.week_start                                    AS semana_actual,
  cs.semaphore,
  cs.scores,
  cs.dominant_domain,
  cs.alerts                                        AS alertas_semana,
  COALESCE(r.semanas_consecutivas, 0)              AS racha_verde,
  (SELECT COUNT(*) FROM public.alerts a
   WHERE a.patient_id = u.id AND a.is_read = false
     AND a.color IN ('red', 'amber'))::int         AS alertas_pendientes,
  gm.grupo_id
FROM public.users u
LEFT JOIN public.checkins_semanales cs
  ON cs.user_id = u.id
  AND cs.week_start = public.get_week_start()
LEFT JOIN public.rachas r
  ON r.paciente_id = u.id AND r.tipo = 'green_streak'
JOIN public.grupo_miembros gm ON gm.user_id = u.id
WHERE u.role = 'paciente';

GRANT SELECT ON public.vista_estado_pacientes_ics TO authenticated;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
-- SELECT get_week_start();
-- SELECT * FROM checkins_semanales LIMIT 5;
-- SELECT * FROM alerts ORDER BY priority LIMIT 10;
-- SELECT * FROM rachas;
