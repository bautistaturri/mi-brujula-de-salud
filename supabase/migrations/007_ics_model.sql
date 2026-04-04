-- ============================================================
-- MIGRACIÓN 007: Modelo ICS (Índice Compass Semanal)
--
-- Crea las tablas del sistema de evaluación semanal ICS
-- que reemplaza al check-in diario como mecanismo principal.
--
-- Prerequisito: migraciones 001-006 ya aplicadas.
-- Después de esta migración, ejecutar security-rls.sql para
-- aplicar las políticas RLS sobre las tablas nuevas.
-- ============================================================

-- ============================================================
-- TABLA: checkins_semanales
-- Registro semanal ICS del paciente (uno por semana).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.checkins_semanales (
  id              uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  week_start      date NOT NULL,

  -- Dominio ICA: días cumplidos por conducta (5 valores, 0-7 cada uno)
  ica_days        smallint[] NOT NULL DEFAULT '{0,0,0,0,0}',
  -- Barreras superadas para cumplir conductas (0-3)
  ica_barriers    smallint NOT NULL DEFAULT 0 CHECK (ica_barriers BETWEEN 0 AND 3),

  -- Dominio BE: Brújula Emocional
  be_energy       smallint NOT NULL DEFAULT 3 CHECK (be_energy BETWEEN 1 AND 5),
  be_regulation   smallint NOT NULL DEFAULT 3 CHECK (be_regulation IN (1, 3, 5)),

  -- Dominio INI: Narrativa Interna (1=Saboteador, 3=Observador, 5=Aliado)
  ini_score       smallint NOT NULL DEFAULT 3 CHECK (ini_score IN (1, 3, 5)),

  -- Resultado ICS
  semaphore       text NOT NULL CHECK (semaphore IN ('green', 'amber', 'red')),
  alerts          text[] NOT NULL DEFAULT '{}',
  scores          jsonb NOT NULL DEFAULT '{}',
  dominant_domain text NOT NULL DEFAULT 'ica' CHECK (dominant_domain IN ('ica', 'be', 'ini')),

  submitted_at    timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),

  -- Un check-in por semana por usuario
  UNIQUE (user_id, week_start)
);

ALTER TABLE public.checkins_semanales ENABLE ROW LEVEL SECURITY;

-- Paciente: solo ve sus propios check-ins
CREATE POLICY "cks_select_own"
  ON public.checkins_semanales FOR SELECT
  USING (auth.uid() = user_id);

-- Facilitador: ve check-ins de pacientes en sus grupos
CREATE POLICY "cks_select_facilitador"
  ON public.checkins_semanales FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.grupo_miembros gm
      JOIN public.grupos g ON g.id = gm.grupo_id
      WHERE gm.user_id = checkins_semanales.user_id
        AND g.facilitador_id = auth.uid()
    )
  );

-- Solo el paciente puede insertar (vía RPC save_checkin_ics)
CREATE POLICY "cks_insert_own"
  ON public.checkins_semanales FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS cks_user_week_idx ON public.checkins_semanales (user_id, week_start DESC);
CREATE INDEX IF NOT EXISTS cks_semaphore_idx ON public.checkins_semanales (semaphore, week_start DESC);

GRANT SELECT, INSERT ON public.checkins_semanales TO authenticated;


-- ============================================================
-- TABLA: alerts
-- Alertas generadas por el motor ICS (cron semanal).
-- Distinta de la tabla `alertas` legacy (check-in diario).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.alerts (
  id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id  uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type        text NOT NULL,
  color       text NOT NULL CHECK (color IN ('red', 'amber', 'celebration', 'internal')),
  assign_to   text NOT NULL,
  message     text NOT NULL,
  priority    numeric NOT NULL DEFAULT 2,
  scores      jsonb,
  is_read     boolean NOT NULL DEFAULT false,
  week_start  date,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alerts_select_facilitador"
  ON public.alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.grupo_miembros gm
      JOIN public.grupos g ON g.id = gm.grupo_id
      WHERE gm.user_id = alerts.patient_id
        AND g.facilitador_id = auth.uid()
    )
  );

