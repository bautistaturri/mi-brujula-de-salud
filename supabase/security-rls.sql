-- =============================================================================
-- MI BRÚJULA DE SALUD — Row Level Security (RLS)
-- Ejecutar en Supabase SQL Editor (Dashboard → SQL Editor → New query)
--
-- IMPORTANTE: ejecutar en este orden.
-- Verificar que las tablas existen antes de correr las policies.
-- Las funciones SECURITY DEFINER bypasan RLS — revisar con cuidado.
-- =============================================================================


-- =============================================================================
-- 0. HABILITAR RLS EN TODAS LAS TABLAS
-- =============================================================================

ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins            ENABLE ROW LEVEL SECURITY;
ALTER TABLE conductas_ancla     ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupo_miembros      ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_semanales ENABLE ROW LEVEL SECURITY;
ALTER TABLE logros_paciente     ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- 1. TABLA: users
-- =============================================================================

-- Limpiar policies existentes
DROP POLICY IF EXISTS "users_select_own"           ON users;
DROP POLICY IF EXISTS "users_select_facilitador"   ON users;
DROP POLICY IF EXISTS "users_update_own"           ON users;

-- El usuario puede leer su propio perfil
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- El facilitador puede leer perfiles de pacientes en sus grupos
CREATE POLICY "users_select_facilitador"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM grupo_miembros gm
      JOIN grupos g ON g.id = gm.grupo_id
      WHERE gm.user_id = users.id
        AND g.facilitador_id = auth.uid()
        AND gm.activo = true
    )
  );

-- El usuario solo puede actualizar su propio perfil
-- WITH CHECK previene que alguien cambie el id a otro usuario
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING  (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INSERT lo maneja el trigger de auth (SECURITY DEFINER) — no exponer a clientes


-- =============================================================================
-- 2. TABLA: checkins
-- =============================================================================

DROP POLICY IF EXISTS "checkins_select_own"          ON checkins;
DROP POLICY IF EXISTS "checkins_select_facilitador"  ON checkins;
DROP POLICY IF EXISTS "checkins_insert_own"          ON checkins;
DROP POLICY IF EXISTS "checkins_update_own"          ON checkins;

-- Paciente: ver sus propios check-ins
CREATE POLICY "checkins_select_own"
  ON checkins FOR SELECT
  USING (auth.uid() = user_id);

-- Facilitador: ver check-ins de pacientes en sus grupos
CREATE POLICY "checkins_select_facilitador"
  ON checkins FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM grupo_miembros gm
      JOIN grupos g ON g.id = gm.grupo_id
      WHERE gm.user_id = checkins.user_id
        AND g.facilitador_id = auth.uid()
    )
  );

-- Solo el propio paciente puede insertar sus check-ins
-- WITH CHECK evita que inserten con user_id de otro
CREATE POLICY "checkins_insert_own"
  ON checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Solo el propio paciente puede actualizar sus check-ins
CREATE POLICY "checkins_update_own"
  ON checkins FOR UPDATE
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- =============================================================================
-- 3. TABLA: conductas_ancla
-- =============================================================================

DROP POLICY IF EXISTS "conductas_select_own"  ON conductas_ancla;
DROP POLICY IF EXISTS "conductas_insert_own"  ON conductas_ancla;
DROP POLICY IF EXISTS "conductas_update_own"  ON conductas_ancla;
DROP POLICY IF EXISTS "conductas_delete_own"  ON conductas_ancla;

CREATE POLICY "conductas_select_own"
  ON conductas_ancla FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "conductas_insert_own"
  ON conductas_ancla FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "conductas_update_own"
  ON conductas_ancla FOR UPDATE
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "conductas_delete_own"
  ON conductas_ancla FOR DELETE
  USING (auth.uid() = user_id);


-- =============================================================================
-- 4. TABLA: grupos
-- =============================================================================

DROP POLICY IF EXISTS "grupos_select_facilitador"  ON grupos;
DROP POLICY IF EXISTS "grupos_select_miembro"      ON grupos;
DROP POLICY IF EXISTS "grupos_insert_facilitador"  ON grupos;
DROP POLICY IF EXISTS "grupos_update_facilitador"  ON grupos;

-- Facilitador ve sus propios grupos
CREATE POLICY "grupos_select_facilitador"
  ON grupos FOR SELECT
  USING (auth.uid() = facilitador_id);

-- Paciente puede ver grupos de los que es miembro
-- (necesario para que get_facilitador_whatsapp funcione con RLS)
CREATE POLICY "grupos_select_miembro"
  ON grupos FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM grupo_miembros gm
      WHERE gm.grupo_id = grupos.id
        AND gm.user_id = auth.uid()
        AND gm.activo = true
    )
  );

-- Solo el facilitador puede crear grupos (con su propio id)
CREATE POLICY "grupos_insert_facilitador"
  ON grupos FOR INSERT
  WITH CHECK (auth.uid() = facilitador_id);

