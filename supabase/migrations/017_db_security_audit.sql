-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MIGRACIÓN 017: Auditoría DB + Seguridad
-- Fecha: 2026-04-10
--
-- Correcciones:
--   CRÍTICO 1: Fix emocion_principal constraint (LIVE BUG post-FASE4)
--   CRÍTICO 2: Composite CHECK saboteador+observador ≤ 10
--   CRÍTICO 3: Fix FKs auth.users → public.users (3 tablas)
--   HIGH 1:    apellido en users
--   HIGH 2:    roles medica + coach en users
--   HIGH 3:    NOT NULL en registros_diarios.energia_dia / animo_dia
--   HIGH 4:    formula_version en checkins_semanales
--   HIGH 5:    updated_at en contenidos_gimnasio + progreso_gimnasio
--   HIGH 6:    save_checkin_ics — validación suma saboteador+observador en RPC
--   HIGH 7:    tabla intervenciones (nueva)
--   HIGH 8:    fecha_inicio, fecha_fin, estado en grupos
--   MEDIUM 1:  tabla perfiles_clinicos (1:1 paciente, migración de datos)
--   MEDIUM 2:  tabla conductas_ancla_historial (auditoría de cambios)
--   MEDIUM 3:  tabla grupo_equipo (coaches y médicas por grupo)
--   MEDIUM 4:  índices analíticos longitudinales
--   MEDIUM 5:  deprecar vista_estado_pacientes (M001, sin RLS guardrail)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


-- ================================================================
-- CRÍTICO 1: emocion_principal — corregir constraint LIVE BUG
--
-- M013 creó el constraint con valores de emoción obsoletos:
--   'enojado', 'triste', 'miedo', 'sorpresa', 'asco', 'alegre'
--
-- Los valores actuales de la app (post FASE4, src/types/database.ts):
--   'alegre', 'en_calma', 'sensible', 'preocupado', 'cansado', 'esperanzado'
--
-- Todo INSERT con los nuevos valores falla con CHECK constraint violation.
-- ================================================================

-- Nullear filas con valores stale del constraint anterior (M013).
-- Son datos de test: el bug impedía que los nuevos valores se insertaran.
UPDATE public.checkins_semanales
  SET emocion_principal = NULL
  WHERE emocion_principal NOT IN (
    'alegre', 'en_calma', 'sensible', 'preocupado', 'cansado', 'esperanzado'
  );

ALTER TABLE public.checkins_semanales
  DROP CONSTRAINT IF EXISTS checkins_semanales_emocion_principal_check;

ALTER TABLE public.checkins_semanales
  ADD CONSTRAINT checkins_semanales_emocion_principal_check
  CHECK (emocion_principal IN (
    'alegre', 'en_calma', 'sensible', 'preocupado', 'cansado', 'esperanzado'
  ));


-- ================================================================
-- CRÍTICO 2: saboteador + observador ≤ 10
--
-- Regla de negocio: la suma de ambos puntajes no puede superar 10.
-- La app lo limita en frontend (CheckinICS.tsx, MAX_SUMA=10) pero
-- la regla necesita enforcement también a nivel de base de datos.
-- NULL en cualquiera de los dos → constraint no aplica (semana anterior
-- al campo, o check-in parcial).
-- ================================================================

ALTER TABLE public.checkins_semanales
  ADD CONSTRAINT ck_sab_obs_sum
  CHECK (
    saboteador_score IS NULL
    OR observador_score IS NULL
    OR saboteador_score + observador_score <= 10
  );


-- ================================================================
-- CRÍTICO 3: FKs auth.users → public.users
--
-- auth.users y public.users siempre comparten el mismo id
-- (trigger handle_new_user garantiza sincronía). Apuntar a
-- public.users nos da integridad referencial con datos de perfil
-- y ON DELETE CASCADE coherente con el resto del schema.
--
-- Tablas afectadas:
--   • registros_diarios.paciente_id
--   • progreso_gimnasio.usuario_id
--   • feedback_respuestas.usuario_id
-- ================================================================

-- 3a. registros_diarios
ALTER TABLE public.registros_diarios
  DROP CONSTRAINT IF EXISTS registros_diarios_paciente_id_fkey;
ALTER TABLE public.registros_diarios
  ADD CONSTRAINT registros_diarios_paciente_id_fkey
  FOREIGN KEY (paciente_id)
  REFERENCES public.users(id) ON DELETE CASCADE;