CREATE POLICY "alerts_update_facilitador"
  ON public.alerts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.grupo_miembros gm
      JOIN public.grupos g ON g.id = gm.grupo_id
      WHERE gm.user_id = alerts.patient_id
        AND g.facilitador_id = auth.uid()
    )
  );

-- Insert lo hace el service_role (cron), no el cliente
CREATE INDEX IF NOT EXISTS alerts_patient_read_idx ON public.alerts (patient_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS alerts_priority_idx ON public.alerts (priority ASC, created_at DESC);

GRANT SELECT, UPDATE ON public.alerts TO authenticated;


-- ============================================================
-- TABLA: rachas
-- Racha semanal de semáforos verdes y detección de saboteador.
-- Una fila por (paciente, tipo). Upsert en cada check-in ICS.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rachas (
  id                    uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  paciente_id           uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tipo                  text NOT NULL CHECK (tipo IN ('green_streak', 'ini_saboteador')),
  semanas_consecutivas  smallint NOT NULL DEFAULT 0,
  ultimo_hito           smallint,
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (paciente_id, tipo)
);

ALTER TABLE public.rachas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rachas_select_own"
  ON public.rachas FOR SELECT
  USING (auth.uid() = paciente_id);

CREATE POLICY "rachas_select_facilitador"
  ON public.rachas FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.grupo_miembros gm
      JOIN public.grupos g ON g.id = gm.grupo_id
      WHERE gm.user_id = rachas.paciente_id
        AND g.facilitador_id = auth.uid()
    )
  );

CREATE POLICY "rachas_upsert_own"
  ON public.rachas FOR ALL
  USING (auth.uid() = paciente_id)
  WITH CHECK (auth.uid() = paciente_id);

GRANT SELECT, INSERT, UPDATE ON public.rachas TO authenticated;


-- ============================================================
-- TABLA: registros_semanales
-- Registro de bienestar subjetivo (formulario de 6 dimensiones).
-- Complementario al check-in ICS; permite ver evolución semanal.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.registros_semanales (
  id                      uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  paciente_id             uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  semana_inicio           date NOT NULL,
  semana_fin              date NOT NULL,
  animo                   smallint NOT NULL CHECK (animo BETWEEN 1 AND 5),
  sueno                   smallint NOT NULL CHECK (sueno BETWEEN 1 AND 5),
  energia                 smallint NOT NULL CHECK (energia BETWEEN 1 AND 5),
  alimentacion            smallint NOT NULL CHECK (alimentacion BETWEEN 1 AND 5),
  actividad_fisica        smallint NOT NULL CHECK (actividad_fisica BETWEEN 0 AND 7),
  adherencia_medicacion   text NOT NULL CHECK (adherencia_medicacion IN ('si', 'no', 'no_aplica')),
  sintomas                text,
  logro_personal          text,
  dificultad              text,
  score                   numeric,
  nivel_bienestar         text,
  requiere_atencion       boolean NOT NULL DEFAULT false,
  created_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE (paciente_id, semana_inicio)
);

ALTER TABLE public.registros_semanales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rs_select_own"
  ON public.registros_semanales FOR SELECT
  USING (auth.uid() = paciente_id);

CREATE POLICY "rs_select_facilitador"
  ON public.registros_semanales FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.grupo_miembros gm
      JOIN public.grupos g ON g.id = gm.grupo_id
      WHERE gm.user_id = registros_semanales.paciente_id
        AND g.facilitador_id = auth.uid()
    )
  );

CREATE POLICY "rs_insert_own"
  ON public.registros_semanales FOR INSERT
  WITH CHECK (auth.uid() = paciente_id);

-- Registros son inmutables una vez enviados — no se permite UPDATE desde el cliente
CREATE INDEX IF NOT EXISTS rs_paciente_semana_idx ON public.registros_semanales (paciente_id, semana_inicio DESC);

