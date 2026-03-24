-- ============================================================
-- MIGRACIÓN 003: RPCs necesarias para el check-in
-- ============================================================

-- ============================================================
-- RPC: save_checkin
-- Guarda un check-in del día. Lanza excepción si ya existe
-- ese turno para el día (doble-guard: la primera línea de
-- defensa es la redirect del server en checkin/page.tsx).
-- Llamada desde: CheckinWizard.tsx
-- ============================================================
CREATE OR REPLACE FUNCTION public.save_checkin(
  p_fecha date,
  p_turno text,
  p_conductas uuid[],
  p_iem smallint,
  p_emocion text,
  p_semaforo text,
  p_notas text DEFAULT NULL
)
RETURNS public.checkins
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_result  public.checkins;
BEGIN
  -- Verificar duplicado — doble-guard contra race conditions
  IF EXISTS (
    SELECT 1 FROM public.checkins
    WHERE user_id = v_user_id
      AND fecha = p_fecha
      AND turno = p_turno
  ) THEN
    RAISE EXCEPTION 'Ya existe un check-in para este turno del día';
  END IF;

  INSERT INTO public.checkins (
    user_id,
    fecha,
    turno,
    conductas_completadas,
    iem,
    emocion,
    semaforo,
    notas
  ) VALUES (
    v_user_id,
    p_fecha,
    p_turno,
    p_conductas,
    p_iem,
    p_emocion,
    p_semaforo,
    p_notas
  )
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;

-- Solo usuarios autenticados pueden llamar esta función
REVOKE ALL ON FUNCTION public.save_checkin FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_checkin TO authenticated;

-- ============================================================
-- RPC: get_facilitador_whatsapp
-- Devuelve el WhatsApp del facilitador asignado al paciente.
-- Necesita SECURITY DEFINER para evitar recursión de RLS en
-- la tabla users (facilitadores se buscan cruzando grupos).
-- Llamada desde: (patient)/checkin/page.tsx
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_facilitador_whatsapp(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_whatsapp text;
BEGIN
  SELECT u.whatsapp
  INTO v_whatsapp
  FROM public.grupo_miembros gm
  JOIN public.grupos g        ON g.id = gm.grupo_id
  JOIN public.users u         ON u.id = g.facilitador_id
  WHERE gm.user_id = p_user_id
    AND gm.activo  = true
    AND g.activo   = true
  LIMIT 1;

  RETURN v_whatsapp; -- NULL si no tiene facilitador asignado (no lanza error)
END;
$$;

-- Solo el propio usuario puede consultar su facilitador
REVOKE ALL ON FUNCTION public.get_facilitador_whatsapp FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_facilitador_whatsapp TO authenticated;