-- 3b. progreso_gimnasio
ALTER TABLE public.progreso_gimnasio
  DROP CONSTRAINT IF EXISTS progreso_gimnasio_usuario_id_fkey;
ALTER TABLE public.progreso_gimnasio
  ADD CONSTRAINT progreso_gimnasio_usuario_id_fkey
  FOREIGN KEY (usuario_id)
  REFERENCES public.users(id) ON DELETE CASCADE;

-- 3c. feedback_respuestas
ALTER TABLE public.feedback_respuestas
  DROP CONSTRAINT IF EXISTS feedback_respuestas_usuario_id_fkey;
ALTER TABLE public.feedback_respuestas
  ADD CONSTRAINT feedback_respuestas_usuario_id_fkey
  FOREIGN KEY (usuario_id)
  REFERENCES public.users(id) ON DELETE CASCADE;


-- ================================================================
-- HIGH 1: apellido en users
-- ================================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS apellido text;


-- ================================================================
-- HIGH 2: Extender role con 'medica' y 'coach'
--
-- 'facilitador' se conserva para usuarios existentes.
-- Nuevos profesionales pueden tener rol más específico.
-- handle_new_user ya lee raw_user_meta_data->>'role', por lo que
-- el registro de nuevos usuarios con estos roles funciona sin cambios.
-- ================================================================

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('paciente', 'facilitador', 'coach', 'medica'));

-- Actualizar handle_new_user para propagar apellido si viene en metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO users (id, email, nombre, apellido, role)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'apellido',
    coalesce(new.raw_user_meta_data->>'role', 'paciente')
  );
  RETURN new;
END;
$$;


-- ================================================================
-- HIGH 3: NOT NULL en energia_dia y animo_dia
--
-- El schema de validación Zod (RegistroDiarioSchema) ya los requiere.
-- Completar NULLs existentes con valor neutral (3 = punto medio)
-- antes de añadir NOT NULL para no romper datos históricos.
-- ================================================================

UPDATE public.registros_diarios
  SET energia_dia = 3
  WHERE energia_dia IS NULL;

UPDATE public.registros_diarios
  SET animo_dia = 3
  WHERE animo_dia IS NULL;

ALTER TABLE public.registros_diarios
  ALTER COLUMN energia_dia SET NOT NULL;
ALTER TABLE public.registros_diarios
  ALTER COLUMN animo_dia   SET NOT NULL;


-- ================================================================
-- HIGH 4: formula_version en checkins_semanales
--
-- Permite recomputar el ICS histórico si la fórmula evoluciona.
-- Todos los registros existentes son versión '1.0'.
-- ================================================================

ALTER TABLE public.checkins_semanales
  ADD COLUMN IF NOT EXISTS formula_version text NOT NULL DEFAULT '1.0';


-- ================================================================
-- HIGH 5: updated_at en contenidos_gimnasio + progreso_gimnasio
-- ================================================================

