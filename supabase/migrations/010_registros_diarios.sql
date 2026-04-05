-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MIGRACIÓN 010: Registro diario liviano
-- Captura rápida del estado del día. Alimenta el check-in semanal ICS.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ── Tabla principal ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS registros_diarios (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fecha        date        NOT NULL,
  energia_dia  int         CHECK (energia_dia BETWEEN 1 AND 5),
  animo_dia    int         CHECK (animo_dia BETWEEN 1 AND 5),
  -- Array de 5 booleans: ¿cumplió cada conducta ancla hoy?
  conductas_hoy boolean[]  NOT NULL DEFAULT '{}',
  -- Nota libre, máx 280 chars (longitud de tweet)
  nota_libre   text        CHECK (char_length(nota_libre) <= 280),
  created_at   timestamptz NOT NULL DEFAULT now(),

  UNIQUE (paciente_id, fecha)  -- 1 registro por día por paciente
);

-- ── Índices ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS registros_diarios_paciente_fecha_idx
  ON registros_diarios (paciente_id, fecha DESC);

-- ── updated_at trigger ───────────────────────────────────────────
-- No agrega columna updated_at porque este registro es inmutable
-- (solo se puede registrar una vez por día; el UPDATE es para el mismo día)

-- ── RLS ──────────────────────────────────────────────────────────
ALTER TABLE registros_diarios ENABLE ROW LEVEL SECURITY;

-- Paciente: lee solo sus registros
CREATE POLICY "rd_select_own"
  ON registros_diarios FOR SELECT
  USING (auth.uid() = paciente_id);

-- Paciente: inserta solo para sí mismo
CREATE POLICY "rd_insert_own"
  ON registros_diarios FOR INSERT
  WITH CHECK (auth.uid() = paciente_id);

-- Paciente: actualiza solo registros del día actual
-- (permite corregir si se equivocó en el mismo día)
CREATE POLICY "rd_update_same_day"
  ON registros_diarios FOR UPDATE
  USING (auth.uid() = paciente_id AND fecha = current_date)
  WITH CHECK (auth.uid() = paciente_id AND fecha = current_date);

-- Nadie borra (soft delete vía UPDATE si fuera necesario)
-- No se crea política DELETE → nadie puede borrar

-- Facilitador: lee registros de pacientes en sus grupos activos
CREATE POLICY "rd_facilitador_select"
  ON registros_diarios FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM grupo_miembros gm
      JOIN grupos g ON g.id = gm.grupo_id
      WHERE gm.user_id = registros_diarios.paciente_id
        AND g.facilitador_id = auth.uid()
        AND gm.activo = true
        AND g.activo = true
    )
  );

-- ── Grant ────────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE ON registros_diarios TO authenticated;