-- Solo el facilitador puede actualizar sus grupos
CREATE POLICY "grupos_update_facilitador"
  ON grupos FOR UPDATE
  USING  (auth.uid() = facilitador_id)
  WITH CHECK (auth.uid() = facilitador_id);


-- =============================================================================
-- 5. TABLA: grupo_miembros
-- =============================================================================

DROP POLICY IF EXISTS "gm_select_facilitador"    ON grupo_miembros;
DROP POLICY IF EXISTS "gm_select_paciente_own"   ON grupo_miembros;
DROP POLICY IF EXISTS "gm_insert_facilitador"    ON grupo_miembros;
DROP POLICY IF EXISTS "gm_update_facilitador"    ON grupo_miembros;
DROP POLICY IF EXISTS "gm_delete_facilitador"    ON grupo_miembros;

-- Facilitador puede ver los miembros de sus grupos
CREATE POLICY "gm_select_facilitador"
  ON grupo_miembros FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM grupos g
      WHERE g.id = grupo_miembros.grupo_id
        AND g.facilitador_id = auth.uid()
    )
  );

-- Paciente puede ver su propia membresía
CREATE POLICY "gm_select_paciente_own"
  ON grupo_miembros FOR SELECT
  USING (auth.uid() = user_id);

-- Solo el facilitador puede agregar pacientes a SUS grupos
CREATE POLICY "gm_insert_facilitador"
  ON grupo_miembros FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM grupos g
      WHERE g.id = grupo_miembros.grupo_id
        AND g.facilitador_id = auth.uid()
    )
  );

-- Solo el facilitador puede actualizar membresías en sus grupos
CREATE POLICY "gm_update_facilitador"
  ON grupo_miembros FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM grupos g
      WHERE g.id = grupo_miembros.grupo_id
        AND g.facilitador_id = auth.uid()
    )
  );

-- Solo el facilitador puede eliminar miembros de sus grupos
CREATE POLICY "gm_delete_facilitador"
  ON grupo_miembros FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM grupos g
      WHERE g.id = grupo_miembros.grupo_id
        AND g.facilitador_id = auth.uid()
    )
  );


-- =============================================================================
-- 6. TABLA: alertas
-- =============================================================================

DROP POLICY IF EXISTS "alertas_select_paciente"     ON alertas;
DROP POLICY IF EXISTS "alertas_select_facilitador"  ON alertas;
DROP POLICY IF EXISTS "alertas_insert_own"          ON alertas;
DROP POLICY IF EXISTS "alertas_update_facilitador"  ON alertas;

-- Paciente puede ver sus propias alertas
CREATE POLICY "alertas_select_paciente"
  ON alertas FOR SELECT
  USING (auth.uid() = user_id);

-- Facilitador puede ver alertas de pacientes en sus grupos
CREATE POLICY "alertas_select_facilitador"
  ON alertas FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM grupo_miembros gm
      JOIN grupos g ON g.id = gm.grupo_id
      WHERE gm.user_id = alertas.user_id
        AND g.facilitador_id = auth.uid()
    )
  );

-- Las alertas se crean automáticamente via trigger (service_role).
-- Si se crean desde el cliente, solo el propio usuario puede insertarlas.
CREATE POLICY "alertas_insert_own"
  ON alertas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Solo el facilitador puede resolver (UPDATE) alertas de sus pacientes
CREATE POLICY "alertas_update_facilitador"
  ON alertas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM grupo_miembros gm
      JOIN grupos g ON g.id = gm.grupo_id
      WHERE gm.user_id = alertas.user_id
        AND g.facilitador_id = auth.uid()
    )
  );


-- =============================================================================
-- 7. TABLA: registros_semanales
-- =============================================================================

DROP POLICY IF EXISTS "registros_select_own"          ON registros_semanales;
DROP POLICY IF EXISTS "registros_select_facilitador"  ON registros_semanales;
DROP POLICY IF EXISTS "registros_insert_own"          ON registros_semanales;

-- Paciente ve sus propios registros
CREATE POLICY "registros_select_own"
  ON registros_semanales FOR SELECT
  USING (auth.uid() = paciente_id);

-- Facilitador ve registros de pacientes en sus grupos (solo lectura)
CREATE POLICY "registros_select_facilitador"
  ON registros_semanales FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM grupo_miembros gm
      JOIN grupos g ON g.id = gm.grupo_id
      WHERE gm.user_id = registros_semanales.paciente_id
        AND g.facilitador_id = auth.uid()
    )
  );

-- Solo el propio paciente puede insertar sus registros semanales
CREATE POLICY "registros_insert_own"
  ON registros_semanales FOR INSERT
  WITH CHECK (auth.uid() = paciente_id);

-- No se permite UPDATE desde el cliente (los registros son inmutables una vez enviados)


