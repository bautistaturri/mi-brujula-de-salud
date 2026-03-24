# CHECKLIST PRE-PRODUCCIÓN — Mi Brújula de Salud
**Última actualización:** 2026-03-24

---

## SUPABASE

| Estado | Ítem |
|---|---|
| ✅ | RLS activo en todas las tablas (`users`, `conductas_ancla`, `checkins`, `grupos`, `grupo_miembros`, `alertas`) |
| ✅ | Índices en `checkins(user_id, fecha)` y `alertas(user_id, resuelta, fecha)` |
| ⬜ | **Ejecutar migración `003_rpcs_checkin.sql` en Supabase Dashboard → SQL Editor** |
| ⬜ | Backups automáticos activados (Settings → Database → Backups) |
| ✅ | `service_role` key solo usada en server (`src/lib/supabase/admin.ts`) |
| ⬜ | Configurar cron job para `generar_alertas_automaticas()` (diariamente, ej: 8:00 AM) |
| ✅ | Trigger `on_auth_user_created` definido (crea perfil al registrarse) |
| ✅ | Trigger `checkin_alerta_rojo` definido (genera alerta si semáforo = rojo) |

---

## NEXT.JS

| Estado | Ítem |
|---|---|
| ✅ | `npm run build` — sin errores (verificado 2026-03-24) |
| ✅ | Sin errores de TypeScript en build |
| ✅ | `allowedOrigins` en `next.config.mjs` usa `NEXT_PUBLIC_APP_URL` |
| ✅ | Rutas protegidas con middleware (`src/middleware.ts`) |
| ✅ | Página 404 personalizada (`src/app/not-found.tsx`) |
| ✅ | Metadata SEO básica en `layout.tsx` (title, description, viewport, manifest) |

---

## SEGURIDAD

| Estado | Ítem |
|---|---|
| ✅ | `.gitignore` creado — `.env.local` excluido del repositorio |
| ✅ | `.env.local` confirmado como NO trackeado en git |
| ✅ | No hay `console.log` en el código |
| ✅ | CORS configurado via `NEXT_PUBLIC_APP_URL` (actualizar para producción) |
| ⬜ | Rate limiting en auth (configurar en Supabase Auth Settings → Rate Limits) |

---

## VARIABLES DE ENTORNO

| Estado | Ítem |
|---|---|
| ⬜ | `NEXT_PUBLIC_SUPABASE_URL` configurada en el proveedor de hosting |
| ⬜ | `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurada en el proveedor de hosting |
| ⬜ | `SUPABASE_SERVICE_ROLE_KEY` configurada solo en variables del servidor |
| ⬜ | `NEXT_PUBLIC_APP_URL` apunta al dominio real de producción |

---

## TESTS

| Estado | Ítem |
|---|---|
| ✅ | `npm test` — 11/11 tests unitarios pasando |
| ⬜ | Test Manual 1: Check-in completo como paciente |
| ⬜ | Test Manual 2: Check-in en zona roja → alerta automática |
| ⬜ | Test Manual 3: Doble check-in bloqueado |
| ⬜ | Test Manual 7: Dashboard del facilitador |

---

## PERFORMANCE

| Estado | Ítem |
|---|---|
| ✅ | Queries con filtros (no se traen todos los registros sin WHERE) |
| ✅ | Historial limitado a 30 registros con `.limit(30)` |
| ✅ | Mobile-first — layout de paciente con `max-w-lg` |
| ⬜ | Agregar skeleton loaders en dashboards (actualmente no hay) |

---

## CONTENIDO

| Estado | Ítem |
|---|---|
| ✅ | Testimonios ficticios eliminados |
| ✅ | Instituciones ficticias eliminadas |
| ✅ | Estadísticas inventadas del Hero eliminadas |
| ✅ | Lenguaje no punitivo en resultados del check-in |
| ✅ | Lenguaje gender-neutral ("mi profesional de salud") |
| ✅ | Todo en español |
| ⬜ | Email de contacto real en sección de testimonios |

---

## RESUMEN

**Ítems completados:** 22 ✅
**Ítems pendientes:** 10 ⬜

### Bloqueantes críticos antes de lanzar (en orden)
1. ⬜ Ejecutar migración `003_rpcs_checkin.sql` en Supabase
2. ⬜ Configurar variables de entorno en el proveedor de hosting
3. ⬜ Ejecutar tests manuales 1, 2 y 3 en el entorno de staging
