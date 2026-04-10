'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Alert, AlertType, User } from '@/types/database'
import { formatRelativo } from '@/lib/utils'

interface Props {
  alertas: Alert[]
  pacientes: Pick<User, 'id' | 'nombre' | 'email' | 'avatar_url'>[]
}

const TIPO_ICONS: Record<AlertType, string> = {
  missing_checkin:        '📭',
  red_semaphore:          '🔴',
  amber_circumstantial:   '⚠️',
  amber_systemic:         '⚠️',
  be_critical:            '💔',
  ica_zero:               '🚫',
  ini_saboteador_streak:  '🧠',
  green_with_low_ica:     '👁️',
  green_streak_milestone: '🎉',
  combined_risk:          '⚡',
}

const TIPO_LABELS: Record<AlertType, string> = {
  missing_checkin:        'Sin check-in',
  red_semaphore:          'Semáforo rojo',
  amber_circumstantial:   'Semáforo amarillo',
  amber_systemic:         'Amarillo sistémico',
  be_critical:            'BE crítico',
  ica_zero:               'Sin conductas',
  ini_saboteador_streak:  'Saboteador acumulado',
  green_with_low_ica:     'ICA bajo (verde oculto)',
  green_streak_milestone: 'Racha verde ✨',
  combined_risk:          'Riesgo combinado',
}

function esUrgente(alerta: Alert): boolean {
  return alerta.priority <= 1.5 && alerta.color !== 'celebration'
}

export default function AlertasList({ alertas: alertasIniciales, pacientes }: Props) {
  const [alertas, setAlertas] = useState(alertasIniciales)
  const [filtro, setFiltro] = useState<'todas' | 'urgente' | 'observacion'>('todas')
  const [resolviendoId, setResolviendoId] = useState<string | null>(null)

  const pacienteMap = Object.fromEntries(pacientes.map(p => [p.id, p]))
  const alertasFiltradas = filtro === 'todas'
    ? alertas
    : filtro === 'urgente'
    ? alertas.filter(a => esUrgente(a))
    : alertas.filter(a => !esUrgente(a))

  const urgentes = alertas.filter(a => esUrgente(a)).length
  const observacion = alertas.filter(a => !esUrgente(a)).length

  async function resolverAlerta(alertaId: string) {
    setResolviendoId(alertaId)
    const supabase = createClient()
    await supabase
      .from('alerts')
      .update({ is_read: true })
      .eq('id', alertaId)
    setAlertas(prev => prev.filter(a => a.id !== alertaId))
    setResolviendoId(null)
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2">
        {[
          { key: 'todas',      label: `Todas (${alertas.length})` },
          { key: 'urgente',    label: `Urgente (${urgentes})`,     color: 'text-red-600' },
          { key: 'observacion',label: `Observación (${observacion})`, color: 'text-yellow-600' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key as typeof filtro)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filtro === f.key
                ? 'bg-[#1B3A5C] dark:bg-[#3B82F6] text-white'
                : `bg-surface-card border ${f.color ?? 'text-text-secondary'} hover:bg-surface-subtle`
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {alertasFiltradas.length === 0 ? (
        <div className="bg-surface-card rounded-2xl border p-12 text-center">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-text-secondary font-medium">No hay alertas pendientes</p>
          <p className="text-sm text-text-muted mt-1">Todos tus pacientes están al día</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alertasFiltradas.map(alerta => {
            const paciente = pacienteMap[alerta.patient_id]
            const urgente = esUrgente(alerta)
            const tipo = alerta.type as AlertType

            return (
              <div
                key={alerta.id}
                className={`rounded-2xl border-2 p-5 transition-all ${
                  urgente
                    ? 'bg-red-50/30 dark:bg-red-950/20 border-red-200 dark:border-red-900'
                    : 'bg-yellow-50/30 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icono tipo */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${
                    urgente ? 'bg-red-100 dark:bg-red-900/40' : 'bg-yellow-100 dark:bg-yellow-900/40'
                  }`}>
                    {TIPO_ICONS[tipo] ?? '⚠️'}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                            urgente
                              ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                              : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'
                          }`}>
                            {urgente ? '🚨 Urgente' : '👁 Observación'}
                          </span>
                          <span className="text-xs text-text-muted bg-surface-subtle px-2 py-0.5 rounded-full">
                            {TIPO_LABELS[tipo] ?? alerta.type}
                          </span>
                        </div>
                        <p className="text-text-primary mt-2">{alerta.message}</p>
                      </div>
                      <span className="text-xs text-text-muted whitespace-nowrap flex-shrink-0">
                        {formatRelativo(alerta.created_at)}
                      </span>
                    </div>

                    {/* Paciente */}
                    {paciente && (
                      <div className="flex items-center gap-3 mt-3">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                          {paciente.nombre.charAt(0).toUpperCase()}
                        </div>
                        <Link
                          href={`/dashboard/paciente/${paciente.id}`}
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          {paciente.nombre}
                        </Link>
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => resolverAlerta(alerta.id)}
                        disabled={resolviendoId === alerta.id}
                        className="text-xs bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
                      >
                        {resolviendoId === alerta.id ? 'Resolviendo...' : '✓ Marcar como leída'}
                      </button>
                      {paciente && (
                        <Link
                          href={`/dashboard/paciente/${paciente.id}`}
                          className="text-xs border text-text-secondary hover:bg-surface-subtle font-medium px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Ver ficha →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
