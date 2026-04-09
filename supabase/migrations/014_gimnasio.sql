-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MIGRACIÓN 014: Sección Gimnasio / Entrenamiento Mental
--
-- Tablas:
--   • contenidos_gimnasio: catálogo de recursos (audios, videos, textos)
--   • progreso_gimnasio: tracking de consumo por usuario
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Catálogo de contenidos (gestionado manualmente o via admin)
CREATE TABLE IF NOT EXISTS contenidos_gimnasio (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo       text        NOT NULL,
  descripcion  text,
  tipo         text        NOT NULL CHECK (tipo IN ('audio', 'video', 'lectura')),
  -- URL del recurso (YouTube embed, archivo en Supabase Storage, etc.)
  url          text,
  -- Duración estimada en minutos
  duracion_min int         NOT NULL DEFAULT 5,
  -- Categoría temática
  categoria    text        NOT NULL CHECK (categoria IN ('conductas_ancla', 'saboteador_sabio', 'gimnasia_mental', 'habitos', 'general'))
    DEFAULT 'general',
  -- Orden de aparición
  orden        smallint    NOT NULL DEFAULT 0,
  activo       boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Progreso del usuario: qué contenidos completó y cuándo
CREATE TABLE IF NOT EXISTS progreso_gimnasio (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contenido_id  uuid        NOT NULL REFERENCES contenidos_gimnasio(id) ON DELETE CASCADE,
  completado_at timestamptz NOT NULL DEFAULT now(),
  -- Minutos realmente consumidos (puede ser menor a duracion_min si abandonó)
  minutos_vistos int        DEFAULT 0,
  UNIQUE (usuario_id, contenido_id)  -- un registro por usuario por contenido
);

-- Índices
CREATE INDEX IF NOT EXISTS progreso_gimnasio_usuario_idx
  ON progreso_gimnasio (usuario_id);
CREATE INDEX IF NOT EXISTS contenidos_gimnasio_activos_orden_idx
  ON contenidos_gimnasio (activo, orden)
  WHERE activo = true;

-- RLS
ALTER TABLE contenidos_gimnasio  ENABLE ROW LEVEL SECURITY;
ALTER TABLE progreso_gimnasio     ENABLE ROW LEVEL SECURITY;

-- Contenidos: lectura pública para usuarios autenticados
CREATE POLICY "cg_select_authenticated"
  ON contenidos_gimnasio FOR SELECT
  TO authenticated
  USING (activo = true);

-- Progreso: solo el propio usuario
CREATE POLICY "pg_select_own"
  ON progreso_gimnasio FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "pg_insert_own"
  ON progreso_gimnasio FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "pg_update_own"
  ON progreso_gimnasio FOR UPDATE
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

-- Grants
GRANT SELECT ON contenidos_gimnasio TO authenticated;
GRANT SELECT, INSERT, UPDATE ON progreso_gimnasio TO authenticated;

-- ── Seed inicial de contenidos ───────────────────────────────────
-- Contenidos placeholder hasta que se suban los reales.
-- Reemplazar url y duracion_min cuando estén listos.
INSERT INTO contenidos_gimnasio (titulo, descripcion, tipo, url, duracion_min, categoria, orden) VALUES
  ('¿Qué son las conductas ancla?', 'Entendé qué son las conductas ancla y por qué son clave para construir hábitos sólidos.', 'video', NULL, 5, 'conductas_ancla', 0),
  ('Saboteador y Sabio: ¿quién toma el control?', 'Conocé las dos voces internas que guían tus decisiones y cómo entrenar la voz del Sabio.', 'video', NULL, 7, 'saboteador_sabio', 1),
  ('¿Qué es la gimnasia mental?', 'Una introducción breve a los fundamentos del entrenamiento mental y sus beneficios.', 'video', NULL, 5, 'gimnasia_mental', 2),
  ('Respiración consciente', 'Ejercicio de audio guiado para calmar el sistema nervioso en menos de 5 minutos.', 'audio', NULL, 5, 'gimnasia_mental', 3),
  ('Construyendo hábitos: la regla del 2 minutos', 'Técnica práctica para instalar nuevas conductas sin esfuerzo.', 'lectura', NULL, 4, 'habitos', 4)
ON CONFLICT DO NOTHING;
