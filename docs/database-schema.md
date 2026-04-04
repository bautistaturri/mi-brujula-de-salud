# Database Schema — Mi Brújula de Salud

**Motor:** Supabase (PostgreSQL 15) con Row Level Security (RLS) habilitado en todas las tablas.

---

## Índice de tablas

| Tabla | Descripción | Migración |
|---|---|---|
| `users` | Perfiles de usuarios (pacientes y facilitadores) | 001 |
| `conductas_ancla` | Hábitos diarios configurables del paciente | 001 |
| `checkins` | Registro diario legacy (IEM + emoción + semáforo) | 001 + 002 |
| `grupos` | Grupos de pacientes gestionados por un facilitador | 001 |
| `grupo_miembros` | Relación many-to-many grupos ↔ pacientes | 001 |
| `alertas` | Alertas legacy generadas por triggers (check-in diario) | 001 |
| `checkins_semanales` | Registro semanal ICS (modelo principal activo) | 007 |
| `alerts` | Alertas ICS generadas por el motor semanal (cron) | 007 |
| `rachas` | Racha de semanas verdes consecutivas por paciente | 007 |
| `registros_semanales` | Registro subjetivo semanal de 6 dimensiones | 007 |
| `logros_paciente` | Logros desbloqueados por el paciente | 007 |

---

## Tablas

### `users`

Extiende `auth.users` de Supabase Auth. Creada automáticamente via trigger `handle_new_user` al registrarse.

| Columna | Tipo | Nullable | Default | Descripción |
|---|---|---|---|---|
| `id` | uuid | NOT NULL | — | PK. Mismo ID que `auth.users.id` |
| `email` | text | NOT NULL | — | Email del usuario |
| `nombre` | text | NOT NULL | — | Nombre completo |
| `role` | text | NOT NULL | — | `'paciente'` o `'facilitador'` |
| `avatar_url` | text | NULL | — | URL de foto de perfil (Supabase Storage) |
| `whatsapp` | text | NULL | — | Número WhatsApp del facilitador (solo dígitos, 7-15 chars) |
| `onboarding_completado` | boolean | NOT NULL | `false` | Controla el flujo de primer acceso |
| `created_at` | timestamptz | NOT NULL | `now()` | |
| `updated_at` | timestamptz | NOT NULL | `now()` | Actualizado por trigger `users_updated_at` |

**Constraints:** `role IN ('paciente', 'facilitador')`  
**FK:** `id → auth.users(id) ON DELETE CASCADE`  
**RLS:**
- Paciente: SELECT/UPDATE propio (`auth.uid() = id`)
- Facilitador: SELECT de pacientes en sus grupos
- INSERT: solo via trigger `handle_new_user` (SECURITY DEFINER)

---

### `conductas_ancla`

Hábitos diarios configurables del paciente. Exactamente 5 por usuario, creados en el onboarding via `crear_conductas_default()`.

| Columna | Tipo | Nullable | Default | Descripción |
|---|---|---|---|---|
| `id` | uuid | NOT NULL | `uuid_generate_v4()` | PK |
| `user_id` | uuid | NOT NULL | — | FK → users(id) |
| `nombre` | text | NOT NULL | — | Nombre del hábito (ej: "Me hidraté") |
| `icono` | text | NOT NULL | `'✓'` | Emoji representativo |
| `orden` | smallint | NOT NULL | `0` | Orden de presentación (0-4) |
| `activa` | boolean | NOT NULL | `true` | Soft-delete |
| `created_at` | timestamptz | NOT NULL | `now()` | |

**Constraints:** `UNIQUE (user_id, nombre)` — previene duplicados  
**FK:** `user_id → users(id) ON DELETE CASCADE`  
**RLS:** Paciente: todas las operaciones sobre las propias

---

### `checkins`

Registro diario legacy. En el modelo actual el check-in semanal ICS es el mecanismo principal, pero esta tabla sigue activa para historial y compatibilidad.

| Columna | Tipo | Nullable | Default | Descripción |
|---|---|---|---|---|
| `id` | uuid | NOT NULL | `uuid_generate_v4()` | PK |
| `user_id` | uuid | NOT NULL | — | FK → users(id) |
| `fecha` | date | NOT NULL | `current_date` | Fecha del check-in |
| `turno` | text | NOT NULL | `'noche'` | `'manana'` o `'noche'` |
| `conductas_completadas` | uuid[] | NOT NULL | `{}` | IDs de conductas completadas ese día |
| `iem` | smallint | NOT NULL | — | Índice Energía Motivacional (1-7) |
| `emocion` | text | NOT NULL | — | Emoji: `'😄'` `'🙂'` `'😐'` `'😔'` `'😰'` |
| `semaforo` | text | NOT NULL | — | `'verde'` `'amarillo'` `'rojo'` (calculado) |
| `notas` | text | NULL | — | Texto libre opcional (max 300 chars) |
| `created_at` | timestamptz | NOT NULL | `now()` | |
| `updated_at` | timestamptz | NOT NULL | `now()` | |

