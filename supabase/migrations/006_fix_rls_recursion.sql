-- ============================================================
-- Fix: recursión infinita en RLS entre grupos y grupo_miembros
--
-- Cadena problemática:
--   checkins policy → grupo_miembros → grupos policy
--   → grupo_miembros (otra vez) → loop infinito
--
-- Solución: función SECURITY DEFINER que consulta grupo_miembros
-- sin aplicar RLS, rompiendo el ciclo.
-- ============================================================

-- Función que verifica membresía sin disparar RLS en grupo_miembros
CREATE OR REPLACE FUNCTION public.es_miembro_grupo(p_grupo_id uuid, p_user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.grupo_miembros
    WHERE grupo_id = p_grupo_id
      AND user_id  = p_user_id
      AND activo   = true
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.es_miembro_grupo TO authenticated;

-- Reemplazar la policy recursiva en grupos
DROP POLICY IF EXISTS "Pacientes ven los grupos a los que pertenecen" ON public.grupos;

CREATE POLICY "Pacientes ven los grupos a los que pertenecen"
  ON public.grupos FOR SELECT
  USING (public.es_miembro_grupo(id, auth.uid()));
