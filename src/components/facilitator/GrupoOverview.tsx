'use client'

import Link from 'next/link'
import type { EstadoPaciente, Grupo } from '@/types/database'
import { scoreRiesgoLabel, formatFecha } from '@/lib/utils'
import SemaforoIndicador from '@/components/patient/SemaforoIndicador'

interface Props {
  grupos: Grupo[]
  pacientes: EstadoPaciente[]
}

const SEMAFORO_PILLS: Record<string, { bg: string; color: string; dot: string; label: string }> = {
  rojo:     { bg: '#FEF2F2', color: '#991B1B', dot: '#EF4444', label: 'Rojo' },
  amarillo: { bg: '#FFFBEB', color: '#92400E', dot: '#F59E0B', label: 'Amarillo' },
  verde:    { bg: '#ECFDF5', color: '#065F46', dot: '#10B981', label: 'Verde' },
}

export default function GrupoOverview({ grupos, pacientes }: Props) {
  if (grupos.length === 0) {
    return (
      <div
        className="rounded-2xl p-12 text-center"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)' }}
      >
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: 'var(--surface-subtle)' }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ color: 'var(--text-muted)' }}>
            <circle cx="10" cy="9" r="4" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M3 23c0-3.87 3.13-7 7-7s7 3.13 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="20" cy="9" r="3" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M23 20c0-2.76-1.79-5.12-4.28-5.87" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="font-semibold text-text-primary">No tenés grupos creados</p>
        <p className="text-sm text-text-muted mt-1">Creá un grupo para empezar a gestionar pacientes.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {grupos.map(grupo => {
        const miembros = pacientes.filter(p => p.grupo_id === grupo.id)
        return (
          <div
            key={grupo.id}
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border-default)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            {/* Header */}
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid var(--border-default)' }}
            >
              <div>
                <h2 className="font-heading font-semibold text-text-primary">{grupo.nombre}</h2>
                <p className="text-xs text-text-muted mt-0.5">{miembros.length} participantes</p>
              </div>
              <div className="flex items-center gap-2">
                {(['rojo', 'amarillo', 'verde'] as const).map(color => {
                  const count = miembros.filter(p => p.semaforo === color).length
                  if (count === 0) return null
                  const pill = SEMAFORO_PILLS[color]
                  return (
                    <div
                      key={color}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ background: pill.bg, color: pill.color }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: pill.dot }} />
                      {count}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                    {['Paciente', 'Estado', 'IEM', 'Emoción', 'Racha', 'Riesgo', 'Último reg.', ''].map(h => (
                      <th
                        key={h}
                        className={`py-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted ${
                          h === 'Paciente' ? 'text-left px-6' : h === '' ? 'px-4' : 'text-center px-4'
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {miembros.map((paciente, idx) => {
                    const { label: riesgoLabel, color: riesgoColor } = scoreRiesgoLabel(paciente.score_riesgo)
                    const sinRegistroHoy = !paciente.ultimo_checkin || paciente.ultimo_checkin < new Date().toISOString().split('T')[0]

                    return (
                      <tr
                        key={paciente.id}
                        className="transition-colors"
                        style={{
                          borderBottom: idx < miembros.length - 1 ? '1px solid var(--border-default)' : 'none',
                          background: paciente.semaforo === 'rojo' ? 'rgba(239,68,68,0.03)' : 'transparent',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-subtle)')}
                        onMouseLeave={e => (e.currentTarget.style.background = paciente.semaforo === 'rojo' ? 'rgba(239,68,68,0.03)' : 'transparent')}
                      >
                        {/* Nombre */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                              style={{ background: 'var(--brand-primary)' }}
                            >
                              {paciente.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-sm text-text-primary">{paciente.nombre}</div>
                              {paciente.alertas_pendientes > 0 && (
                                <span className="text-[10px] font-semibold" style={{ color: '#EF4444' }}>
                                  {paciente.alertas_pendientes} alerta{paciente.alertas_pendientes > 1 ? 's' : ''} pendiente{paciente.alertas_pendientes > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Semáforo */}
                        <td className="px-4 py-4 text-center">
                          {paciente.semaforo ? (
                            <div className="flex justify-center">
                              <SemaforoIndicador estado={paciente.semaforo} size="sm" animated={paciente.semaforo === 'rojo'} />
                            </div>
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
                        </td>

                        {/* IEM */}
                        <td className="px-4 py-4 text-center">
                          {paciente.iem ? (
                            <span className="font-metric font-semibold text-text-primary">{paciente.iem}/7</span>
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
                        </td>

                        {/* Emoción */}
                        <td className="px-4 py-4 text-center text-xl">
                          {paciente.emocion ?? <span className="text-text-muted text-sm">—</span>}
                        </td>

                        {/* Racha */}
                        <td className="px-4 py-4 text-center">
                          <span className="text-sm text-text-secondary font-medium">
                            🔥 {paciente.racha_actual}d
                          </span>
                        </td>

                        {/* Score riesgo */}
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <div
                              className="h-1.5 rounded-full w-14 overflow-hidden"
                              style={{ background: 'var(--border-default)' }}
                            >
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${paciente.score_riesgo}%`,
                                  background: paciente.score_riesgo >= 60 ? '#EF4444' :
                                              paciente.score_riesgo >= 30 ? '#F59E0B' : '#10B981',
                                }}
                              />
                            </div>
                            <span className={`text-xs font-semibold ${riesgoColor}`}>{riesgoLabel}</span>
                          </div>
                        </td>

                        {/* Último registro */}
                        <td className="px-4 py-4 text-center">
                          <span
                            className="text-xs font-medium"
                            style={{ color: sinRegistroHoy ? '#EF4444' : 'var(--text-muted)' }}
                          >
                            {paciente.ultimo_checkin ? formatFecha(paciente.ultimo_checkin) : 'Nunca'}
                          </span>
                        </td>

                        {/* Acción */}
                        <td className="px-4 py-4">
                          <Link
                            href={`/dashboard/paciente/${paciente.id}`}
                            className="text-xs font-semibold text-brand-primary hover:underline whitespace-nowrap"
                          >
                            Ver ficha →
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {miembros.length === 0 && (
                <div className="text-center py-10 text-text-muted text-sm">
                  No hay pacientes en este grupo
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
