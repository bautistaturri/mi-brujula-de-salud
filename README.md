# Mi Brújula de Salud

Plataforma SaaS de seguimiento de bienestar con app móvil para pacientes y panel de gestión para facilitadores (coaches, médicos).

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 14 (App Router) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS + shadcn/ui |
| Backend | Supabase (Auth + PostgreSQL + RLS) |
| Validación | Zod |
| Tests | Vitest |
| Deploy | Vercel |

---

## Arquitectura

```
src/
├── app/
│   ├── (auth)/              # Login, registro, onboarding, reset password
│   ├── (patient)/           # App móvil paciente (layout propio)
│   │   ├── inicio/          # Dashboard semanal ICS
│   │   ├── checkin/         # Wizard check-in ICS (3 pasos)
│   │   ├── historial/       # Historial check-ins diarios
│   │   ├── logros/          # Logros desbloqueados
│   │   └── registro-semanal/ # Formulario bienestar 6 dimensiones
│   ├── dashboard/           # Panel facilitador (desktop)
│   │   ├── alertas/         # Centro de alertas ICS
│   │   ├── grupos/          # Gestión de grupos y pacientes
│   │   ├── paciente/[id]/   # Ficha individual del paciente
│   │   │   └── registros/   # Registros semanales del paciente
│   │   └── perfil/          # Perfil del facilitador (WhatsApp)
│   ├── api/
│   │   └── cron/weekly-alerts/ # Cron semanal de alertas ICS
│   └── auth/callback/       # Callback OAuth/magic link
├── components/
│   ├── facilitator/         # Componentes del panel facilitador
│   ├── landing/             # Componentes de la landing page
│   ├── logros/              # Tarjetas de logros
│   ├── patient/             # Componentes de la app paciente
│   ├── registro-semanal/    # Formulario y visualización semanal
│   └── ui/                  # Componentes UI reutilizables
├── lib/
│   ├── alerts/alert_engine.ts  # Motor de alertas clínicas (7 casos)
│   ├── scoring/motor_ics.ts    # Cálculo del ICS (Índice Compass Semanal)
│   ├── supabase/               # Clientes browser, server y admin
│   ├── logros.ts               # Evaluación de logros
│   ├── scoring.ts              # Score bienestar semanal subjetivo
│   ├── utils.ts                # Utilidades compartidas
│   └── validations.ts          # Esquemas Zod (cliente + servidor)
├── types/database.ts           # Tipos TypeScript del modelo de datos
└── middleware.ts               # Protección de rutas por rol

supabase/
└── migrations/                 # Migraciones SQL en orden

docs/
└── database-schema.md          # Documentación completa del modelo de datos
```

---

## Modelo de datos

El esquema completo, relaciones, decisiones de diseño e índices están documentados en [`docs/database-schema.md`](./docs/database-schema.md).

**Tablas principales:**

| Tabla | Descripción |
|---|---|
| `users` | Perfiles (pacientes y facilitadores) |
| `conductas_ancla` | 5 hábitos diarios del paciente |
| `checkins_semanales` | Check-in ICS semanal (modelo activo) |
| `alerts` | Alertas del motor ICS (cron semanal) |
| `rachas` | Racha de semanas verdes consecutivas |
| `registros_semanales` | Bienestar subjetivo (6 dimensiones) |
| `logros_paciente` | Logros desbloqueados |

---

## Configuración del entorno

### 1. Clonar y configurar variables

```bash
git clone <repo-url>
cd mi-brujula-de-salud
cp .env.local.example .env.local
# Editar .env.local con las credenciales reales
```