ALTER TABLE public.contenidos_gimnasio
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.progreso_gimnasio
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS contenidos_gimnasio_updated_at ON public.contenidos_gimnasio;
CREATE TRIGGER contenidos_gimnasio_updated_at
  BEFORE UPDATE ON public.contenidos_gimnasio
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS progreso_gimnasio_updated_at ON public.progreso_gimnasio;
CREATE TRIGGER progreso_gimnasio_updated_at
  BEFORE UPDATE ON public.progreso_gimnasio
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ================================================================
-- HIGH 6: save_checkin_ics — validación suma en RPC
--
-- Reemplaza la función de M016. Añade:
--   • Validación saboteador_score + observador_score ≤ 10 en PL/pgSQL
--     (doble barrera: el CHECK constraint ya lo bloquea en la tabla,
--      pero el RAISE EXCEPTION da un mensaje de error legible)
--   • Escribe formula_version = '1.0' al insertar
-- ================================================================

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
  -- Validar regla de negocio: saboteador + observador ≤ 10
  IF p_saboteador_score IS NOT NULL AND p_observador_score IS NOT NULL THEN
    IF p_saboteador_score + p_observador_score > 10 THEN
      RAISE EXCEPTION
        'saboteador_score + observador_score no puede superar 10 (recibido: % + % = %)',
        p_saboteador_score, p_observador_score,
        p_saboteador_score + p_observador_score
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  INSERT INTO checkins_semanales (
    user_id, week_start,
    ica_days, ica_barriers,
    be_energy, be_regulation,
    ini_score,
    semaphore, alerts, scores, dominant_domain,
    emocion_principal, saboteador_score, observador_score,
    formula_version,
    submitted_at
  ) VALUES (
    p_user_id, p_week_start,
    p_ica_days, p_ica_barriers,
    p_be_energy, p_be_regulation,
    p_ini_score,
    p_semaphore, p_alerts, p_scores, p_dominant,
    p_emocion_principal, p_saboteador_score, p_observador_score,
    '1.0',
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
    -- formula_version intencionalmente NO se actualiza en conflicto:
    -- preserva la versión con la que se calculó el ICS original
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


-- ================================================================
-- HIGH 7: tabla intervenciones
--
-- Registro de intervenciones clínicas y de coaching sobre un paciente.
-- Permite trazabilidad del acompañamiento profesional.
-- ================================================================

CREATE TABLE IF NOT EXISTS public.intervenciones (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id    uuid        NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  paciente_id       uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tipo              text        NOT NULL
    CHECK (tipo IN ('consulta', 'ajuste_plan', 'crisis', 'seguimiento', 'nota')),
  barrera           text,
  resumen           text        NOT NULL,
  accion_acordada   text,
  fecha_seguimiento date,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS intervenciones_paciente_fecha_idx
  ON public.intervenciones (paciente_id, created_at DESC);
CREATE INDEX IF NOT EXISTS intervenciones_profesional_fecha_idx
  ON public.intervenciones (profesional_id, created_at DESC);
CREATE INDEX IF NOT EXISTS intervenciones_seguimiento_idx
  ON public.intervenciones (fecha_seguimiento)
  WHERE fecha_seguimiento IS NOT NULL;

ALTER TABLE public.intervenciones ENABLE ROW LEVEL SECURITY;

-- Profesional: crea y gestiona sus intervenciones
CREATE POLICY "int_profesional_all"
  ON public.intervenciones FOR ALL
  USING  (auth.uid() = profesional_id)
  WITH CHECK (auth.uid() = profesional_id);

-- Paciente: solo lectura de sus propias intervenciones
CREATE POLICY "int_paciente_select"
  ON public.intervenciones FOR SELECT
  USING (auth.uid() = paciente_id);

-- Facilitador: lee intervenciones de pacientes en sus grupos activos
CREATE POLICY "int_facilitador_select"
  ON public.intervenciones FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.grupo_miembros gm
      JOIN public.grupos g ON g.id = gm.grupo_id
      WHERE gm.user_id = public.intervenciones.paciente_id
        AND g.facilitador_id = auth.uid()
        AND gm.activo = true
        AND g.activo  = true
    )
  );

DROP TRIGGER IF EXISTS intervenciones_updated_at ON public.intervenciones;
CREATE TRIGGER intervenciones_updated_at
  BEFORE UPDATE ON public.intervenciones
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

GRANT SELECT, INSERT, UPDATE ON public.intervenciones TO authenticated;


-- ================================================================
-- HIGH 8: fecha_inicio, fecha_fin, estado en grupos
--
-- Permite modelar la duración del programa y filtrar cohortes.
-- Estado default 'activo' para no romper grupos existentes.
-- ================================================================

ALTER TABLE public.grupos
  ADD COLUMN IF NOT EXISTS fecha_inicio date,
  ADD COLUMN IF NOT EXISTS fecha_fin    date,
  ADD COLUMN IF NOT EXISTS estado       text NOT NULL DEFAULT 'activo'
    CHECK (estado IN ('activo', 'completado', 'pausado'));


-- ================================================================
-- MEDIUM 1: tabla perfiles_clinicos (1:1 con pacientes)
--
-- Separa datos clínicos de la identidad del usuario.
-- Los campos en public.users (M012) se CONSERVAN por retrocompat
-- con el código existente. Migrar el código en sprint siguiente
-- y dropear columnas en M018.
-- ================================================================

