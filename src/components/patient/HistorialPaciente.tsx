'use client'

import type { Checkin } from '@/types/database'
import { SEMAFORO_CONFIG, EMOCIONES } from '@/types/database'
import { formatFecha, iemLabel } from '@/lib/utils'
import SemaforoIndicador from './SemaforoIndicador'
import StreakBadge from './StreakBadge'

interface Props {
  checkins: Checkin[]
  racha: number
}

export default function HistorialPaciente({ checkins, racha }: Props) {
  const totalDias = new Set(checkins.map(c => c.fecha)).size
  const diasVerde = checkins.filter(c => c.semaforo === 'verde').length
  const iemPromedio = checkins.length
    ? (checkins.reduce((sum, c) => sum + c.iem, 0) / checkins.length).toFixed(1)
    : '-'

  return (
    <div className="px-4 pt-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Mi historial</h1>
        <StreakBadge racha={racha} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Registros" value={String(totalDias)} icon="📅" />
        <StatCard label="Días verde" value={`${diasVerde}`} icon="🟢" />
        <StatCard label="IEM prom." value={String(iemPromedio)} icon="⚡" />
      </div>

      {/* Lista de check-ins */}
      <div className="space-y-3">
        {checkins.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <div className="text-4xl mb-3">📭</div>
            <p>Aún no hay registros</p>
          </div>
        ) : (
          checkins.map(checkin => (
            <div
              key={checkin.id}
              className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <SemaforoIndicador estado={checkin.semaforo} size="md" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700">{formatFecha(checkin.fecha)}</span>
                      <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                        {checkin.turno === 'manana' ? '☀️ Mañana' : '🌙 Noche'}
                      </span>
                    </div>
                    <span className="text-2xl">{checkin.emocion}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-sm ${SEMAFORO_CONFIG[checkin.semaforo].text}`}>
                      {SEMAFORO_CONFIG[checkin.semaforo].label}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-sm text-slate-500">
                      IEM {checkin.iem}/7 · {iemLabel(checkin.iem)}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-sm text-slate-500">
                      {checkin.conductas_completadas?.length ?? 0} conductas
                    </span>
                  </div>
                </div>
              </div>
              {checkin.notas && (
                <p className="text-sm text-slate-500 italic mt-3 pl-11">"{checkin.notas}"</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xl font-bold text-slate-800">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  )
}
