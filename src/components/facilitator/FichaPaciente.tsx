'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, CheckinSemanal, Alert } from '@/types/database'
import { formatRelativo, scoreRiesgoLabel, icsToSemaforo } from '@/lib/utils'
import SemaforoIndicador from '@/components/patient/SemaforoIndicador'
import StreakBadge from '@/components/patient/StreakBadge'

interface Props {
  paciente: User
  checkins: CheckinSemanal[]
  alertas: Alert[]
  rachaVerde: number
  scoreRiesgo: number
  facilitadorId: string
}

const SEMAFORO_TEXT: Record<string, { bg: string; color: string }> = {
  green:  { bg: '#ECFDF5', color: '#065F46' },
  amber:  { bg: '#FFFBEB', color: '#92400E' },
  red:    { bg: '#FEF2F2', color: '#991B1B' },
}

const SEMAFORO_LABEL: Record<string, string> = {
  green: 'Verde',
  amber: 'Amarillo',
  red:   'Rojo',
}

const DOMAIN_ICONS: Record<string, string> = {
  ica: '🎯',
  be:  '🧭',
  ini: '🧠',
}

export default function FichaPaciente({ paciente, checkins, alertas, rachaVerde, scoreRiesgo, facilitadorId }: Props) {
  const [alertasState, setAlertasState] = useState(alertas)
  const [tab, setTab] = useState<'timeline' | 'alertas'>('timeline')

  const ultimoCheckin = checkins[0]
  const { label: riesgoLabel, color: riesgoColor } = scoreRiesgoLabel(scoreRiesgo)

  const icsPromedio = checkins.length
    ? (checkins.reduce((sum, c) => sum + (c.scores?.ics ?? 0), 0) / checkins.length).toFixed(1)
    : '-'

  const semanasVerde = checkins.filter(c => c.semaphore === 'green').length
  const semanasRojo  = checkins.filter(c => c.semaphore === 'red').length
  const alertasPendientes = alertasState.filter(a => !a.is_read).length

  async function resolverAlerta(alertaId: string) {
    const supabase = createClient()
    await supabase.from('alerts').update({ is_read: true }).eq('id', alertaId)
    setAlertasState(prev => prev.map(a => a.id === alertaId ? { ...a, is_read: true } : a))
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
              <StreakBadge racha={rachaVerde} />
              {ultimoCheckin?.semaphore && (
                <SemaforoIndicador
                  estado={icsToSemaforo(ultimoCheckin.semaphore)}
                  size="sm"
                  animated={ultimoCheckin.semaphore === 'red'}
                />
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
          { label: 'Check-ins ICS', value: String(checkins.length),  accent: '#2563EB', bg: '#EFF6FF' },
          { label: 'ICS promedio',  value: String(icsPromedio),       accent: '#F59E0B', bg: '#FFFBEB' },
          { label: 'Semanas verde', value: String(semanasVerde),      accent: '#10B981', bg: '#ECFDF5' },
          { label: 'Semanas rojo',  value: String(semanasRojo),       accent: '#EF4444', bg: '#FEF2F2' },
        ].map(({ label, value, accent, bg }) => (
          <div key={label} className="card">
            <div className="w-2 h-2 rounded-full mb-2" style={{ background: accent }} />
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
          { key: 'timeline', label: 'Timeline ICS' },
          { key: 'alertas',  label: `Alertas${alertasPendientes > 0 ? ` (${alertasPendientes})` : ''}` },
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

      {/* Timeline ICS */}
      {tab === 'timeline' && (
        <div className="space-y-3">
          {checkins.length === 0 ? (
            <div className="card text-center py-8 text-text-muted text-sm">Sin check-ins ICS aún</div>
          ) : (
            checkins.map((checkin, index) => {
              const sc = SEMAFORO_TEXT[checkin.semaphore] ?? SEMAFORO_TEXT['green']
              const semLabel = SEMAFORO_LABEL[checkin.semaphore] ?? checkin.semaphore
              const fechaSemana = new Date(checkin.week_start + 'T00:00:00').toLocaleDateString('es-AR', {
                day: 'numeric', month: 'long',
              })

              return (
                <div key={checkin.id} className="card">
                  <div className="flex items-start gap-4">
                    <SemaforoIndicador
                      estado={icsToSemaforo(checkin.semaphore)}
                      size="md"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-text-primary">
                            Semana del {fechaSemana}
                          </span>
                          {index === 0 && (
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: '#EFF6FF', color: '#1E40AF' }}
                            >
                              Última
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-bold" style={{ color: sc.color }}>
                          ICS {checkin.scores?.ics ?? '—'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span
                          className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ background: sc.bg, color: sc.color }}
                        >
                          {semLabel}
                        </span>
                        <span className="text-xs text-text-muted">
                          ICA {checkin.scores?.ica ?? '—'}%
                        </span>
                        <span className="text-xs text-text-muted">
                          BE {checkin.scores?.be_norm ?? '—'}%
                        </span>
                        <span className="text-xs text-text-muted">
                          INI {checkin.scores?.ini_norm ?? '—'}%
                        </span>
                        {checkin.dominant_domain && (
                          <span className="text-xs text-text-muted">
                            {DOMAIN_ICONS[checkin.dominant_domain]} dominante
                          </span>
                        )}
                      </div>

                      {checkin.alerts && checkin.alerts.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {checkin.alerts.map(a => (
                            <span
                              key={a}
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                              style={{ background: '#FEF2F2', color: '#991B1B' }}
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Alertas ICS */}
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
                  alerta.is_read
                    ? { background: 'var(--surface-subtle)', border: '1px solid var(--border-default)', opacity: 0.6 }
                    : alerta.priority <= 1.5
                    ? { background: '#FEF2F2', border: '1px solid #FECACA' }
                    : { background: '#FFFBEB', border: '1px solid #FDE68A' }
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {alerta.is_read ? (
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: '#ECFDF5', color: '#065F46' }}
                        >
                          ✓ Leída
                        </span>
                      ) : (
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={
                            alerta.priority <= 1.5
                              ? { background: '#FEE2E2', color: '#991B1B' }
                              : { background: '#FEF3C7', color: '#92400E' }
                          }
                        >
                          {alerta.priority <= 1.5 ? '🚨 Urgente' : '👁 Observación'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-primary">{alerta.message}</p>
                    <p className="text-xs text-text-muted mt-1">{formatRelativo(alerta.created_at)}</p>
                  </div>
                  {!alerta.is_read && (
                    <button
                      onClick={() => resolverAlerta(alerta.id)}
                      className="btn-secondary text-xs px-3 py-1.5 whitespace-nowrap flex-shrink-0"
                      style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' }}
                    >
                      ✓ Marcar leída
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
