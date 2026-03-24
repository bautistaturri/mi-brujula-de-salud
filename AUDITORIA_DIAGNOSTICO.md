# AUDITORÍA DIAGNÓSTICO — Mi Brújula de Salud
**Fecha:** 2026-03-24
**Auditor:** Claude Code (claude-sonnet-4-6)

---

## 1. RESUMEN EJECUTIVO

El proyecto tiene una **base sólida y bien estructurada**. La arquitectura es correcta, el código TypeScript es estricto, y la lógica de negocio principal (check-in diario, semáforo, alertas automáticas) está implementada y es funcional. Los bloqueantes principales antes de producción son:

| Criticidad | Hallazgo |
|---|---|
| 🔴 CRÍTICO | `save_checkin` RPC llamada en el wizard pero no existe en las migraciones |
| 🔴 CRÍTICO | `get_facilitador_whatsapp` RPC llamada pero no existe en las migraciones |
| 🟡 IMPORTANTE | Landing con testimonios, estadísticas e instituciones ficticias |
| 🟡 IMPORTANTE | No hay página 404 personalizada |
| 🟡 IMPORTANTE | No hay tests (unitarios ni de integración) |
| 🟢 MENOR | `calcularSemaforo` duplicada en `utils.ts` y `types/database.ts` |
| 🟢 MENOR | Texto genérico "médica" hardcodeado en CheckinWizard (no gender-neutral) |

---

