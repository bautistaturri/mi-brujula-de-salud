-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MIGRACIÓN 011: Columna video_visto en logros_paciente
-- Trackea si el paciente ya vio el video de celebración del logro
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE logros_paciente
  ADD COLUMN IF NOT EXISTS video_visto boolean NOT NULL DEFAULT false;

-- Índice para filtrar logros con video no visto (notificaciones pendientes)
CREATE INDEX IF NOT EXISTS logros_paciente_video_pendiente_idx
  ON logros_paciente (paciente_id, video_visto)
  WHERE video_visto = false;
