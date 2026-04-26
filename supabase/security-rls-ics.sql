-- =============================================================================
-- MI BRÚJULA DE SALUD — RLS para tablas ICS (migración 007+)
-- Ejecutar DESPUÉS de security-rls.sql y DESPUÉS de 007_ics_model.sql
--
-- Tablas cubiertas: checkins_semanales, alerts, rachas, registros_diarios
-- =============================================================================


-- =============================================================================
-- 1. TABLA: checkins_semanales (modelo ICS activo)
-- =============================================================================

ALTER TABLE checkins_semanales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cs_select_own"          ON checkins_semanales;
DROP POLICY IF EXISTS "cs_select_facilitador"  ON checkins_semanales;
DROP POLICY IF EXISTS "cs_insert_own"          ON checkins_semanales;
DROP POLICY IF EXISTS "cs_update_own"          ON checkins_semanales;

-- Paciente: ver sus propios check-ins semanales
CREATE POLICY "cs_select_own"
  ON checkins_semanales FOR SELECT
  USING (auth.uid() = user_id);

-- Facilitador: ver check-ins semanales de pacientes en sus grupos
CREATE POLICY "cs_select_facilitador"
  ON checkins_semanales FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM grupo_miembros gm
      JOIN grupos g ON g.id = gm.grupo_id
      WHERE gm.user_id = checkins_semanales.user_id
        AND g.facilitador_id = auth.uid()
        AND gm.activo = true
    )
  );

-- Solo el paciente puede insertar sus propios check-ins (o via RPC save_checkin_ics)
CREATE POLICY "cs_insert_own"
  ON checkins_semanales FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- El paciente puede actualizar sus propios check-ins (en caso de reenvío)
CREATE POLICY "cs_update_own"
  ON checkins_semanales FOR UPDATE
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON checkins_semanales TO authenticated;


-- =============================================================================
-- 2. TABLA: alerts (alertas ICS generadas por cron)
-- =============================================================================

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "alerts_select_facilitador"  ON alerts;
DROP POLICY IF EXISTS "alerts_update_facilitador"  ON alerts;

-- Facilitador: ver alertas de pacientes en sus grupos
CREATE POLICY "alerts_select_facilitador"
  ON alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM grupo_miembros gm
      JOIN grupos g ON g.id = gm.grupo_id
      WHERE gm.user_id = alerts.patient_id
        AND g.facilitador_id = auth.uid()
        AND gm.activo = true
    )
  );

-- Facilitador: marcar alertas como leídas (UPDATE is_read)
-- El campo patient_id no puede cambiarse (WITH CHECK garantiza que siga en su grupo)
CREATE POLICY "alerts_update_facilitador"
  ON alerts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM grupo_miembros gm
      JOIN grupos g ON g.id = gm.grupo_id
      WHERE gm.user_id = alerts.patient_id
        AND g.facilitador_id = auth.uid()
        AND gm.activo = true
    )
  );

-- INSERT solo via service_role (cron job con admin client). Los clientes no insertan alertas.
-- Sin política INSERT para authenticated → solo service_role puede insertar.

GRANT SELECT, UPDATE ON alerts TO authenticated;


-- =============================================================================
-- 3. TABLA: rachas (racha de semanas verdes consecutivas)
-- =============================================================================

ALTER TABLE rachas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rachas_select_own"          ON rachas;
DROP POLICY IF EXISTS "rachas_select_facilitador"  ON rachas;
DROP POLICY IF EXISTS "rachas_upsert_own"          ON rachas;

-- Paciente: ver su propia racha
CREATE POLICY "rachas_select_own"
  ON rachas FOR SELECT
  USING (auth.uid() = paciente_id);

-- Facilitador: ver rachas de pacientes en sus grupos
CREATE POLICY "rachas_select_facilitador"
  ON rachas FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM grupo_miembros gm
      JOIN grupos g ON g.id = gm.grupo_id
      WHERE gm.user_id = rachas.paciente_id
        AND g.facilitador_id = auth.uid()
        AND gm.activo = true
    )
  );

-- La racha se actualiza via RPC save_checkin_ics (SECURITY DEFINER).
-- Si se gestiona desde el cliente, solo el propio paciente puede actualizar.
CREATE POLICY "rachas_upsert_own"
  ON rachas FOR INSERT
  WITH CHECK (auth.uid() = paciente_id);

CREATE POLICY "rachas_update_own"
  ON rachas FOR UPDATE
  USING (auth.uid() = paciente_id)
  WITH CHECK (auth.uid() = paciente_id);

GRANT SELECT, INSERT, UPDATE ON rachas TO authenticated;


-- =============================================================================
-- 4. TABLA: registros_diarios
-- =============================================================================

ALTER TABLE registros_diarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rd_select_own"          ON registros_diarios;
DROP POLICY IF EXISTS "rd_select_facilitador"  ON registros_diarios;
DROP POLICY IF EXISTS "rd_insert_own"          ON registros_diarios;

-- Paciente: ver sus propios registros diarios
CREATE POLICY "rd_select_own"
  ON registros_diarios FOR SELECT
  USING (auth.uid() = paciente_id);

-- Facilitador: ver registros diarios de pacientes en sus grupos
CREATE POLICY "rd_select_facilitador"
  ON registros_diarios FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM grupo_miembros gm
      JOIN grupos g ON g.id = gm.grupo_id
      WHERE gm.user_id = registros_diarios.paciente_id
        AND g.facilitador_id = auth.uid()
        AND gm.activo = true
    )
  );

-- Solo el paciente puede insertar sus registros diarios
CREATE POLICY "rd_insert_own"
  ON registros_diarios FOR INSERT
  WITH CHECK (auth.uid() = paciente_id);

-- Los registros diarios son inmutables una vez enviados (sin UPDATE policy)

GRANT SELECT, INSERT ON registros_diarios TO authenticated;


-- =============================================================================
-- 5. TABLA: logros_paciente — actualizar para incluir registros diarios
-- (La política de INSERT en security-rls.sql solo cubre la RPC de registros semanales.
--  El endpoint /api/checkin/diario también inserta logros via service_role, lo cual
--  bypasa RLS por diseño. Esta política es para inserts directos del cliente.)
-- =============================================================================

-- Ya definida en security-rls.sql. No duplicar.


-- =============================================================================
-- 6. VERIFICAR RLS HABILITADO EN TODAS LAS TABLAS NUEVAS
-- Ejecutar en Supabase SQL Editor para confirmar:
-- =============================================================================

-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN ('checkins_semanales', 'alerts', 'rachas', 'registros_diarios')
-- ORDER BY tablename;
