'use client'

import type { CheckinSemanal } from '@/types/database'

interface Props {
  checkins: CheckinSemanal[]
}

const SEMAFORO_STYLE = {
  green: { bg: 'bg-[#D6EFE1]', text: 'text-[#1A6B3C]', label: 'Verde', dot: 'bg-[#2A9B5A]' },
  amber: { bg: 'bg-[#FDE8CC]', text: 'text-[#8B4800]', label: 'Amarillo', dot: 'bg-[#C87020]' },
  red:   { bg: 'bg-[#FADDDD]', text: 'text-[#8B1A1A]', label: 'Rojo', dot: 'bg-[#A83020]' },
}

function formatWeek(weekStart: string): string {
  const d = new Date(weekStart + 'T00:00:00')
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

export default function HistorialICS({ checkins }: Props) {
  if (checkins.length === 0) {
    return (
      <div className="bg-[#F9FAFB] rounded-2xl p-6 text-center">
        <p className="text-3xl mb-2">📊</p>
        <p className="text-sm text-[#6B7280]">Aún no hay check-ins semanales registrados.</p>
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
            className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm flex items-center gap-4"
          >
            {/* Dot semáforo */}
            <span className={`w-3 h-3 rounded-full flex-shrink-0 ${s.dot}`} />

            {/* Fecha */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1F2937]">
                Semana del {formatWeek(c.week_start)}
              </p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                ICA {Math.round(c.scores?.ica ?? 0)}% · BE {Math.round(c.scores?.be_norm ?? 0)}%
                {c.emocion_principal && ` · ${c.emocion_principal}`}
              </p>
            </div>

            {/* ICS score + semáforo */}
            <div className={`px-3 py-1.5 rounded-xl ${s.bg} text-center`}>
              {ics !== null && (
                <p className={`text-lg font-bold font-serif leading-none ${s.text}`}>{ics}</p>
              )}
              <p className={`text-[10px] font-semibold ${s.text}`}>{s.label}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