**Variables requeridas:**

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (pública, protegida por RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (solo servidor, nunca exponer) |
| `NEXT_PUBLIC_APP_URL` | URL base de la app (ej: `https://tudominio.com`) |
| `CRON_SECRET` | Secret para autenticar el endpoint de cron |

### 2. Base de datos Supabase

1. Crear un proyecto en [supabase.com](https://supabase.com)
2. Ir a **SQL Editor** y ejecutar las migraciones en orden:

```bash
# Ejecutar en Supabase SQL Editor, en este orden:
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_turno_whatsapp.sql
supabase/migrations/003_rpcs_checkin.sql
supabase/migrations/004_fix_conductas_default_idempotente.sql
supabase/migrations/005_fix_conductas_duplicadas.sql
supabase/migrations/006_fix_rls_recursion.sql
supabase/migrations/007_ics_model.sql
supabase/security-rls.sql        # Aplicar al final (RLS para tablas nuevas)
```

3. Copiar **Project URL** y **anon key** a `.env.local`

### 3. Instalar dependencias

```bash
npm install
```

### 4. Correr en desarrollo

```bash
npm run dev
# Abre http://localhost:3000
```

---

## Scripts disponibles

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con hot-reload |
| `npm run build` | Build de producción |
| `npm start` | Servidor de producción (tras build) |
| `npm run lint` | ESLint |
| `npm test` | Tests unitarios (Vitest) |
| `npm run test:watch` | Tests en modo watch |

---

## Tests

```bash
npm test
```

Los tests unitarios cubren:
- `src/lib/__tests__/utils.test.ts` — semáforo, labels IEM, score riesgo
- `src/lib/__tests__/scoring.test.ts` — cálculo score bienestar semanal
- `src/lib/__tests__/logros.test.ts` — evaluación de logros
- `src/lib/__tests__/alert_engine.test.ts` — motor de alertas ICS

---

## Deploy

### Vercel (recomendado)

1. Conectar el repositorio en [vercel.com](https://vercel.com)
2. Agregar todas las variables de entorno en **Settings → Environment Variables**
3. El cron job se configura automáticamente desde `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/weekly-alerts", "schedule": "0 8 * * 1" }
  ]
}
```

El cron se ejecuta cada lunes a las 8:00 AM UTC. Vercel incluye el `CRON_SECRET` automáticamente en el header `Authorization`.

4. Agregar el dominio de producción a `NEXT_PUBLIC_APP_URL` en las variables de entorno.

### Variables de entorno en producción

| Variable | Entorno |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production + Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production + Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | Production (nunca Preview si hay datos reales) |
| `NEXT_PUBLIC_APP_URL` | Production |
| `CRON_SECRET` | Production |

---

## Roles y flujos

### Paciente (móvil-first)

1. Registro → Onboarding → creación automática de 5 conductas ancla
2. Cada semana: check-in ICS en 3 pasos (Conductual / Emocional / Cognitivo)
3. Resultado: Índice Compass Semanal (ICS) + semáforo verde/amarillo/rojo
4. Historial, logros y registro de bienestar subjetivo disponibles

### Facilitador (desktop)

1. Registro → Onboarding → creación de grupos
2. Panel de seguimiento con semáforo de cada paciente
3. Centro de alertas priorizado (7 tipos de alertas clínicas)
4. Ficha individual con historial ICS + alertas + rachas
5. Registros semanales de sus pacientes con scores

### Sistema ICS (Índice Compass Semanal)

```
ICS = (ICA × 50%) + (BE_norm × 30%) + (INI_norm × 20%)

Umbrales:
  Verde  → ICS ≥ 70
  Amarillo → 45 ≤ ICS < 70
  Rojo   → ICS < 45

Dominios:
  ICA (Conductas Ancla): días cumplidos × conductas + bonus barreras
  BE (Brújula Emocional): energía vital × 0.4 + regulación × 0.6
  INI (Narrativa Interna): Saboteador(1) / Observador(3) / Aliado(5)
```

---

## Seguridad

- **Row Level Security** activa en todas las tablas de Supabase
- **Roles**: paciente y facilitador con acceso segregado por RLS + layouts de Next.js
- **Validación Zod** en cliente Y servidor (nunca confiar solo en el cliente)
- **Service Role Key** usada únicamente en servidor (`src/lib/supabase/admin.ts`) con import de `server-only`
- **CRON_SECRET** protege el endpoint de cron contra ejecución no autorizada
- **Headers de seguridad** configurados en `next.config.mjs` (CSP, HSTS, X-Frame-Options, etc.)
- **Prevención de IDOR**: validación UUID + verificación de pertenencia al grupo antes de mostrar datos de pacientes
- **Prevención de open redirect**: el callback de auth valida que `next` sea ruta relativa

---

## Estructura de decisiones técnicas

- **App Router + Server Components**: fetching de datos en el servidor siempre que sea posible, eliminando waterfalls del cliente
- **Supabase RLS como barrera real**: el middleware y los layouts son defensa en profundidad; RLS es la barrera de datos definitiva
- **Zod compartido**: los mismos esquemas se usan en formularios (cliente) y en cualquier lógica servidor
- **motor_ics.ts puro**: sin side effects, testeable, agnóstico a la DB — calculado en el cliente, enviado via RPC
- **Migraciones numeradas**: cada cambio de schema en un archivo separado con nombre descriptivo
