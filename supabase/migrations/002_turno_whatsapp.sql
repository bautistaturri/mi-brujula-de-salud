-- ============================================================
-- MIGRACIÓN 002: Check-in 2x por día + WhatsApp de facilitador
-- ============================================================

-- 1. Número de WhatsApp del facilitador (ej: 5491112345678)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS whatsapp text;

-- 2. Turno del check-in: 'manana' o 'noche'
ALTER TABLE public.checkins ADD COLUMN IF NOT EXISTS turno text NOT NULL DEFAULT 'noche'
  CHECK (turno IN ('manana', 'noche'));

-- 3. Reemplazar la constraint única (user_id, fecha) → (user_id, fecha, turno)
ALTER TABLE public.checkins DROP CONSTRAINT IF EXISTS checkins_user_id_fecha_key;
ALTER TABLE public.checkins ADD CONSTRAINT checkins_user_fecha_turno_key
  UNIQUE (user_id, fecha, turno);

-- 4. Actualizar la vista para mostrar el check-in más reciente del día (prioriza noche)
CREATE OR REPLACE VIEW public.vista_estado_pacientes AS
SELECT
  u.id,
  u.nombre,
  u.email,
  u.avatar_url,
  c.fecha AS ultimo_checkin,
  c.iem,
  c.emocion,
  c.semaforo,
  array_length(c.conductas_completadas, 1) AS conductas_completadas,
  public.calcular_racha(u.id) AS racha_actual,
  public.calcular_score_riesgo(u.id) AS score_riesgo,
  (SELECT count(*) FROM public.alertas a
   WHERE a.user_id = u.id AND a.resuelta = false) AS alertas_pendientes,
  gm.grupo_id
FROM public.users u
LEFT JOIN LATERAL (
  SELECT * FROM public.checkins
  WHERE user_id = u.id AND fecha = current_date
  ORDER BY CASE turno WHEN 'noche' THEN 1 WHEN 'manana' THEN 2 END
  LIMIT 1
) c ON true
JOIN public.grupo_miembros gm ON gm.user_id = u.id
WHERE u.role = 'paciente';

GRANT SELECT ON public.vista_estado_pacientes TO authenticated;
