'use client'

import BienvenidaPersonalizada from './BienvenidaPersonalizada'
import MiEvolucion from './MiEvolucion'
import SemanaWidget from './SemanaWidget'
import type { RegistroDiario } from '@/types/database'

interface CheckinSemanal {
  week_start: string
  semaphore: 'green' | 'amber' | 'red'
  scores: {
    ics: number
    ica: number
    be_norm: number
    ini_norm: number
    [key: string]: number
  }
  dominant_domain: string
  ica_days?: number[]
}

interface ConductaAncla {
  id: string
  nombre: string
  icono: string
  orden: number
}

interface Props {
  nombre: string
  checkinActual: CheckinSemanal | null
  historial: CheckinSemanal[]
  conductas: ConductaAncla[]
  rachaVerde: number
  weekStart: string
  checkinHref?: string
  fechaHoy?: string
  yaRegistroHoy?: boolean
  registrosSemana?: RegistroDiario[]
}

const SEMAPHORE_CONFIG = {
  green: {
    label: 'Verde',
    gradiente: 'from-[#1A6B3C] to-[#2A9B5A]',
    mensaje: {
      ica: '¡Tus conductas están construyendo el cambio!',
      be:  '¡Tu estado emocional brilla esta semana!',
      ini: '¡Tu voz interna te acompaña con compasión!',
    },
  },
  amber: {
    label: 'Amarillo',
    gradiente: 'from-[#8B4800] to-[#C87020]',
    mensaje: {
      ica: 'Seguí con las conductas, el hábito se construye paso a paso.',
      be:  'Tu energía merece atención. ¿Qué necesitás esta semana?',
      ini: 'Ser consciente ya es un gran paso.',
    },
  },
  red: {
    label: 'Rojo',
    gradiente: 'from-[#6B1010] to-[#A83020]',
    mensaje: {
      ica: 'Tu equipo de salud está al tanto. Pequeños pasos cuentan.',
      be:  'Tu bienestar emocional importa. Pedí apoyo.',
      ini: 'La autocompasión es el primer paso para volver.',
    },
  },
} as const

const DOMAIN_LABELS: Record<string, string> = {
  ica: 'conductual',
  be:  'emocional',
  ini: 'mental',
}

