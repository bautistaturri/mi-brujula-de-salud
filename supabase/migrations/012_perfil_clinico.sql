-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MIGRACIÓN 012: Datos clínicos basales en users
-- Agrega campos de onboarding clínico sin romper usuarios existentes.
-- Todos los campos son opcionales (nullable) para backward compat.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Datos físicos
ALTER TABLE users ADD COLUMN IF NOT EXISTS peso_inicial     numeric(5,1);   -- kg
ALTER TABLE users ADD COLUMN IF NOT EXISTS altura           smallint;        -- cm

-- Medicación
ALTER TABLE users ADD COLUMN IF NOT EXISTS toma_medicacion  boolean;         -- null = no respondido, true/false
ALTER TABLE users ADD COLUMN IF NOT EXISTS detalle_medicacion text;          -- cuál/es medicaciones

-- Antecedentes clínicos (booleanos individuales para queries simples)
ALTER TABLE users ADD COLUMN IF NOT EXISTS antec_tabaquismo boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS antec_alcohol    boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS antec_otras_sustancias boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS antec_cirugia    boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS antec_cancer     boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS antec_tiroides   boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS antec_otros      text;            -- texto libre para otros antecedentes

-- Flag: completó el paso clínico del onboarding (para saber si saltó ese paso)
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_clinico_completado boolean DEFAULT false;
