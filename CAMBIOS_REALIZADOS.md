# CAMBIOS REALIZADOS — Mi Brújula de Salud
**Última actualización:** 2026-03-24

---

## SESIÓN 1 — Auditoría inicial + fixes base

### Auditoría
- ✅ Generado `AUDITORIA_DIAGNOSTICO.md` con diagnóstico completo del proyecto

### Contenido falso eliminado
- ✅ `Testimonials.tsx` — Eliminados 3 testimonios ficticios; reemplazados por placeholder honesto con CTA de contacto
- ✅ `SocialProof.tsx` — Eliminadas 6 instituciones ficticias; componente oculto hasta tener instituciones reales (`return null`)
- ✅ `Hero.tsx` — Eliminadas estadísticas inventadas ("500+", "95%", "48h"); reemplazadas por propuestas de valor reales

### Seguridad
- ✅ `.gitignore` creado — `.env.local` y credenciales excluidas del repositorio
- ✅ Verificado: `.env.local` NO estaba trackeado en git

### Producción
- ✅ `src/app/not-found.tsx` creado — Página 404 personalizada con branding y links de navegación

### Calidad de código
- ✅ `src/types/database.ts` — Eliminada función `calcularSemaforo` duplicada
- ✅ `CheckinWizard.tsx` — Texto "mi médica" → "mi profesional de salud" (gender-neutral)

---

## SESIÓN 2 — Fixes post-auditoría (todos los bloques)

### BLOQUE 1 — Crítico

#### FIX 1.1 — Migration 003 con RPCs faltantes
- ✅ `supabase/migrations/003_rpcs_checkin.sql` — Actualizado con implementación correcta:
  - `save_checkin`: RAISE EXCEPTION en duplicado + RETURNS `checkins` (no void)
  - `get_facilitador_whatsapp`: retorna NULL si no hay facilitador (sin error)
  - Ambas con `SECURITY DEFINER` y permisos restringidos a `authenticated`
- ⚠️ **Acción requerida**: Ejecutar esta migración en Supabase Dashboard → SQL Editor

#### FIX 1.2 — .gitignore verificado
- ✅ `.gitignore` contiene `.env.local`
- ✅ `.env.local` NO está trackeado en git (`git ls-files` confirmado)

---

### BLOQUE 2 — Importante

#### FIX 2.1 — Contenido falso (ya realizado en Sesión 1)
- ✅ Testimonials, SocialProof, Hero — completados

#### FIX 2.2 — Página 404 (ya realizada en Sesión 1)
- ✅ `src/app/not-found.tsx` — completado

#### FIX 2.3 — next.config.mjs para producción
- ✅ `next.config.mjs` — `allowedOrigins` ahora incluye `NEXT_PUBLIC_APP_URL` via variable de entorno

#### FIX 2.4 — calcularSemaforo unificada
- ✅ `src/types/database.ts` — Re-exporta `calcularSemaforo` desde `@/lib/utils` (función canónica sigue en `utils.ts`)

#### FIX 2.5 — Manejo de errores Supabase
- ✅ `src/app/(patient)/inicio/page.tsx` — Agrega chequeo de error en `profileRes.error` (redirect a login)
- ✅ `src/app/(patient)/historial/page.tsx` — Agrega error state visual si falla la query de checkins
- ✅ `src/app/dashboard/alertas/page.tsx` — Agrega error states en queries críticas
- ✅ `src/app/dashboard/grupos/page.tsx` — Agrega error state en query de grupos
- ✅ Corregido bug de build: `Set` spread (`[...new Set()]`) → `Array.from(new Set())` en 2 archivos

#### FIX 2.6 — Empty states
- ✅ AlertasList: ya tenía empty state ("No hay alertas pendientes 🟢")
- ✅ GruposManager: ya tenía empty state ("Crea tu primer grupo para empezar")
- ✅ GrupoOverview: ya tenía empty state para grupos vacíos y grupos sin pacientes
- ✅ HistorialPaciente: ya tenía empty state ("Aún no hay registros 📭")

---

### BLOQUE 3 — Tests

#### FIX 3.1 — Setup Vitest
- ✅ Instalado: `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`
- ✅ `vitest.config.ts` creado con alias `@` apuntando a `./src`
- ✅ Scripts agregados en `package.json`: `"test": "vitest run"`, `"test:watch": "vitest"`

#### FIX 3.2 — Tests unitarios
- ✅ `src/lib/__tests__/utils.test.ts` — 11 tests pasando ✅
  - `calcularSemaforo`: 5 casos (verde, rojo por IEM, rojo por conductas, rojo combinado, amarillo, sin throw)
  - `iemLabel`: etiquetas correctas para 1-7 y fuera de rango
  - `scoreRiesgoLabel`: Alto/Medio/Bajo con valores límite

#### FIX 3.3 — Tests manuales documentados
- ✅ `TESTS_MANUALES.md` creado — 8 flujos críticos documentados paso a paso

---

## VERIFICACIÓN FINAL

- ✅ `npm test` — 11/11 tests pasando
- ✅ `npm run build` — Build limpio, sin errores de TypeScript, 14 rutas generadas
- ✅ `.env.local` NO trackeado en git