export default function DashboardPacienteView({
  nombre,
  checkinActual,
  historial,
  conductas,
  rachaVerde,
  weekStart,
  checkinHref = '/dashboard/paciente/checkin',
  fechaHoy,
  yaRegistroHoy = false,
  registrosSemana = [],
}: Props) {
  const tieneCheckin = !!checkinActual
  const config = checkinActual
    ? SEMAPHORE_CONFIG[checkinActual.semaphore]
    : null

  return (
    <div className="min-h-screen bg-surface-base pb-28">
      {/* Header */}
      <div className="bg-surface-card border-b px-5 py-4">
        <p className="text-sm text-text-muted">Hola,</p>
        <h1 className="text-xl font-bold text-text-primary">{nombre} 🧭</h1>
      </div>

      {/* ── Hero semáforo ── */}
      {tieneCheckin && config && checkinActual ? (
        <div className={`mx-5 mt-5 bg-gradient-to-br ${config.gradiente} rounded-3xl p-5 text-white overflow-hidden`}>
          <div className="flex items-start gap-4">
            {/* Columna izquierda — texto */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold tracking-widest uppercase opacity-70 mb-1">
                Índice Compass Semanal
              </p>
              <h2 className="font-serif text-2xl leading-tight mb-1">
                Zona {config.label}
              </h2>
              <p className="text-sm opacity-80 leading-relaxed line-clamp-3">
                {config.mensaje[checkinActual.dominant_domain as keyof typeof config.mensaje] ?? ''}
              </p>
            </div>
            {/* Columna derecha — score */}
            <div className="text-center flex-shrink-0 pt-1">
              <span className="font-serif text-5xl opacity-90 leading-none block tabular-nums">
                {checkinActual.scores.ics}
              </span>
              <span className="text-[10px] font-semibold tracking-widest uppercase opacity-60">ICS</span>
            </div>
          </div>

          {rachaVerde > 0 && (
            <div className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5 text-xs font-semibold mt-4">
              🔥 {rachaVerde} semana{rachaVerde !== 1 ? 's' : ''} verde{rachaVerde !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      ) : (
        <BienvenidaPersonalizada
          nombre={nombre}
          semanaAnterior={historial[0] ?? null}
          esPrimerCheckin={historial.length === 0}
          checkinHref={checkinHref}
        />
      )}

      {/* ── Breakdown 3 dominios ── */}
      {tieneCheckin && checkinActual && (
        <div className="grid grid-cols-3 gap-3 px-5 mt-4">
          <DomainCard icon="🎯" label="ICA" value={checkinActual.scores.ica}     color="teal"  />
          <DomainCard icon="🧭" label="BE"  value={checkinActual.scores.be_norm} color="amber" />
          <DomainCard icon="🧠" label="INI" value={checkinActual.scores.ini_norm} color="navy" />
        </div>
      )}

      {/* ── Botón check-in (si ya completó) ── */}
      {tieneCheckin && (
        <div className="px-5 mt-4">
          <div className="bg-surface-subtle rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-text-secondary">Check-in completado ✓</p>
              <p className="text-xs text-text-muted">Próximo check-in el lunes que viene</p>
            </div>
            <span className="text-2xl">✅</span>
          </div>
        </div>
      )}

      {/* ── Widget registro diario ── */}
      {fechaHoy && (
        <SemanaWidget
          registrosSemana={registrosSemana}
          fechaHoy={fechaHoy}
          yaRegistroHoy={yaRegistroHoy}
        />
      )}

      {(tieneCheckin || historial.length >= 3) && (
        <MiEvolucion historial={historial} rachaVerde={rachaVerde} />
      )}

      {/* ── Conductas ancla ── */}
      {conductas.length > 0 && tieneCheckin && checkinActual && (
        <div className="px-5 mt-5">
          <h3 className="text-sm font-bold text-text-primary mb-3">Mis conductas ancla</h3>
          <div className="space-y-2">
            {conductas.map((c, i) => {
              const dias = checkinActual.ica_days?.[i] ?? 0
              const pct = dias / 7
              return (
                <div key={c.id} className="bg-surface-card rounded-xl border px-4 py-3 flex items-center gap-3">
                  <span className="text-xl">{c.icono}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{c.nombre}</p>
                    <div className="h-1 bg-surface-subtle rounded-full mt-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct >= 0.7 ? 'bg-[#2A7B6F] dark:bg-[#34D399]' : pct >= 0.4 ? 'bg-[#C87020] dark:bg-[#F59E0B]' : 'bg-text-muted'
                        }`}
                        style={{ width: `${pct * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-text-secondary tabular-nums">{dias}/7</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-componentes ──

function DomainCard({ icon, label, value, color }: {
  icon: string
  label: string
  value: number
  color: 'teal' | 'amber' | 'navy'
}) {
  const colors = {
    teal:  { text: 'text-[#2A7B6F] dark:text-[#34D399]', bar: 'bg-[#2A7B6F] dark:bg-[#34D399]' },
    amber: { text: 'text-[#B8860B] dark:text-[#FBBF24]', bar: 'bg-[#C87020] dark:bg-[#F59E0B]' },
    navy:  { text: 'text-[#1B3A5C] dark:text-[#93C5FD]', bar: 'bg-[#2A4F7A] dark:bg-[#3B82F6]' },
  }
  const c = colors[color]
  return (
    <div className="bg-surface-card rounded-2xl border p-3 text-center shadow-sm">
      <div className="text-xl mb-1">{icon}</div>
      <div className="text-[10px] font-bold text-text-muted uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-lg font-bold ${c.text}`}>{Math.round(value)}%</div>
      <div className="h-1 bg-surface-subtle rounded-full mt-2 overflow-hidden">
        <div
          className={`h-full rounded-full ${c.bar}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  )
}