CREATE TABLE IF NOT EXISTS public.perfiles_clinicos (
  paciente_id              uuid        PRIMARY KEY
    REFERENCES public.users(id) ON DELETE CASCADE,
  peso_inicial             numeric(5,2),
  altura                   numeric(5,2),
  toma_medicacion          boolean,
  detalle_medicacion       text,
  antec_tabaquismo         boolean NOT NULL DEFAULT false,
  antec_alcohol            boolean NOT NULL DEFAULT false,
  antec_otras_sustancias   boolean NOT NULL DEFAULT false,
  antec_cirugia            boolean NOT NULL DEFAULT false,
  antec_cancer             boolean NOT NULL DEFAULT false,
  antec_tiroides           boolean NOT NULL DEFAULT false,
  antec_otros              text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

-- Migrar datos clínicos existentes desde users
INSERT INTO public.perfiles_clinicos (
  paciente_id,
  peso_inicial, altura,
  toma_medicacion, detalle_medicacion,
  antec_tabaquismo, antec_alcohol, antec_otras_sustancias,
  antec_cirugia, antec_cancer, antec_tiroides, antec_otros
)
SELECT
  id,
  peso_inicial, altura,
  toma_medicacion, detalle_medicacion,
  antec_tabaquismo, antec_alcohol, antec_otras_sustancias,
  antec_cirugia, antec_cancer, antec_tiroides, antec_otros
FROM public.users
WHERE role = 'paciente'
ON CONFLICT (paciente_id) DO NOTHING;

ALTER TABLE public.perfiles_clinicos ENABLE ROW LEVEL SECURITY;

-- Paciente: lee y actualiza su propio perfil clínico
CREATE POLICY "pc_select_own"
  ON public.perfiles_clinicos FOR SELECT
  USING (auth.uid() = paciente_id);

CREATE POLICY "pc_insert_own"
  ON public.perfiles_clinicos FOR INSERT
  WITH CHECK (auth.uid() = paciente_id);

CREATE POLICY "pc_update_own"
  ON public.perfiles_clinicos FOR UPDATE
  USING  (auth.uid() = paciente_id)
  WITH CHECK (auth.uid() = paciente_id);

-- Facilitador / médica: lectura del perfil clínico de sus pacientes
CREATE POLICY "pc_profesional_select"
  ON public.perfiles_clinicos FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.grupo_miembros gm
      JOIN public.grupos g ON g.id = gm.grupo_id
      WHERE gm.user_id = public.perfiles_clinicos.paciente_id
        AND g.facilitador_id = auth.uid()
        AND gm.activo = true
        AND g.activo  = true
    )
  );

DROP TRIGGER IF EXISTS perfiles_clinicos_updated_at ON public.perfiles_clinicos;
CREATE TRIGGER perfiles_clinicos_updated_at
  BEFORE UPDATE ON public.perfiles_clinicos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

GRANT SELECT, INSERT, UPDATE ON public.perfiles_clinicos TO authenticated;


-- ================================================================
-- MEDIUM 2: conductas_ancla_historial (auditoría de cambios)
--
-- Registra cada cambio de estado o modificación de una conducta ancla.
-- Solo lectura para pacientes y facilitadores.
-- INSERT solo desde lógica de servidor (SECURITY DEFINER o service role).
-- ================================================================

CREATE TABLE IF NOT EXISTS public.conductas_ancla_historial (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conducta_id      uuid        NOT NULL
    REFERENCES public.conductas_ancla(id) ON DELETE CASCADE,
  user_id          uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  accion           text        NOT NULL
    CHECK (accion IN ('creada', 'activada', 'desactivada', 'modificada')),
  nombre_anterior  text,
  icono_anterior   text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cah_conducta_fecha_idx
  ON public.conductas_ancla_historial (conducta_id, created_at DESC);
CREATE INDEX IF NOT EXISTS cah_user_fecha_idx
  ON public.conductas_ancla_historial (user_id, created_at DESC);

ALTER TABLE public.conductas_ancla_historial ENABLE ROW LEVEL SECURITY;

-- Paciente: solo lectura de su propio historial (audit trail)
CREATE POLICY "cah_select_own"
  ON public.conductas_ancla_historial FOR SELECT
  USING (auth.uid() = user_id);

-- Facilitador: lectura del historial de sus pacientes
CREATE POLICY "cah_facilitador_select"
  ON public.conductas_ancla_historial FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.grupo_miembros gm
      JOIN public.grupos g ON g.id = gm.grupo_id
      WHERE gm.user_id = public.conductas_ancla_historial.user_id
        AND g.facilitador_id = auth.uid()
        AND gm.activo = true
        AND g.activo  = true
    )
  );

-- Solo SELECT: los INSERTs vienen de lógica de servidor (service role)
GRANT SELECT ON public.conductas_ancla_historial TO authenticated;


-- ================================================================
-- MEDIUM 3: grupo_equipo (equipo profesional por grupo)
--
-- Permite asignar coaches y médicas a grupos específicos,
-- independientemente del facilitador principal.
-- ================================================================

