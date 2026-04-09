-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MIGRACIÓN 013: Emoción principal + Mental Fitness en check-in semanal
--
-- Agrega:
--   • emocion_principal: la emoción predominante de la semana (Brújula Emocional)
--   • saboteador_score: escala 1-7 del Saboteador (Mental Fitness)
--   • observador_score: escala 1-7 del Observador (Mental Fitness)
--
-- ini_score se MANTIENE para no romper el motor ICS ni los tests existentes.
-- El ini_score se deriva de saboteador/observador en la capa de aplicación.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE checkins_semanales
  ADD COLUMN IF NOT EXISTS emocion_principal text
    CHECK (emocion_principal IN ('enojado', 'triste', 'miedo', 'sorpresa', 'asco', 'alegre'));

ALTER TABLE checkins_semanales
  ADD COLUMN IF NOT EXISTS saboteador_score smallint
    CHECK (saboteador_score BETWEEN 1 AND 7);

ALTER TABLE checkins_semanales
  ADD COLUMN IF NOT EXISTS observador_score smallint
    CHECK (observador_score BETWEEN 1 AND 7);

-- Índice útil para análisis de patrones emocionales
CREATE INDEX IF NOT EXISTS checkins_semanales_emocion_idx
  ON checkins_semanales (user_id, emocion_principal)
  WHERE emocion_principal IS NOT NULL;
