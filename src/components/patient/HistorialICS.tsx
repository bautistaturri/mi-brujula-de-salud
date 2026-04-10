'use client'

import type { CheckinSemanal } from '@/types/database'

interface Props {
  checkins: CheckinSemanal[]
}

// Colores semáforo via CSS variables para respetar dark mode
const SEMAFORO_STYLE = {
  green: { bg: 'var(--semaforo-verde-bg)',    text: 'var(--semaforo-verde-text)',    dot: 'bg-[#2A9B5A]',  label: 'Verde'    },
  amber: { bg: 'var(--semaforo-amarillo-bg)', text: 'var(--semaforo-amarillo-text)', dot: 'bg-[#C87020]',  label: 'Amarillo' },
  red:   { bg: 'var(--semaforo-rojo-bg)',     text: 'var(--semaforo-rojo-text)',     dot: 'bg-[#A83020]',  label: 'Rojo'     },
}

function formatWeek(weekStart: string): string {
  const d = new Date(weekStart + 'T00:00:00')
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

export default function HistorialICS({ checkins }: Props) {
  if (checkins.length === 0) {
    return (
      <div className="bg-surface-subtle rounded-2xl p-6 text-center">
        <p className="text-3xl mb-2">📊</p>
        <p className="text-sm text-text-secondary">Aún no hay check-ins semanales registrados.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {checkins.map(c => {
        const s = SEMAFORO_STYLE[c.semaphore] ?? SEMAFORO_STYLE.amber
        const ics = typeof c.scores?.ics === 'number' ? Math.round(c.scores.ics) : null
        return (
          <div
            key={c.id}
            className="bg-surface-card rounded-2xl border p-4 shadow-sm flex items-center gap-4"
          >
            {/* Dot semáforo */}
            <span className={`w-3 h-3 rounded-full flex-shrink-0 ${s.dot}`} />

            {/* Fecha */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary">
                Semana del {formatWeek(c.week_start)}
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                ICA {Math.round(c.scores?.ica ?? 0)}% · BE {Math.round(c.scores?.be_norm ?? 0)}%
                {c.emocion_principal && ` · ${c.emocion_principal}`}
              </p>
            </div>

            {/* ICS score + semáforo */}
            <div
              className="px-3 py-1.5 rounded-xl text-center"
              style={{ background: s.bg }}
            >
              {ics !== null && (
                <p className="text-lg font-bold font-serif leading-none" style={{ color: s.text }}>{ics}</p>
              )}
              <p className="text-[10px] font-semibold" style={{ color: s.text }}>{s.label}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
