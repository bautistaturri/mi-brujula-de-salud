'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Alerta, User } from '@/types/database'
import { formatFecha, formatRelativo } from '@/lib/utils'

interface Props {
  alertas: Alerta[]
  pacientes: Pick<User, 'id' | 'nombre' | 'email' | 'avatar_url'>[]
}

const TIPO_ICONS: Record<string, string> = {
  ausencia: '📭',
  iem_bajo: '⚡',
  semaforo_rojo: '🔴',
  racha_rota: '💔',
  riesgo_alto: '⚠️',
}

const TIPO_LABELS: Record<string, string> = {
  ausencia: 'Sin registro',
  iem_bajo: 'IEM bajo',
  semaforo_rojo: 'Semáforo rojo',
  racha_rota: 'Racha rota',
  riesgo_alto: 'Riesgo alto',
}

export default function AlertasList({ alertas: alertasIniciales, pacientes }: Props) {
  const [alertas, setAlertas] = useState(alertasIniciales)
  const [filtro, setFiltro] = useState<'todas' | 'urgente' | 'observacion'>('todas')
  const [resolviendoId, setResolviendoId] = useState<string | null>(null)

  const pacienteMap = Object.fromEntries(pacientes.map(p => [p.id, p]))
  const alertasFiltradas = filtro === 'todas' ? alertas : alertas.filter(a => a.prioridad === filtro)

  const urgentes = alertas.filter(a => a.prioridad === 'urgente').length
  const observacion = alertas.filter(a => a.prioridad === 'observacion').length

  async function resolverAlerta(alertaId: string) {
    setResolviendoId(alertaId)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    await supabase
      .from('alertas')
      .update({
        resuelta: true,
        resuelta_at: new Date().toISOString(),
        resuelta_por: user?.id,
      })
      .eq('id', alertaId)

    setAlertas(prev => prev.filter(a => a.id !== alertaId))
    setResolviendoId(null)
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2">
        {[
          { key: 'todas', label: `Todas (${alertas.length})` },
          { key: 'urgente', label: `Urgente (${urgentes})`, color: 'text-red-600' },
          { key: 'observacion', label: `Observación (${observacion})`, color: 'text-yellow-600' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key as typeof filtro)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filtro === f.key
                ? 'bg-slate-800 text-white'
                : `bg-white border border-slate-200 ${f.color ?? 'text-slate-600'} hover:bg-slate-50`
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {alertasFiltradas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-slate-500 font-medium">No hay alertas pendientes</p>
          <p className="text-sm text-slate-400 mt-1">Todos tus pacientes están al día</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alertasFiltradas.map(alerta => {
            const paciente = pacienteMap[alerta.user_id]
            const esUrgente = alerta.prioridad === 'urgente'

            return (
              <div
                key={alerta.id}
                className={`bg-white rounded-2xl border-2 p-5 transition-all ${
                  esUrgente ? 'border-red-200 bg-red-50/20' : 'border-yellow-200 bg-yellow-50/20'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icono tipo */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${
                    esUrgente ? 'bg-red-100' : 'bg-yellow-100'
                  }`}>
                    {TIPO_ICONS[alerta.tipo]}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                            esUrgente
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {esUrgente ? '🚨 Urgente' : '👁 Observación'}
                          </span>
                          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            {TIPO_LABELS[alerta.tipo]}
                          </span>
                        </div>
                        <p className="text-slate-700 mt-2">{alerta.descripcion}</p>
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">
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
                        <span className="text-xs text-slate-400">· {formatFecha(alerta.fecha)}</span>
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => resolverAlerta(alerta.id)}
                        disabled={resolviendoId === alerta.id}
                        className="text-xs bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
                      >
                        {resolviendoId === alerta.id ? 'Resolviendo...' : '✓ Marcar como resuelta'}
                      </button>
                      {paciente && (
                        <Link
                          href={`/dashboard/paciente/${paciente.id}`}
                          className="text-xs border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium px-3 py-1.5 rounded-lg transition-colors"
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