GRANT SELECT, INSERT ON public.registros_semanales TO authenticated;


-- ============================================================
-- TABLA: logros_paciente
-- Logros desbloqueados automáticamente al enviar registro semanal.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.logros_paciente (
  id              uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  paciente_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  logro_key       text NOT NULL,
  desbloqueado_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (paciente_id, logro_key)
);

ALTER TABLE public.logros_paciente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "logros_select_own"
  ON public.logros_paciente FOR SELECT
  USING (auth.uid() = paciente_id);

CREATE POLICY "logros_select_facilitador"
  ON public.logros_paciente FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.grupo_miembros gm
      JOIN public.grupos g ON g.id = gm.grupo_id
      WHERE gm.user_id = logros_paciente.paciente_id
        AND g.facilitador_id = auth.uid()
    )
  );

CREATE POLICY "logros_insert_own"
  ON public.logros_paciente FOR INSERT
  WITH CHECK (auth.uid() = paciente_id);

GRANT SELECT, INSERT ON public.logros_paciente TO authenticated;


-- ============================================================
-- RPC: save_checkin_ics
-- Guarda el check-in semanal ICS y actualiza la racha verde.
-- SECURITY DEFINER para poder hacer upsert en rachas sin
-- exponerlo al cliente directamente.
-- Llamada desde: CheckinICS.tsx
-- ============================================================
CREATE OR REPLACE FUNCTION public.save_checkin_ics(
  p_user_id       uuid,
  p_week_start    date,
  p_ica_days      smallint[],
  p_ica_barriers  smallint,
  p_be_energy     smallint,
  p_be_regulation smallint,
  p_ini_score     smallint,
  p_semaphore     text,
  p_alerts        text[],
  p_scores        jsonb,
  p_dominant      text
)
RETURNS public.checkins_semanales
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_result public.checkins_semanales;
BEGIN
  -- Solo el propio usuario puede guardar su check-in
  IF v_caller IS NULL OR v_caller <> p_user_id THEN
    RAISE EXCEPTION 'Acceso no autorizado';
  END IF;

  -- Validaciones básicas
  IF array_length(p_ica_days, 1) <> 5 THEN
    RAISE EXCEPTION 'ica_days debe tener exactamente 5 elementos';
  END IF;
  IF p_semaphore NOT IN ('green', 'amber', 'red') THEN
    RAISE EXCEPTION 'semaphore inválido';
  END IF;

  -- Upsert del check-in (idempotente si ya existe esa semana)
  INSERT INTO public.checkins_semanales (
    user_id, week_start, ica_days, ica_barriers,
    be_energy, be_regulation, ini_score,
    semaphore, alerts, scores, dominant_domain, submitted_at
  ) VALUES (
    p_user_id, p_week_start, p_ica_days, p_ica_barriers,
    p_be_energy, p_be_regulation, p_ini_score,
    p_semaphore, p_alerts, p_scores, p_dominant, now()
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
  RETURNING * INTO v_result;

  -- Actualizar racha verde
  IF p_semaphore = 'green' THEN
    INSERT INTO public.rachas (paciente_id, tipo, semanas_consecutivas, updated_at)
    VALUES (p_user_id, 'green_streak', 1, now())
    ON CONFLICT (paciente_id, tipo) DO UPDATE SET
      semanas_consecutivas = rachas.semanas_consecutivas + 1,
      updated_at = now();
  ELSE
    -- Rompe la racha verde (resetea a 0 sin borrar el registro)
    UPDATE public.rachas
    SET semanas_consecutivas = 0, updated_at = now()
    WHERE paciente_id = p_user_id AND tipo = 'green_streak';
  END IF;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.save_checkin_ics(uuid, date, smallint[], smallint, smallint, smallint, smallint, text, text[], jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_checkin_ics(uuid, date, smallint[], smallint, smallint, smallint, smallint, text, text[], jsonb, text) TO authenticated;