-- =============================================================================
-- 8. TABLA: logros_paciente
-- =============================================================================

DROP POLICY IF EXISTS "logros_select_own"          ON logros_paciente;
DROP POLICY IF EXISTS "logros_select_facilitador"  ON logros_paciente;
DROP POLICY IF EXISTS "logros_insert_own"          ON logros_paciente;

-- Paciente ve sus propios logros
CREATE POLICY "logros_select_own"
  ON logros_paciente FOR SELECT
  USING (auth.uid() = paciente_id);

-- Facilitador ve logros de pacientes en sus grupos
CREATE POLICY "logros_select_facilitador"
  ON logros_paciente FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM grupo_miembros gm
      JOIN grupos g ON g.id = gm.grupo_id
      WHERE gm.user_id = logros_paciente.paciente_id
        AND g.facilitador_id = auth.uid()
    )
  );

-- Solo el propio paciente puede insertar sus logros (desde StepperForm)
CREATE POLICY "logros_insert_own"
  ON logros_paciente FOR INSERT
  WITH CHECK (auth.uid() = paciente_id);

-- Paciente puede marcar video_visto = true en sus propios logros
-- Solo se permite UPDATE y solo del campo video_visto (no de logro_key ni desbloqueado_at)
-- La restricción de campo se implementa en la API route / componente, no aquí,
-- porque PostgreSQL RLS no filtra por columna. La seguridad real es que solo se
-- puede actualizar filas propias.
CREATE POLICY "logros_update_video_visto"
  ON logros_paciente FOR UPDATE
  USING (auth.uid() = paciente_id)
  WITH CHECK (auth.uid() = paciente_id);

-- Prevenir duplicados de logros (evita race condition en StepperForm)
ALTER TABLE logros_paciente
  DROP CONSTRAINT IF EXISTS logros_paciente_unique_key,
  ADD CONSTRAINT logros_paciente_unique_key UNIQUE (paciente_id, logro_key);


-- =============================================================================
-- 9. FUNCIÓN: buscar_paciente_por_email
-- Reemplaza la búsqueda directa en la tabla users desde GruposManager.
-- SECURITY DEFINER: se ejecuta con permisos del owner (postgres), no del caller.
-- Solo retorna id + nombre de usuarios con role='paciente'.
-- Llamar: supabase.rpc('buscar_paciente_por_email', { p_email: '...' })
-- =============================================================================

CREATE OR REPLACE FUNCTION buscar_paciente_por_email(p_email text)
RETURNS TABLE(id uuid, nombre text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo puede ser llamada por usuarios autenticados con role=facilitador
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
      AND users.role = 'facilitador'
  ) THEN
    RAISE EXCEPTION 'Acceso no autorizado';
  END IF;

  RETURN QUERY
    SELECT u.id, u.nombre
    FROM users u
    WHERE u.email = lower(trim(p_email))
      AND u.role = 'paciente';
END;
$$;

-- Revocar acceso público y conceder solo a authenticated
REVOKE ALL ON FUNCTION buscar_paciente_por_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION buscar_paciente_por_email(text) TO authenticated;


-- =============================================================================
-- 10. VISTA: vista_estado_pacientes
-- Si la vista es SECURITY DEFINER (comportamiento por defecto en Supabase),
-- bypasa RLS de las tablas subyacentes. Agregar restricción explícita.
-- =============================================================================

-- Opción A: Recrear la vista con SECURITY INVOKER (usa RLS del caller)
-- Descomentar si la vista existe y fue creada con permisos de postgres:
--
-- ALTER VIEW vista_estado_pacientes SET (security_invoker = true);
--
-- Opción B (más segura): usar una función RPC en lugar de la vista directa.
-- Ver función get_estado_pacientes_facilitador() si ya existe.

-- Mientras tanto, asegurarse de que el acceso a la vista siempre filtre
-- por grupos del facilitador (ya lo hace dashboard/page.tsx con .in('grupo_id', ...))


-- =============================================================================
-- 11. PERMISOS DE TABLAS (por si no están otorgados)
-- =============================================================================

GRANT SELECT, INSERT, UPDATE ON users               TO authenticated;
GRANT SELECT, INSERT, UPDATE ON checkins            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON conductas_ancla TO authenticated;
GRANT SELECT, INSERT, UPDATE ON grupos              TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON grupo_miembros TO authenticated;
GRANT SELECT, INSERT, UPDATE ON alertas             TO authenticated;
GRANT SELECT, INSERT ON registros_semanales         TO authenticated;
GRANT SELECT, INSERT, UPDATE ON logros_paciente     TO authenticated;

-- Las sequences para auto-increment (si usan SERIAL)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;


-- =============================================================================
-- 12. VERIFICAR RLS HABILITADO
-- Ejecutar para confirmar que todas las tablas tienen RLS activo:
-- =============================================================================

-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
