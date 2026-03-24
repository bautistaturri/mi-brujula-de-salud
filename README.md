# 🧭 Mi Brújula de Salud

SaaS de seguimiento de bienestar con app móvil para pacientes y panel de gestión para facilitadores.

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **Supabase** (Auth + PostgreSQL + RLS)

## Estructura

```
src/
├── app/
│   ├── (auth)/          → login, register, onboarding
│   ├── (patient)/       → app paciente mobile-first
│   │   ├── inicio/      → dashboard diario
│   │   ├── checkin/     → wizard de check-in
│   │   └── historial/   → historial personal
│   └── dashboard/       → panel facilitador desktop
│       ├── alertas/
│       ├── grupos/
│       └── paciente/[id]/
├── components/
│   ├── patient/
│   └── facilitator/
├── lib/supabase/         → cliente browser + servidor
└── types/database.ts     → tipos TypeScript
```

## Setup

### 1. Clonar y configurar entorno

```bash
cp .env.local.example .env.local
# Editar con tus credenciales de Supabase
```

### 2. Base de datos Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ir a **SQL Editor** y ejecutar:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
3. Copiar **URL** y **anon key** a `.env.local`

### 3. Instalar y correr

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## Funcionalidades MVP

### App Paciente (mobile-first)
- ✅ Dashboard diario con semáforo personal
- ✅ 5 conductas ancla configurables (checkboxes)
- ✅ Check-in emocional en ~2 min (wizard 4 pasos)
- ✅ IEM: Índice de Energía Motivacional (slider 1-7)
- ✅ Racha de días consecutivos 🔥
- ✅ Historial de los últimos 30 días

### Panel Facilitador (desktop)
- ✅ Vista grupal con semáforo de cada paciente
- ✅ KPIs: registros del día, en amarillo, en rojo
- ✅ Alertas priorizadas (urgente / observación)
- ✅ Ficha individual con timeline de eventos
- ✅ Score de riesgo automático (0-100)
- ✅ Gestión de grupos y pacientes

### Semáforo automático
| IEM | Conductas | Estado |
|-----|-----------|--------|
| ≥5 | ≥4 | 🟢 Verde |
| 3-4 | 2-3 | 🟡 Amarillo |
| ≤2 | ≤1 | 🔴 Rojo |

### Score de riesgo
- +10 pts por cada día sin registro (últimos 7 días)
- +20 pts si IEM promedio < 3
- +10 pts si IEM promedio 3-4
- +5 pts por cada día en rojo

### Alertas automáticas (triggers SQL)
- 🚨 **Semáforo rojo** → alerta urgente inmediata
- 📭 **2+ días sin registro** → alerta urgente
- ⚡ **IEM bajo (promedio <3)** → alerta urgente

## Base de datos

```
users           → perfiles (role: paciente | facilitador)
conductas_ancla → 5 hábitos diarios por usuario
checkins        → registro diario (fecha unique por usuario)
grupos          → grupos del facilitador
grupo_miembros  → relación many-to-many
alertas         → alertas generadas automáticamente
```

RLS activado en todas las tablas. Vista `vista_estado_pacientes` para el panel del facilitador.
