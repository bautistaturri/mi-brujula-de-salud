-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MIGRACIÓN 015: Feedback y encuestas
--
-- Estructura preparada para encuestas de:
--   1. Funcionamiento de la app
--   2. Mejora individual del usuario
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS feedback_respuestas (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Tipo de encuesta
  tipo          text        NOT NULL CHECK (tipo IN ('app', 'mejora_individual', 'general')),
  -- NPS o rating general (1-10)
  rating        smallint    CHECK (rating BETWEEN 1 AND 10),
  -- Qué funciona bien
  que_funciona  text,
  -- Qué mejorar
  que_mejorar   text,
  -- Comentario libre
  comentario    text,
  -- Para mejora individual: autoevaluación de progreso (1-5)
  progreso_percibido smallint CHECK (progreso_percibido BETWEEN 1 AND 5),
  -- Semana a la que refiere (puede ser null si es general)
  semana_inicio date,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE feedback_respuestas ENABLE ROW LEVEL SECURITY;

-- Usuario ve su propio feedback
CREATE POLICY "fb_select_own"
  ON feedback_respuestas FOR SELECT
  USING (auth.uid() = usuario_id);

-- Usuario inserta su propio feedback
CREATE POLICY "fb_insert_own"
  ON feedback_respuestas FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

-- Facilitador puede ver feedback de sus pacientes (para análisis)
CREATE POLICY "fb_facilitador_select"
  ON feedback_respuestas FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM grupo_miembros gm
      JOIN grupos g ON g.id = gm.grupo_id
      WHERE gm.user_id = feedback_respuestas.usuario_id
        AND g.facilitador_id = auth.uid()
        AND gm.activo = true
        AND g.activo = true
    )
  );

-- Índice para análisis por tipo
CREATE INDEX IF NOT EXISTS feedback_tipo_fecha_idx
  ON feedback_respuestas (tipo, created_at DESC);

GRANT SELECT, INSERT ON feedback_respuestas TO authenticated;