**Constraints:** `UNIQUE (user_id, fecha, turno)`, `iem BETWEEN 1 AND 7`, `emocion IN (...)`, `semaforo IN (...)`  
**Índices:** `(user_id, fecha DESC)`, `(semaforo, fecha DESC)`  
**Triggers:** `checkin_alerta_rojo` → inserta en `alertas` si semáforo = 'rojo'  
**RLS:** Paciente: SELECT/INSERT propio; Facilitador: SELECT de sus pacientes

---

### `grupos`

Grupos de seguimiento creados por facilitadores.

| Columna | Tipo | Nullable | Default | Descripción |
|---|---|---|---|---|
| `id` | uuid | NOT NULL | `uuid_generate_v4()` | PK |
| `nombre` | text | NOT NULL | — | Nombre del grupo |
| `descripcion` | text | NULL | — | Descripción opcional |
| `facilitador_id` | uuid | NOT NULL | — | FK → users(id) |
| `activo` | boolean | NOT NULL | `true` | Soft-delete |
| `created_at` | timestamptz | NOT NULL | `now()` | |

**FK:** `facilitador_id → users(id) ON DELETE CASCADE`  
**RLS:** Facilitador: CRUD propio; Paciente: SELECT de grupos donde es miembro

---

### `grupo_miembros`

Relación many-to-many entre grupos y pacientes.

| Columna | Tipo | Nullable | Default | Descripción |
|---|---|---|---|---|
| `grupo_id` | uuid | NOT NULL | — | FK → grupos(id) |
| `user_id` | uuid | NOT NULL | — | FK → users(id) (paciente) |
| `fecha_ingreso` | date | NOT NULL | `current_date` | |
| `activo` | boolean | NOT NULL | `true` | Soft-delete de membresía |

**PK:** `(grupo_id, user_id)` compuesta  
**Cardinalidad:** Un paciente puede estar en múltiples grupos. Un grupo tiene múltiples pacientes.  
**RLS:** Facilitador: CRUD de miembros de sus grupos; Paciente: SELECT de su propia membresía

---

### `alertas` (legacy)

Alertas generadas automáticamente por triggers del check-in diario. Actualmente no mostradas en la UI principal (que usa `alerts` ICS). Se mantiene por historial.

| Columna | Tipo | Nullable | Default | Descripción |
|---|---|---|---|---|
| `id` | uuid | NOT NULL | `uuid_generate_v4()` | PK |
| `user_id` | uuid | NOT NULL | — | FK → users(id) (paciente) |
| `tipo` | text | NOT NULL | — | `'ausencia'` `'iem_bajo'` `'semaforo_rojo'` `'racha_rota'` `'riesgo_alto'` |
| `descripcion` | text | NOT NULL | — | Mensaje descriptivo |
| `fecha` | date | NOT NULL | `current_date` | |
| `resuelta` | boolean | NOT NULL | `false` | |
| `resuelta_at` | timestamptz | NULL | — | |
| `resuelta_por` | uuid | NULL | — | FK → users(id) |
| `prioridad` | text | NOT NULL | `'observacion'` | `'urgente'` o `'observacion'` |
| `created_at` | timestamptz | NOT NULL | `now()` | |

**Índices:** `(user_id, resuelta, fecha DESC)`, `(prioridad, resuelta, fecha DESC)`

---

### `checkins_semanales` ★ (modelo activo)

Check-in semanal ICS. Reemplaza al check-in diario como fuente de verdad principal. Uno por usuario por semana.

