# TESTS MANUALES — Mi Brújula de Salud
**Actualizado:** 2026-03-24

Estos tests verifican los flujos críticos que no pueden cubrirse con tests unitarios.
Ejecutarlos antes de cada deploy a producción.

---

## Test 1 — Check-in completo como paciente ✅ Happy path

**Precondición:** Usuario con rol `paciente` asignado a un grupo con facilitador.

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Login con email/password de paciente | Redirige a `/inicio` |
| 2 | Verificar que aparece el botón "Hacer check-in" | Visible en pantalla de inicio |
| 3 | Ir a `/checkin` | Muestra paso 1: Conductas ancla |
| 4 | Marcar al menos 4 conductas y presionar "Siguiente" | Avanza al paso 2: IEM |
| 5 | Mover slider a 6/7 y presionar "Siguiente" | Avanza al paso 3: Emoción |
| 6 | Seleccionar emoción 😄 y presionar "Siguiente" | Avanza al paso 4: Notas |
| 7 | Escribir nota opcional y presionar "Guardar check-in" | Muestra pantalla de resultado con semáforo 🟢 verde |
| 8 | En Supabase Dashboard → Table Editor → `checkins` | Existe registro con `semaforo = 'verde'` y los valores correctos |
| 9 | En Supabase → `alertas` | NO hay nueva alerta (semáforo verde no genera alerta) |
| 10 | Presionar "Volver al inicio" | Redirige a `/inicio`, el botón de check-in debe mostrar que ya fue completado |

---

## Test 2 — Check-in en zona roja → alerta automática

**Precondición:** Misma que Test 1.

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Ir a `/checkin` | Muestra el wizard |
| 2 | Marcar 0 conductas y presionar "Siguiente" | Avanza al IEM |
| 3 | Poner IEM en 1/7 y presionar "Siguiente" | Avanza a Emoción |
| 4 | Seleccionar emoción 😰 y guardar | Resultado con semáforo 🔴 rojo y mensaje "Recordá: mañana es otro día" |
| 5 | En Supabase → `alertas` | Existe nueva alerta con `tipo = 'semaforo_rojo'` y `prioridad = 'urgente'` |
| 6 | Login como facilitador del grupo | Redirige a `/dashboard` |
| 7 | Ver el KPI "En rojo (urgente)" | Muestra 1 (o más) |
| 8 | Ir a `/dashboard/alertas` | Aparece la alerta del paciente |
| 9 | Presionar "✓ Marcar como resuelta" | La alerta desaparece de la lista |
| 10 | En Supabase → `alertas` | El registro tiene `resuelta = true` y `resuelta_at` con timestamp |

---

## Test 3 — Doble check-in en el mismo turno (prevención de duplicado)

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Completar un check-in de mañana exitosamente | ✅ Guardado |
| 2 | Navegar a `/checkin` nuevamente | Redirige a `/inicio` (el server detecta check-in existente y redirige) |
| 3 | Si de alguna forma llega al wizard: intentar guardar | El RPC lanza excepción "Ya existe un check-in para este turno del día" y se muestra el error en pantalla |
| 4 | Verificar en `checkins` | Solo existe UN registro para esa fecha+turno |

---

## Test 4 — Check-in de noche (turno independiente)

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Completar check-in de mañana antes de las 15hs | ✅ Guardado con `turno = 'manana'` |
| 2 | Después de las 15hs (o cambiar hora del sistema), ir a `/checkin` | El wizard aparece con badge "Noche 🌙" |
| 3 | Completar el check-in de noche | Guardado con `turno = 'noche'` |
| 4 | En `checkins` | Existen 2 registros para la misma fecha, con turno diferente |

---

## Test 5 — RLS: paciente no puede ver datos de otro paciente

**Precondición:** Dos pacientes: A y B, ambos en grupos diferentes.

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Login como paciente A | ✅ |
| 2 | En el navegador, abrir DevTools → Console | — |
| 3 | Ejecutar: `const sb = window.__supabase; const r = await sb.from('checkins').select('*').neq('user_id', '[ID_DE_A]')` | Retorna 0 resultados (RLS filtra automáticamente por `user_id = auth.uid()`) |
| 4 | Intentar acceder a `/dashboard/paciente/[ID_DE_B]` | Redirige o muestra "Acceso no autorizado" |

---

## Test 6 — Onboarding de nuevo paciente

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Registrar nuevo usuario con rol `paciente` | Crea perfil en `users` con `onboarding_completado = false` |
| 2 | Login con el nuevo usuario | Redirige a `/onboarding` |
| 3 | Completar el onboarding | `onboarding_completado = true` en `users` |
| 4 | Verificar en `conductas_ancla` | Existen 5 conductas por defecto creadas automáticamente |
| 5 | Redirige a `/inicio` | Muestra pantalla de inicio vacía con botón de check-in |

---

## Test 7 — Dashboard del facilitador con múltiples pacientes

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Login como facilitador con al menos 3 pacientes en un grupo | Redirige a `/dashboard` |
| 2 | Verificar KPIs | Los números coinciden con los registros reales en la DB |
| 3 | Hacer click en "Ver ficha →" de un paciente | Redirige a `/dashboard/paciente/[id]` |
| 4 | Verificar que la ficha del paciente muestra su historial | Gráficos y registros visibles |
| 5 | El facilitador NO puede ver checkins de pacientes que no están en sus grupos | Verificar en DevTools con query directa a Supabase |

---

## Test 8 — Compartir por WhatsApp

**Precondición:** El facilitador tiene número de WhatsApp configurado en su perfil.

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Paciente completa check-in | Aparece botón "Compartir con mi profesional de salud" |
| 2 | Presionar el botón | Abre WhatsApp (web o app) con mensaje pre-formateado |
| 3 | Verificar el mensaje | Contiene semáforo, IEM, emoción y conductas con formato correcto |
| 4 | Si el facilitador NO tiene WhatsApp | El botón no aparece (comportamiento correcto) |

---

## Checklist rápido pre-deploy

```
[ ] npm run build → sin errores
[ ] Test 1 (happy path) → ✅
[ ] Test 2 (zona roja → alerta) → ✅
[ ] Test 3 (doble check-in bloqueado) → ✅
[ ] Login como facilitador: ver alertas del Test 2 → ✅
[ ] Verificar que .env.local no está en el repo → ✅
[ ] Migración 003_rpcs_checkin.sql aplicada en Supabase → ✅
```
