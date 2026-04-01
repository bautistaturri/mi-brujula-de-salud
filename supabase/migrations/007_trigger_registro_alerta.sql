-- ============================================================
-- MIGRACIÓN 007: Trigger de alerta automática en registro semanal
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================
--
-- Cuándo dispara: después de cada INSERT en registros_semanales
-- Condición: requiere_atencion = true (ánimo <= 2 ó sueño <= 2)
-- Efecto: inserta una alerta urgente de tipo 'riesgo_alto' para el
--         facilitador, evitando duplicados de la misma semana.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_registro_semanal_alerta()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo actuar cuando el registro requiere atención
  IF NEW.requiere_atencion = true THEN
    -- Evitar duplicado para la misma semana del mismo paciente
    IF NOT EXISTS (
      SELECT 1 FROM public.alertas
      WHERE user_id  = NEW.paciente_id
        AND tipo     = 'riesgo_alto'
        AND resuelta = false
        AND fecha >= NEW.semana_inicio::date
    ) THEN
      INSERT INTO public.alertas (
        user_id,
        tipo,
        descripcion,
        prioridad,
        fecha
      ) VALUES (
        NEW.paciente_id,
        'riesgo_alto',
        'Registro semanal crítico: ánimo o sueño muy bajos. Requiere seguimiento prioritario.',
        'urgente',
        current_date
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Crear el trigger (idempotente)
DROP TRIGGER IF EXISTS registro_semanal_alerta ON public.registros_semanales;

CREATE TRIGGER registro_semanal_alerta
  AFTER INSERT ON public.registros_semanales
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_registro_semanal_alerta();

-- ============================================================
-- VERIFICAR: para probar manualmente
-- INSERT INTO registros_semanales (..., requiere_atencion = true)
-- SELECT * FROM alertas WHERE tipo = 'riesgo_alto' ORDER BY created_at DESC LIMIT 5;
-- ============================================================