| Columna | Tipo | Nullable | Default | Descripción |
|---|---|---|---|---|
| `id` | uuid | NOT NULL | `uuid_generate_v4()` | PK |
| `user_id` | uuid | NOT NULL | — | FK → users(id) |
| `week_start` | date | NOT NULL | — | Lunes de la semana (YYYY-MM-DD) |
| `ica_days` | smallint[] | NOT NULL | `{0,0,0,0,0}` | Días cumplidos por conducta (5 valores, 0-7) |
| `ica_barriers` | smallint | NOT NULL | `0` | Barreras superadas (0-3) |
| `be_energy` | smallint | NOT NULL | `3` | Energía vital (1-5) |
| `be_regulation` | smallint | NOT NULL | `3` | Regulación emocional (1\|3\|5) |
| `ini_score` | smallint | NOT NULL | `3` | Narrativa interna (1=Saboteador, 3=Observador, 5=Aliado) |
| `semaphore` | text | NOT NULL | — | `'green'` `'amber'` `'red'` |
| `alerts` | text[] | NOT NULL | `{}` | Alertas especiales: `'be_critical'` `'ini_saboteador'` etc. |
| `scores` | jsonb | NOT NULL | `{}` | `{ica, be, be_norm, ini, ini_norm, ics}` |
| `dominant_domain` | text | NOT NULL | `'ica'` | `'ica'` `'be'` `'ini'` |
| `submitted_at` | timestamptz | NOT NULL | `now()` | |
| `created_at` | timestamptz | NOT NULL | `now()` | |

**Constraints:** `UNIQUE (user_id, week_start)`, checks en be_regulation, ini_score, semaphore, dominant_domain  
**Índices:** `(user_id, week_start DESC)`, `(semaphore, week_start DESC)`  
**Fórmula ICS:** `ICS = (ICA×50%) + (BE_norm×30%) + (INI_norm×20%)`  
**Umbrales semáforo:** verde ≥ 70 / amber 45-69 / red < 45

---

### `alerts` ★ (modelo activo)

Alertas generadas por el motor ICS (cron semanal cada lunes). Distinta de `alertas` legacy.

| Columna | Tipo | Nullable | Default | Descripción |
|---|---|---|---|---|
| `id` | uuid | NOT NULL | `uuid_generate_v4()` | PK |
| `patient_id` | uuid | NOT NULL | — | FK → users(id) |
| `type` | text | NOT NULL | — | Ver tipos abajo |
| `color` | text | NOT NULL | — | `'red'` `'amber'` `'celebration'` `'internal'` |
| `assign_to` | text | NOT NULL | — | `'medica'` `'coach'` `'coach_urgent'` `'coach_note'` `'auto'` |
| `message` | text | NOT NULL | — | Mensaje para el facilitador |
| `priority` | numeric | NOT NULL | `2` | 1=urgente, 1.5-1.8=alto, 2=normal, 3+=bajo |
| `scores` | jsonb | NULL | — | Scores del check-in que generó la alerta |
| `is_read` | boolean | NOT NULL | `false` | |
| `week_start` | date | NULL | — | Semana de origen |
| `created_at` | timestamptz | NOT NULL | `now()` | |

**Tipos de alerta (`type`):**
- `missing_checkin` — Sin check-in esta semana
- `red_semaphore` — Semáforo rojo → asignar a médica
- `amber_circumstantial` — Amarillo puntual
- `amber_systemic` — Amarillo ≥2 semanas → microencuentro
- `be_critical` — Energía emocional crítica (BE < 1.5)
- `ica_zero` — Cero conductas cumplidas
- `ini_saboteador_streak` — Saboteador ≥3 semanas seguidas
- `green_with_low_ica` — Verde enmascarado (ICA < 55%)
- `green_streak_milestone` — Hito de racha verde (3/6/12 semanas)
- `combined_risk` — Riesgo combinado ICA bajo + BE bajo

**Índices:** `(patient_id, is_read, created_at DESC)`, `(priority ASC, created_at DESC)`

---

### `rachas`

Racha de semanas consecutivas por tipo (verde o saboteador). Upsert automático en cada check-in ICS.

| Columna | Tipo | Nullable | Default | Descripción |
|---|---|---|---|---|
| `id` | uuid | NOT NULL | `uuid_generate_v4()` | PK |
| `paciente_id` | uuid | NOT NULL | — | FK → users(id) |
| `tipo` | text | NOT NULL | — | `'green_streak'` o `'ini_saboteador'` |
| `semanas_consecutivas` | smallint | NOT NULL | `0` | Contador actual |
| `ultimo_hito` | smallint | NULL | — | Último hito celebrado (3, 6, 12...) |
| `updated_at` | timestamptz | NOT NULL | `now()` | |

**Constraints:** `UNIQUE (paciente_id, tipo)` — máximo una fila por tipo por paciente

---

### `registros_semanales`

Formulario de bienestar subjetivo semanal (6 dimensiones). Complementario al check-in ICS. Inmutable una vez enviado.

