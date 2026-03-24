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
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/dashboard" className="hover:text-slate-600">Panel</Link>
        <span>/</span>
        <span className="text-slate-600">{paciente.nombre}</span>
      </div>

      {/* Header del paciente */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl">
            {paciente.nombre.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-800">{paciente.nombre}</h1>
              <StreakBadge racha={racha} />
              {ultimoCheckin?.semaforo && (
                <SemaforoIndicador estado={ultimoCheckin.semaforo} size="sm" animated={ultimoCheckin.semaforo === 'rojo'} />
              )}
            </div>
            <p className="text-slate-400 text-sm mt-1">{paciente.email}</p>

            {/* Score de riesgo */}
            <div className="flex items-center gap-4 mt-3">
              <div>
                <span className="text-xs text-slate-400">Score de riesgo</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        scoreRiesgo >= 60 ? 'bg-red-500' :
                        scoreRiesgo >= 30 ? 'bg-yellow-400' : 'bg-green-500'
                      }`}
                      style={{ width: `${scoreRiesgo}%` }}
                    />
                  </div>
                  <span className={`text-sm font-semibold ${riesgoColor}`}>{scoreRiesgo}/100 · {riesgoLabel}</span>
                </div>
              </div>
            </div>
          </div>

          {alertasPendientes > 0 && (
            <div className="bg-red-100 text-red-700 rounded-xl px-3 py-1.5 text-sm font-bold">
              {alertasPendientes} alerta{alertasPendientes > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatFicha label="Check-ins" value={String(checkins.length)} icon="📅" />
        <StatFicha label="IEM promedio" value={String(iemPromedio)} icon="⚡" />
        <StatFicha label="Días verde" value={String(diasVerde)} icon="🟢" />
        <StatFicha label="Días rojo" value={String(diasRojo)} icon="🔴" />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        {[
          { key: 'timeline', label: 'Timeline de eventos' },
          { key: 'alertas', label: `Alertas (${alertasPendientes})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Timeline de check-ins */}
      {tab === 'timeline' && (
        <div className="space-y-3">
          {checkins.length === 0 ? (
            <div className="text-center py-8 text-slate-400">Sin registros aún</div>
          ) : (
            checkins.map((checkin, index) => (
              <div key={checkin.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <SemaforoIndicador estado={checkin.semaforo} size="md" />

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700">{formatFecha(checkin.fecha)}</span>
                        {index === 0 && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Último</span>
                        )}
                      </div>
                      <span className="text-2xl">{checkin.emocion}</span>
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className={`text-sm font-medium ${SEMAFORO_CONFIG[checkin.semaforo].text}`}>
                        {SEMAFORO_CONFIG[checkin.semaforo].label}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-sm text-slate-500">
                        IEM {checkin.iem}/7 ({iemLabel(checkin.iem)})
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-sm text-slate-500">
                        {checkin.conductas_completadas?.length ?? 0} conductas ✓
                      </span>
                    </div>

                    {/* Mini barra IEM */}
                    <div className="flex gap-0.5 mt-2 h-1.5 w-32">
                      {[1, 2, 3, 4, 5, 6, 7].map(v => (
                        <div
                          key={v}
                          className={`flex-1 rounded-full ${
                            v <= checkin.iem
                              ? checkin.iem <= 2 ? 'bg-red-400' : checkin.iem <= 4 ? 'bg-yellow-400' : 'bg-green-400'
                              : 'bg-slate-100'
                          }`}
                        />
                      ))}
                    </div>

                    {checkin.notas && (
                      <p className="text-sm text-slate-500 italic mt-2">"{checkin.notas}"</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Alertas */}
      {tab === 'alertas' && (
        <div className="space-y-3">
          {alertasState.length === 0 ? (
            <div className="text-center py-8 text-slate-400">Sin alertas</div>
          ) : (
            alertasState.map(alerta => (
              <div
                key={alerta.id}
                className={`rounded-2xl border p-4 ${
                  alerta.resuelta
                    ? 'bg-slate-50 border-slate-200 opacity-60'
                    : alerta.prioridad === 'urgente'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {!alerta.resuelta && (
                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                          alerta.prioridad === 'urgente'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {alerta.prioridad === 'urgente' ? '🚨 Urgente' : '👁 Observación'}
                        </span>
                      )}
                      {alerta.resuelta && (
                        <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">
                          ✓ Resuelta
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 mt-1">{alerta.descripcion}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatRelativo(alerta.created_at)}</p>
                  </div>
                  {!alerta.resuelta && (
                    <button
                      onClick={() => resolverAlerta(alerta.id)}
                      className="text-xs bg-green-600 hover:bg-green-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
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

function StatFicha({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  )
}
