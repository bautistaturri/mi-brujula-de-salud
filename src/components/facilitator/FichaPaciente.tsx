'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Checkin, Alerta } from '@/types/database'
import { SEMAFORO_CONFIG } from '@/types/database'
import { formatFecha, formatRelativo, iemLabel, scoreRiesgoLabel } from '@/lib/utils'
import SemaforoIndicador from '@/components/patient/SemaforoIndicador'
import StreakBadge from '@/components/patient/StreakBadge'

interface Props {
  paciente: User
  checkins: Checkin[]
  alertas: Alerta[]
  racha: number
  scoreRiesgo: number
  facilitadorId: string
}

const SEMAFORO_TEXT: Record<string, { bg: string; color: string }> = {
  verde:    { bg: '#ECFDF5', color: '#065F46' },
  amarillo: { bg: '#FFFBEB', color: '#92400E' },
  rojo:     { bg: '#FEF2F2', color: '#991B1B' },
}

export default function FichaPaciente({ paciente, checkins, alertas, racha, scoreRiesgo, facilitadorId }: Props) {
  const [alertasState, setAlertasState] = useState(alertas)
  const [tab, setTab] = useState<'timeline' | 'alertas'>('timeline')

  const ultimoCheckin = checkins[0]
  const { label: riesgoLabel, color: riesgoColor } = scoreRiesgoLabel(scoreRiesgo)

  const iemPromedio = checkins.length
    ? (checkins.reduce((sum, c) => sum + c.iem, 0) / checkins.length).toFixed(1)
    : '-'

  const diasVerde = checkins.filter(c => c.semaforo === 'verde').length
  const diasRojo = checkins.filter(c => c.semaforo === 'rojo').length
  const alertasPendientes = alertasState.filter(a => !a.resuelta).length

  async function resolverAlerta(alertaId: string) {
    const supabase = createClient()
    await supabase.from('alertas').update({
      resuelta: true,
      resuelta_at: new Date().toISOString(),
      resuelta_por: facilitadorId,
    }).eq('id', alertaId)
    setAlertasState(prev => prev.map(a => a.id === alertaId ? { ...a, resuelta: true } : a))
  }

  return (
    <div className="space-y-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/dashboard" className="text-text-muted hover:text-text-primary transition-colors">Panel</Link>
        <span className="text-text-muted">/</span>
        <span className="text-text-primary font-medium">{paciente.nombre}</span>
      </div>

      {/* Header */}
      <div className="card">
        <div className="flex items-start gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
            style={{ background: 'var(--brand-primary)' }}
          >
            {paciente.nombre.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-heading text-h3 font-bold text-text-primary">{paciente.nombre}</h1>
              <StreakBadge racha={racha} />
              {ultimoCheckin?.semaforo && (
                <SemaforoIndicador estado={ultimoCheckin.semaforo} size="sm" animated={ultimoCheckin.semaforo === 'rojo'} />
              )}
            </div>
            <p className="text-sm text-text-muted mt-0.5">{paciente.email}</p>

            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-text-muted">Score de riesgo</span>
              <div
                className="h-1.5 w-24 rounded-full overflow-hidden"
                style={{ background: 'var(--border-default)' }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${scoreRiesgo}%`,
                    background: scoreRiesgo >= 60 ? '#EF4444' : scoreRiesgo >= 30 ? '#F59E0B' : '#10B981',
                  }}
                />
              </div>
              <span className={`text-xs font-semibold ${riesgoColor}`}>{scoreRiesgo}/100 · {riesgoLabel}</span>
            </div>
          </div>

          {alertasPendientes > 0 && (
            <span
              className="px-3 py-1.5 rounded-xl text-sm font-bold flex-shrink-0"
              style={{ background: '#FEF2F2', color: '#991B1B' }}
            >
              {alertasPendientes} alerta{alertasPendientes > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Link a registros semanales */}
      <Link
        href={`/dashboard/paciente/${paciente.id}/registros`}
        className="flex items-center justify-between rounded-xl px-5 py-4 transition-colors"
        style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}
        onMouseEnter={e => (e.currentTarget.style.background = '#DBEAFE')}
        onMouseLeave={e => (e.currentTarget.style.background = '#EFF6FF')}
      >
        <div>
          <p className="font-semibold text-sm" style={{ color: '#1E40AF' }}>Registros semanales</p>
          <p className="text-xs mt-0.5" style={{ color: '#3B82F6' }}>Ver evolución, gráfico de score y logros desbloqueados</p>
        </div>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ color: '#93C5FD' }}>
          <path d="M7 4l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Link>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Check-ins', value: String(checkins.length), accent: '#2563EB', bg: '#EFF6FF' },
          { label: 'IEM promedio', value: String(iemPromedio), accent: '#F59E0B', bg: '#FFFBEB' },
          { label: 'Días verde', value: String(diasVerde), accent: '#10B981', bg: '#ECFDF5' },
          { label: 'Días rojo', value: String(diasRojo), accent: '#EF4444', bg: '#FEF2F2' },
        ].map(({ label, value, accent, bg }) => (
          <div key={label} className="card">
            <div
              className="w-2 h-2 rounded-full mb-2"
              style={{ background: accent }}
            />
            <div className="font-metric text-2xl font-bold text-text-primary tabular-nums">{value}</div>
            <div className="text-xs text-text-muted mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ background: 'var(--surface-subtle)' }}
      >
        {[
          { key: 'timeline', label: 'Timeline de eventos' },
          { key: 'alertas', label: `Alertas${alertasPendientes > 0 ? ` (${alertasPendientes})` : ''}` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={
              tab === t.key
                ? { background: 'var(--surface-card)', color: 'var(--text-primary)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                : { color: 'var(--text-muted)' }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {tab === 'timeline' && (
        <div className="space-y-3">
          {checkins.length === 0 ? (
            <div className="card text-center py-8 text-text-muted text-sm">Sin registros aún</div>
          ) : (
            checkins.map((checkin, index) => {
              const sc = SEMAFORO_TEXT[checkin.semaforo] ?? SEMAFORO_TEXT['verde']
              return (
                <div key={checkin.id} className="card">
                  <div className="flex items-start gap-4">
                    <SemaforoIndicador estado={checkin.semaforo} size="md" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-text-primary">{formatFecha(checkin.fecha)}</span>
                          {index === 0 && (
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: '#EFF6FF', color: '#1E40AF' }}
                            >
                              Último
                            </span>
                          )}
                          <span
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                            style={{ background: 'var(--surface-subtle)', color: 'var(--text-muted)' }}
                          >
                            {checkin.turno === 'manana' ? '☀️ Mañana' : '🌙 Noche'}
                          </span>
                        </div>
                        <span className="text-xl">{checkin.emocion}</span>
                      </div>

                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span
                          className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ background: sc.bg, color: sc.color }}
                        >
                          {SEMAFORO_CONFIG[checkin.semaforo].label}
                        </span>
                        <span className="text-xs text-text-muted">IEM {checkin.iem}/7 · {iemLabel(checkin.iem)}</span>
                        <span className="text-xs text-text-muted">{checkin.conductas_completadas?.length ?? 0} conductas ✓</span>
                      </div>

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

                      {checkin.notas && (
                        <p className="text-xs text-text-secondary italic mt-2">"{checkin.notas}"</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Alertas */}
      {tab === 'alertas' && (
        <div className="space-y-3">
          {alertasState.length === 0 ? (
            <div className="card text-center py-8 text-text-muted text-sm">Sin alertas registradas</div>
          ) : (
            alertasState.map(alerta => (
              <div
                key={alerta.id}
                className="rounded-xl p-4"
                style={
                  alerta.resuelta
                    ? { background: 'var(--surface-subtle)', border: '1px solid var(--border-default)', opacity: 0.6 }
                    : alerta.prioridad === 'urgente'
                    ? { background: '#FEF2F2', border: '1px solid #FECACA' }
                    : { background: '#FFFBEB', border: '1px solid #FDE68A' }
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {alerta.resuelta ? (
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: '#ECFDF5', color: '#065F46' }}
                        >
                          ✓ Resuelta
                        </span>
                      ) : (
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={
                            alerta.prioridad === 'urgente'
                              ? { background: '#FEE2E2', color: '#991B1B' }
                              : { background: '#FEF3C7', color: '#92400E' }
                          }
                        >
                          {alerta.prioridad === 'urgente' ? '🚨 Urgente' : '👁 Observación'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-primary">{alerta.descripcion}</p>
                    <p className="text-xs text-text-muted mt-1">{formatRelativo(alerta.created_at)}</p>
                  </div>
                  {!alerta.resuelta && (
                    <button
                      onClick={() => resolverAlerta(alerta.id)}
                      className="btn-secondary text-xs px-3 py-1.5 whitespace-nowrap flex-shrink-0"
                      style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' }}
                    >
                      ✓ Resolver
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