| Columna | Tipo | Nullable | Default | Descripción |
|---|---|---|---|---|
| `id` | uuid | NOT NULL | `uuid_generate_v4()` | PK |
| `paciente_id` | uuid | NOT NULL | — | FK → users(id) |
| `semana_inicio` | date | NOT NULL | — | Lunes de la semana |
| `semana_fin` | date | NOT NULL | — | Domingo de la semana |
| `animo` | smallint | NOT NULL | — | 1-5 |
| `sueno` | smallint | NOT NULL | — | 1-5 |
| `energia` | smallint | NOT NULL | — | 1-5 |
| `alimentacion` | smallint | NOT NULL | — | 1-5 |
| `actividad_fisica` | smallint | NOT NULL | — | 0-7 (días de actividad) |
| `adherencia_medicacion` | text | NOT NULL | — | `'si'` `'no'` `'no_aplica'` |
| `sintomas` | text | NULL | — | Texto libre (max 500 chars) |
| `logro_personal` | text | NULL | — | Texto libre (max 500 chars) |
| `dificultad` | text | NULL | — | Texto libre (max 500 chars) |
| `score` | numeric | NULL | — | Score ponderado 0-100 (calculado al guardar) |
| `nivel_bienestar` | text | NULL | — | Etiqueta del score |
| `requiere_atencion` | boolean | NOT NULL | `false` | true si ánimo ≤2 o sueño ≤2 |
| `created_at` | timestamptz | NOT NULL | `now()` | |

**Constraints:** `UNIQUE (paciente_id, semana_inicio)`  
**Índices:** `(paciente_id, semana_inicio DESC)`

---

### `logros_paciente`

Logros desbloqueados al enviar un registro semanal. Evaluados en `src/lib/logros.ts`.

| Columna | Tipo | Nullable | Default | Descripción |
|---|---|---|---|---|
| `id` | uuid | NOT NULL | `uuid_generate_v4()` | PK |
| `paciente_id` | uuid | NOT NULL | — | FK → users(id) |
| `logro_key` | text | NOT NULL | — | Clave del logro (ej: `'primera_semana'`, `'racha_3'`) |
| `desbloqueado_at` | timestamptz | NOT NULL | `now()` | |

**Constraints:** `UNIQUE (paciente_id, logro_key)` — previene desbloqueos duplicados  
**Claves de logros:** `primera_semana`, `racha_3`, `constancia_total`, `semana_perfecta`, `atleta`, `descanso_maestro`, `en_ascenso`

---

## Relaciones entre tablas

```
auth.users ──────────────────────────────────────────────────────────┐
     │ (trigger handle_new_user)                                      │
     ▼                                                                │
   users ─────────────────────────────────────────────────────────┐  │
     │ 1                                                           │  │
     ├──────────────────── N conductas_ancla                       │  │
     │                                                             │  │
     ├──────────────────── N checkins (legacy diario)             │  │
     │                                                             │  │
     ├──────────────────── N checkins_semanales (ICS activo) ◄────┘  │
     │                                                                │
     ├──────────────────── N rachas                                   │
     │                                                                │
     ├──────────────────── N registros_semanales                     │
     │                                                                │
     ├──────────────────── N logros_paciente                          │
     │                                                                │
     ├──────────────────── N alertas (legacy)                         │
     │                                                                │
     ├──────────────────── N alerts (ICS activo)                      │
     │                                                                │
     ├── role='facilitador' → N grupos (facilitador_id)              │
     │                              │                                 │
     │                              │ N                               │
     └── role='paciente' ───────────┤                                 │
                           grupo_miembros                             │
                           (grupo_id, user_id) PK compuesta          │
                                                    ▲                 │
                                                    │                 │
                                             resuelta_por ───────────┘
                                             (en alertas legacy)
```

---

## Vistas y funciones SQL

### Vista: `vista_estado_pacientes`

Consulta desnormalizada para el panel del facilitador. Muestra el estado actual de cada paciente (último check-in del día, score de riesgo, racha, alertas pendientes).

> ⚠️ Esta vista usa funciones costosas (`calcular_racha`, `calcular_score_riesgo`) por fila. En grupos grandes (>50 pacientes) evaluar materialización o índices adicionales.

### Funciones notables