## 2. ESTRUCTURA DE ARCHIVOS

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── onboarding/page.tsx
│   ├── (patient)/
│   │   ├── layout.tsx
│   │   ├── inicio/page.tsx
│   │   ├── checkin/page.tsx
│   │   └── historial/page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── alertas/page.tsx
│   │   ├── grupos/page.tsx
│   │   ├── paciente/[id]/page.tsx
│   │   └── perfil/page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── landing/     (10 componentes)
│   ├── facilitator/ (5 componentes)
│   └── patient/     (6 componentes)
├── lib/
│   ├── supabase/ (client.ts, server.ts, admin.ts)
│   └── utils.ts
├── types/
│   └── database.ts
└── middleware.ts
supabase/migrations/
├── 001_initial_schema.sql
└── 002_turno_whatsapp.sql
```

**Total**: ~49 archivos TypeScript/TSX + 2 migraciones SQL

---

## 3. BASE DE DATOS (SUPABASE)

### Tablas existentes
| Tabla | RLS | Índices | Estado |
|---|---|---|---|
| `users` | ✅ | ❌ sin índice en `role` | OK |
| `conductas_ancla` | ✅ | ❌ | OK |
| `checkins` | ✅ | ✅ (user_id+fecha, semaforo) | OK |
| `grupos` | ✅ | ❌ | OK |
| `grupo_miembros` | ✅ | ❌ | OK |
| `alertas` | ✅ | ✅ (user_id+resuelta, prioridad) | OK |

### Funciones SQL definidas
- ✅ `calcular_semaforo(iem, conductas)` → text
- ✅ `calcular_score_riesgo(user_id)` → int
- ✅ `calcular_racha(user_id)` → int
- ✅ `generar_alertas_automaticas()` → void
- ✅ `handle_new_user()` → trigger (crea perfil al registrarse)
- ✅ `handle_updated_at()` → trigger
- ✅ `handle_checkin_alerta()` → trigger (genera alerta si semáforo = rojo)
- ✅ `crear_conductas_default(user_id)` → void

### RPCs llamadas desde el frontend — NO definidas en migraciones 🔴
- ❌ `save_checkin(p_fecha, p_turno, p_conductas, p_iem, p_emocion, p_semaforo, p_notas)` — llamada en `CheckinWizard.tsx:50`
- ❌ `get_facilitador_whatsapp(p_user_id)` — llamada en `checkin/page.tsx:36`

Estas funciones pueden existir directamente en Supabase (creadas manualmente), pero **no están en control de versiones**. Si no existen, el check-in fallará silenciosamente con un error de "function not found".

### Vista
- ✅ `vista_estado_pacientes` — correctamente actualizada en migración 002

### Triggers
- ✅ `on_auth_user_created` — crea perfil automáticamente
- ✅ `users_updated_at` / `checkins_updated_at`
- ✅ `checkin_alerta_rojo` — genera alerta si semáforo = rojo

---

## 4. ARQUITECTURA DE INDICADORES (vs. propuesta del prompt)

El proyecto implementa los 3 indicadores del MVP pero con un **esquema diferente y más eficiente** al propuesto:

| Indicador (prompt) | Implementación real |
|---|---|
| IEM (escala 1-7) | `checkins.iem` (smallint 1-7) |
| Brújula Emocional | `checkins.emocion` (enum de 5 emojis) |
| Conductas Ancla | `conductas_ancla` + `checkins.conductas_completadas` (uuid[]) |

**Semáforo calculado**: Verde (IEM≥5 y conductas≥4) / Rojo (IEM≤2 o conductas≤1) / Amarillo (resto)

Esta arquitectura es válida y no requiere migrar al esquema `indicators`/`indicator_logs` del prompt. Es más simple y directa para el MVP.

---

## 5. CALIDAD DE CÓDIGO

| Check | Estado |
|---|---|
| TypeScript `any` | ✅ Ninguno encontrado |
| `console.log` | ✅ Ninguno encontrado |
| `TODO` / `FIXME` | ✅ Ninguno encontrado |
| `<img>` sin next/image | ✅ No hay imágenes reales (todo es emojis/divs) |
| Manejo de errores Supabase | ⚠️ Inconsistente — algunos usan `.error`, otros no |
| Loading states | ⚠️ Parcial — el wizard tiene `guardando` pero algunas páginas no |
| Empty states | ⚠️ Parcial — algunos componentes no manejan listas vacías |
| Validación de formularios | ⚠️ Sin zod — validación manual básica |
| Función duplicada | `calcularSemaforo` existe en `utils.ts` y `types/database.ts` |

---

## 6. CONTENIDO FALSO EN LANDING

### `Testimonials.tsx` — 3 testimonios completamente ficticios
- "Dra. María González" — Psicóloga Clínica — Centro de Salud Mental Integral
- "Lic. Carlos Mendoza" — Coordinador de Salud — Hospital Universitario
- "Dra. Ana Rodríguez" — Médica de Cabecera — Red de Salud Comunitaria
- Estadísticas inventadas: "40% menos crisis", "80 pacientes"

### `SocialProof.tsx` — 6 instituciones ficticias
- Hospital Universitario, Clínica Santa María, CSMI, RSC, IPA, FSV

### `Hero.tsx` — estadísticas y datos hardcodeados
- Estadísticas: "500+ Pacientes activos", "95% Adherencia promedio", "48h Respuesta a alertas"
- Mockup con nombre "Marcos", "12 días de racha", "3 pacientes con alerta", "95% adherencia"
  (estas últimas son aceptables como demo visual, pero las stats del pie son engañosas)

---

## 7. SEGURIDAD

| Check | Estado |
|---|---|
| RLS activo en todas las tablas | ✅ |
| `service_role` key expuesta en cliente | ✅ Solo en server (`admin.ts`) |
| `.env.local` en `.gitignore` | ⚠️ No verificado — revisar antes de push |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ⚠️ Formato nuevo "sb_publishable_..." — verificar si es correcto o era el JWT |
| Rate limiting en auth | ❌ No implementado en Next.js (depende de Supabase Auth) |
| CORS | ✅ Solo localhost:3000 en `next.config.mjs` |

---

## 8. LO QUE FALTA PARA MVP

### Crítico (bloqueante)
1. **Crear migration con RPCs faltantes** (`save_checkin`, `get_facilitador_whatsapp`)
2. **Verificar que `.env.local` esté en `.gitignore`**

### Importante (pre-producción)
3. Limpiar contenido falso en landing
4. Página 404 personalizada
5. Actualizar `next.config.mjs` — agregar dominios de producción en `allowedOrigins`
6. Tests mínimos de la función `calcularSemaforo` y flujo de check-in

### Nice to have
7. Migrar `calcularSemaforo` a un único lugar
8. Skeleton loaders en dashboards
9. Manejo de error genérico (Error Boundary)

---

## 9. LO QUE YA ESTÁ BIEN ✅

- Middleware de protección de rutas por rol
- RLS correctamente configurado por rol
- Triggers de alertas automáticas
- Vista `vista_estado_pacientes` optimizada
- Check-in wizard mobile-first con 4 pasos
- Sistema de semáforo con lógica consistente entre SQL y TypeScript
- Soporte para 2 check-ins por día (mañana/noche)
- Integración WhatsApp para compartir resultados
- Tipos TypeScript bien definidos y reutilizados
- Funciones de utilidad (formatFecha, iemLabel, scoreRiesgoLabel)
- Textos no punitivos ("Recordá: mañana es otro día")
- Todo en español
