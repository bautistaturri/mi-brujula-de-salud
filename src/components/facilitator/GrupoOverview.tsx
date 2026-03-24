'use client'

import Link from 'next/link'
import type { EstadoPaciente, Grupo } from '@/types/database'
import { SEMAFORO_CONFIG } from '@/types/database'
import { scoreRiesgoLabel, formatFecha } from '@/lib/utils'
import SemaforoIndicador from '@/components/patient/SemaforoIndicador'

interface Props {
  grupos: Grupo[]
  pacientes: EstadoPaciente[]
}

export default function GrupoOverview({ grupos, pacientes }: Props) {
  if (grupos.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <div className="text-4xl mb-3">👥</div>
        <p className="text-slate-500">No tienes grupos creados aún.</p>
        <p className="text-sm text-slate-400 mt-1">Crea un grupo para empezar a gestionar pacientes.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {grupos.map(grupo => {
        const miembros = pacientes.filter(p => p.grupo_id === grupo.id)
        return (
          <div key={grupo.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Header del grupo */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-800">{grupo.nombre}</h2>
                <p className="text-sm text-slate-400">{miembros.length} participantes</p>
              </div>
              {/* Mini semáforos del grupo */}
              <div className="flex items-center gap-2">
                {(['rojo', 'amarillo', 'verde'] as const).map(color => {
                  const count = miembros.filter(p => p.semaforo === color).length
                  if (count === 0) return null
                  return (
                    <div key={color} className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${SEMAFORO_CONFIG[color].bg} ${SEMAFORO_CONFIG[color].text}`}>
                      <div className={`w-2 h-2 rounded-full ${color === 'verde' ? 'bg-green-500' : color === 'amarillo' ? 'bg-yellow-400' : 'bg-red-500'}`} />
                      {count}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Tabla de pacientes */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-slate-400 border-b border-slate-100">
                    <th className="text-left px-6 py-3 font-medium">Paciente</th>
                    <th className="text-center px-4 py-3 font-medium">Estado</th>
                    <th className="text-center px-4 py-3 font-medium">IEM</th>
                    <th className="text-center px-4 py-3 font-medium">Emoción</th>
                    <th className="text-center px-4 py-3 font-medium">Racha</th>
                    <th className="text-center px-4 py-3 font-medium">Riesgo</th>
                    <th className="text-center px-4 py-3 font-medium">Último</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {miembros.map(paciente => {
                    const { label: riesgoLabel, color: riesgoColor } = scoreRiesgoLabel(paciente.score_riesgo)
                    const sinRegistroHoy = !paciente.ultimo_checkin || paciente.ultimo_checkin < new Date().toISOString().split('T')[0]

                    return (
                      <tr
                        key={paciente.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          paciente.semaforo === 'rojo' ? 'bg-red-50/30' : ''
                        }`}
                      >
                        {/* Nombre */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                              {paciente.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-slate-700">{paciente.nombre}</div>
                              {paciente.alertas_pendientes > 0 && (
                                <span className="text-xs text-red-500 font-medium">
                                  {paciente.alertas_pendientes} alerta{paciente.alertas_pendientes > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Semáforo */}
                        <td className="px-4 py-4 text-center">
                          {paciente.semaforo ? (
                            <div className="flex justify-center">
                              <SemaforoIndicador
                                estado={paciente.semaforo}
                                size="sm"
                                animated={paciente.semaforo === 'rojo'}
                              />
                            </div>
                          ) : (
                            <span className="text-slate-300 text-lg">—</span>
                          )}
                        </td>

                        {/* IEM */}
                        <td className="px-4 py-4 text-center">
                          {paciente.iem ? (
                            <span className="font-bold text-slate-700">{paciente.iem}/7</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        {/* Emoción */}
                        <td className="px-4 py-4 text-center text-xl">
                          {paciente.emocion ?? <span className="text-slate-300 text-sm">—</span>}
                        </td>

                        {/* Racha */}
                        <td className="px-4 py-4 text-center">
                          <span className="text-sm text-slate-600">
                            🔥 {paciente.racha_actual}d
                          </span>
                        </td>

                        {/* Score riesgo */}
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <div
                              className="h-1.5 rounded-full bg-slate-200 w-16 overflow-hidden"
                            >
                              <div
                                className={`h-full rounded-full transition-all ${
                                  paciente.score_riesgo >= 60 ? 'bg-red-500' :
                                  paciente.score_riesgo >= 30 ? 'bg-yellow-400' : 'bg-green-500'
                                }`}
                                style={{ width: `${paciente.score_riesgo}%` }}
                              />
                            </div>
                            <span className={`text-xs font-medium ${riesgoColor}`}>{riesgoLabel}</span>
                          </div>
                        </td>

                        {/* Último registro */}
                        <td className="px-4 py-4 text-center">
                          <span className={`text-xs ${sinRegistroHoy ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                            {paciente.ultimo_checkin ? formatFecha(paciente.ultimo_checkin) : 'Nunca'}
                          </span>
                        </td>

                        {/* Acción */}
                        <td className="px-4 py-4">
                          <Link
                            href={`/dashboard/paciente/${paciente.id}`}
                            className="text-xs text-blue-600 hover:underline font-medium"
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
                <div className="text-center py-8 text-slate-400 text-sm">
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