| Función | Tipo | Descripción |
|---|---|---|
| `save_checkin_ics(...)` | RPC + SECURITY DEFINER | Guarda check-in ICS y actualiza racha |
| `save_checkin(...)` | RPC + SECURITY DEFINER | Guarda check-in diario legacy |
| `get_facilitador_whatsapp(user_id)` | RPC + SECURITY DEFINER | Devuelve WhatsApp del facilitador del paciente |
| `buscar_paciente_por_email(email)` | RPC + SECURITY DEFINER | Solo para facilitadores; retorna id+nombre de paciente |
| `crear_conductas_default(user_id)` | Función + SECURITY DEFINER | Crea las 5 conductas iniciales (idempotente) |
| `calcular_semaforo(iem, conductas)` | Función IMMUTABLE | Lógica semáforo diario: verde/amarillo/rojo |
| `calcular_score_riesgo(user_id)` | Función + SECURITY DEFINER | Score 0-100 basado en últimos 7 días |
| `calcular_racha(user_id)` | Función + SECURITY DEFINER | Días consecutivos con check-in |
| `es_miembro_grupo(grupo_id, user_id)` | Función STABLE + SECURITY DEFINER | Helper para RLS sin recursión |
| `generar_alertas_automaticas()` | Función + SECURITY DEFINER | Cron para alertas legacy (ausencia + IEM bajo) |

### Triggers

| Trigger | Tabla | Evento | Acción |
|---|---|---|---|
| `on_auth_user_created` | `auth.users` | AFTER INSERT | Crea perfil en `public.users` |
| `users_updated_at` | `users` | BEFORE UPDATE | Actualiza `updated_at` |
| `checkins_updated_at` | `checkins` | BEFORE UPDATE | Actualiza `updated_at` |
| `checkin_alerta_rojo` | `checkins` | AFTER INSERT/UPDATE | Inserta en `alertas` si semáforo = rojo |

---

## Flujo lógico de datos

### Registro de un paciente

```
Usuario se registra
  → auth.users INSERT
  → Trigger handle_new_user → users INSERT
  → Onboarding completa
  → crear_conductas_default() → conductas_ancla x5
```

### Check-in semanal ICS

```
Paciente abre /checkin
  → Carga conductas_ancla activas
  → Completa formulario 3 pasos (ICA, BE, INI)
  → calcICS() en cliente → scores + semaphore
  → save_checkin_ics() RPC
    → INSERT INTO checkins_semanales
    → UPSERT INTO rachas (green_streak)
  → UI muestra resultado
```

### Proceso de alertas semanal (cron lunes 8 AM)

```
/api/cron/weekly-alerts (Vercel Cron)
  → Obtiene todos los pacientes + últimos 8 checkins_semanales
  → processWeeklyAlerts() → evalúa 7 casos clínicos por paciente
  → INSERT INTO alerts (excluye alertas 'internal')
  → Facilitadores ven nuevas alertas en /dashboard/alertas
```

---

## Consideraciones de diseño

1. **Dual system**: Coexisten `checkins` (daily, legacy) y `checkins_semanales` (ICS, activo). El historial en `/historial` aún muestra los check-ins diarios. La métrica principal es el ICS semanal.

2. **SECURITY DEFINER en RPCs**: Las RPCs críticas usan SECURITY DEFINER para evitar que el cliente manipule datos de otros usuarios o bypass RLS. Cada función verifica `auth.uid()` explícitamente.

3. **Alertas duplicadas**: `alertas` (legacy, por triggers de check-in diario) y `alerts` (ICS, por cron) son sistemas separados. La UI muestra solo `alerts`. En el futuro se puede deprecar `alertas`.

4. **`vista_estado_pacientes`**: Usa LATERAL JOIN para obtener el último check-in del día, priorizando el turno noche. Llama a funciones costosas por fila — usar con filtro de grupo.

5. **Racha verde**: Se incrementa en cada check-in ICS verde y se resetea a 0 en rojo/amarillo. El contador NO se borra, solo se pone en 0, para poder ver el máximo histórico en el futuro.

6. **Textos libres**: Campos de texto libre (`notas`, `sintomas`, etc.) se validan en Zod con max length antes de llegar a la DB. No hay sanitización adicional porque Supabase usa queries parametrizadas (no hay riesgo de SQL injection desde el cliente).

---

## Orden de ejecución de migraciones

```
001_initial_schema.sql         → tablas base + funciones + triggers
002_turno_whatsapp.sql         → campo turno en checkins + whatsapp en users
003_rpcs_checkin.sql           → save_checkin + get_facilitador_whatsapp
004_fix_conductas_default.sql  → hace crear_conductas_default idempotente
005_fix_conductas_duplicadas.sql → unique constraint + cleanup
006_fix_rls_recursion.sql      → rompe ciclo de RLS con es_miembro_grupo()
007_ics_model.sql              → tablas ICS + save_checkin_ics RPC ← NUEVO
security-rls.sql               → políticas RLS completas (re-aplicar luego de 007)
```
