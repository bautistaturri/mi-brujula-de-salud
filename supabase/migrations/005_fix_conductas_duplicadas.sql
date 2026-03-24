-- ============================================================
-- Fix: eliminar conductas_ancla duplicadas y agregar constraint
-- para evitar que vuelva a ocurrir.
-- ============================================================

-- 1. Eliminar duplicados conservando el registro con id más antiguo
--    (menor uuid lexicográficamente = primera inserción)
DELETE FROM public.conductas_ancla a
USING public.conductas_ancla b
WHERE a.user_id = b.user_id
  AND a.nombre   = b.nombre
  AND a.id       > b.id;

-- 2. Agregar constraint único para prevenir futuros duplicados
ALTER TABLE public.conductas_ancla
  ADD CONSTRAINT conductas_ancla_user_nombre_unique
  UNIQUE (user_id, nombre);

-- 3. Actualizar la función para ser idempotente con ON CONFLICT
--    (reemplaza la versión de la migración 004)
CREATE OR REPLACE FUNCTION public.crear_conductas_default(p_user_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO public.conductas_ancla (user_id, nombre, icono, orden) VALUES
    (p_user_id, 'Me hidraté correctamente', '💧', 0),
    (p_user_id, 'Hice actividad física',    '🏃', 1),
    (p_user_id, 'Dormí bien (7-8 hrs)',     '😴', 2),
    (p_user_id, 'Comí saludable',           '🥗', 3),
    (p_user_id, 'Tomé mi medicación',       '💊', 4)
  ON CONFLICT (user_id, nombre) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