CREATE TABLE IF NOT EXISTS public.grupo_equipo (
  grupo_id        uuid    NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
  profesional_id  uuid    NOT NULL REFERENCES public.users(id)  ON DELETE CASCADE,
  rol_en_grupo    text    NOT NULL
    CHECK (rol_en_grupo IN ('coach', 'medica', 'facilitador')),
  activo          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (grupo_id, profesional_id)
);

CREATE INDEX IF NOT EXISTS grupo_equipo_profesional_activo_idx
  ON public.grupo_equipo (profesional_id, activo)
  WHERE activo = true;

ALTER TABLE public.grupo_equipo ENABLE ROW LEVEL SECURITY;

-- Facilitador del grupo: gestión completa de su equipo
CREATE POLICY "ge_facilitador_all"
  ON public.grupo_equipo FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.grupos g
      WHERE g.id = public.grupo_equipo.grupo_id
        AND g.facilitador_id = auth.uid()
    )
  );

-- Profesional: ve sus propias asignaciones activas
CREATE POLICY "ge_profesional_select"
  ON public.grupo_equipo FOR SELECT
  USING (auth.uid() = profesional_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.grupo_equipo TO authenticated;


-- ================================================================
-- MEDIUM 4: índices analíticos longitudinales
-- ================================================================

-- Evolución del semáforo ICS en el tiempo por paciente
CREATE INDEX IF NOT EXISTS cs_user_week_semaphore_idx
  ON public.checkins_semanales (user_id, week_start DESC, semaphore);

-- Patrones emocionales por paciente a lo largo del tiempo
CREATE INDEX IF NOT EXISTS cs_emocion_week_idx
  ON public.checkins_semanales (user_id, emocion_principal, week_start DESC)
  WHERE emocion_principal IS NOT NULL;

-- Evolución del puntaje saboteador
CREATE INDEX IF NOT EXISTS cs_saboteador_week_idx
  ON public.checkins_semanales (user_id, saboteador_score, week_start DESC)
  WHERE saboteador_score IS NOT NULL;

-- Alertas ICS no leídas por paciente y tipo
CREATE INDEX IF NOT EXISTS alerts_unread_patient_type_idx
  ON public.alerts (patient_id, type, created_at DESC)
  WHERE is_read = false;

-- Intervenciones con fecha de seguimiento asignada
-- (current_date no puede usarse en predicados de índice — no es IMMUTABLE)
CREATE INDEX IF NOT EXISTS intervenciones_seguimiento_idx2
  ON public.intervenciones (fecha_seguimiento ASC)
  WHERE fecha_seguimiento IS NOT NULL;


-- ================================================================
-- MEDIUM 5: deprecar vista_estado_pacientes (M001)
--
-- La vista original no tiene SECURITY INVOKER y expone datos de
-- todos los pacientes sin filtro RLS efectivo.
-- Reemplazada por vista_estado_pacientes_ics (M008, M009 SECURITY INVOKER).
-- Se revoca el grant y se renombra para evitar uso accidental.
-- El DROP definitivo se puede hacer en M018 una vez confirmado que
-- ningún código la referencia.
-- ================================================================

REVOKE ALL ON public.vista_estado_pacientes FROM authenticated;
REVOKE ALL ON public.vista_estado_pacientes FROM PUBLIC;

ALTER VIEW public.vista_estado_pacientes
  RENAME TO _deprecated_vista_estado_pacientes;


-- ================================================================
-- VERIFICACIÓN (comentada — ejecutar manualmente si es necesario)
-- ================================================================

-- Confirmar constraints en checkins_semanales:
-- SELECT conname, pg_get_constraintdef(oid)
--   FROM pg_constraint
--   WHERE conrelid = 'checkins_semanales'::regclass
--   AND contype = 'c'
--   ORDER BY conname;

-- Confirmar FKs migradas:
-- SELECT conname, conrelid::regclass, confrelid::regclass
--   FROM pg_constraint
--   WHERE contype = 'f'
--   AND conrelid IN (
--     'registros_diarios'::regclass,
--     'progreso_gimnasio'::regclass,
--     'feedback_respuestas'::regclass
--   );

-- Confirmar NOT NULL en registros_diarios:
-- SELECT column_name, is_nullable
--   FROM information_schema.columns
--   WHERE table_name = 'registros_diarios'
--   AND column_name IN ('energia_dia', 'animo_dia');

-- Confirmar nuevas tablas con RLS:
-- SELECT tablename, rowsecurity
--   FROM pg_tables
--   WHERE schemaname = 'public'
--   AND tablename IN (
--     'perfiles_clinicos', 'intervenciones',
--     'conductas_ancla_historial', 'grupo_equipo'
--   );
