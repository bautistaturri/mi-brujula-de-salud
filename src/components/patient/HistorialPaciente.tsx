'use client'

import type { Checkin } from '@/types/database'
import { SEMAFORO_CONFIG } from '@/types/database'
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
    <div className="px-4 pt-6 pb-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-h2 font-bold text-text-primary">Mi historial</h1>
          <p className="text-sm text-text-muted mt-0.5">Todos tus check-ins registrados</p>
        </div>
        <StreakBadge racha={racha} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Registros"
          value={String(totalDias)}
          icon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M2 7h14M6 1v4M12 1v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          }
          colorScheme="blue"
        />
        <StatCard
          label="Días verde"
          value={String(diasVerde)}
          icon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M6 9l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
          colorScheme="green"
        />
        <StatCard
          label="IEM prom."
          value={String(iemPromedio)}
          icon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 14l4-4 3 3 4-6 3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
          colorScheme="amber"
        />
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {checkins.length === 0 ? (
          <div className="card text-center py-10">
            <div
              className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
              style={{ background: 'var(--surface-subtle)' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--text-muted)' }}>
                <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M3 9h18M9 3v4M15 3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="font-semibold text-text-primary">Aún no hay registros</p>
            <p className="text-sm text-text-muted mt-1">Hacé tu primer check-in para ver tu historial.</p>
          </div>
        ) : (
          checkins.map(checkin => {
            const semaforoColors = {
              verde:    { bg: 'var(--semaforo-verde-bg)',    text: 'var(--semaforo-verde-text)'    },
              amarillo: { bg: 'var(--semaforo-amarillo-bg)', text: 'var(--semaforo-amarillo-text)' },
              rojo:     { bg: 'var(--semaforo-rojo-bg)',     text: 'var(--semaforo-rojo-text)'     },
            }
            const sc = semaforoColors[checkin.semaforo]

            return (
              <div key={checkin.id} className="card">
                <div className="flex items-center gap-3">
                  <SemaforoIndicador estado={checkin.semaforo} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-text-primary">{formatFecha(checkin.fecha)}</span>
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                          style={{ background: 'var(--surface-subtle)', color: 'var(--text-muted)' }}
                        >
                          {checkin.turno === 'manana' ? '☀️ Mañana' : '🌙 Noche'}
                        </span>
                      </div>
                      <span className="text-xl flex-shrink-0">{checkin.emocion}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span
                        className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ background: sc.bg, color: sc.text }}
                      >
                        {SEMAFORO_CONFIG[checkin.semaforo].label}
                      </span>
                      <span className="text-xs text-text-muted">IEM {checkin.iem}/7 · {iemLabel(checkin.iem)}</span>
                      <span className="text-xs text-text-muted">{checkin.conductas_completadas?.length ?? 0} conductas</span>
                    </div>
                    {/* IEM bar */}
                    <div className="flex gap-0.5 mt-2 h-1 w-24">
                      {[1,2,3,4,5,6,7].map(v => (
                        <div
                          key={v}
                          className="flex-1 rounded-full"
                          style={{
                            background: v <= checkin.iem
                              ? checkin.iem <= 2 ? '#EF4444' : checkin.iem <= 4 ? '#F59E0B' : '#10B981'
                              : 'var(--border-default)',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                {checkin.notas && (
                  <p className="text-xs text-text-secondary italic mt-3 pl-10">&ldquo;{checkin.notas}&rdquo;</p>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

const STAT_COLORS = {
  blue:  'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
  green: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
  amber: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
}

function StatCard({
  label,
  value,
  icon,
  colorScheme,
}: {
  label: string
  value: string
  icon: React.ReactNode
  colorScheme: 'blue' | 'green' | 'amber'
}) {
  return (
    <div className="card text-center">
      <div className={`w-9 h-9 rounded-xl mx-auto mb-2 flex items-center justify-center ${STAT_COLORS[colorScheme]}`}>
        {icon}
      </div>
      <div className="font-metric text-xl font-bold text-text-primary tabular-nums">{value}</div>
      <div className="text-[10px] font-medium text-text-muted mt-0.5">{label}</div>
    </div>
  )
}
