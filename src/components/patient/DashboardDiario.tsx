'use client'

import Link from 'next/link'
import type { Checkin, ConductaAncla, Semaforo } from '@/types/database'
import { SEMAFORO_CONFIG } from '@/types/database'
import { iemLabel } from '@/lib/utils'
import SemaforoIndicador from './SemaforoIndicador'
import StreakBadge from './StreakBadge'

interface Props {
  userId: string
  nombre: string
  checkinManana: Checkin | null
  checkinNoche: Checkin | null
  conductas: ConductaAncla[]
  racha: number
  historial: { fecha: string; semaforo: Semaforo; iem: number; turno?: string }[]
}

const MENSAJES_SEMAFORO: Record<Semaforo, { titulo: string; cuerpo: string }> = {
  verde: {
    titulo: 'Estado óptimo',
    cuerpo: 'Tu energía y hábitos están en buen nivel. Seguí así.',
  },
  amarillo: {
    titulo: 'Estado moderado',
    cuerpo: 'Hay aspectos para mejorar. Prestá atención a tu descanso y alimentación.',
  },
  rojo: {
    titulo: 'Requiere atención',
    cuerpo: 'Tu estado generó una alerta. Tu equipo de salud puede verlo. No estás sola.',
  },
}

export default function DashboardDiario({
  nombre,
  checkinManana,
  checkinNoche,
  conductas,
  racha,
  historial,
}: Props) {
  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'
  const hoy = new Date().toISOString().split('T')[0]

  // El check-in principal para mostrar el estado: prioriza noche
  const checkinPrincipal = checkinNoche ?? checkinManana
  const turnoActual = hora < 15 ? 'manana' : 'noche'
  const checkinTurnoActual = turnoActual === 'manana' ? checkinManana : checkinNoche

  const conductasCompletadas = checkinPrincipal?.conductas_completadas?.length ?? 0
  const totalConductas = conductas.length

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium">{saludo}</p>
          <h1 className="text-2xl font-bold text-slate-800 mt-0.5">
            {nombre.split(' ')[0]}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <StreakBadge racha={racha} />
      </div>

      {/* ── Turnos del día ── */}
      <TurnosDia checkinManana={checkinManana} checkinNoche={checkinNoche} turnoActual={turnoActual} />

      {/* ── Estado del día (si ya hizo algún check-in) ── */}
      {checkinPrincipal && (
        <EstadoHoy checkin={checkinPrincipal} />
      )}

      {/* ── Conductas ancla ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 pt-4 pb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-700 text-sm">Conductas ancla</h2>
          {checkinPrincipal && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              conductasCompletadas === totalConductas
                ? 'bg-green-100 text-green-700'
                : conductasCompletadas >= totalConductas / 2
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {conductasCompletadas}/{totalConductas}
            </span>
          )}
        </div>

        {checkinPrincipal && totalConductas > 0 && (
          <div className="px-5 pb-3">
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  conductasCompletadas === totalConductas ? 'bg-green-500' :
                  conductasCompletadas >= totalConductas / 2 ? 'bg-yellow-400' : 'bg-red-400'
                }`}
                style={{ width: `${(conductasCompletadas / totalConductas) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="px-5 pb-4 space-y-2">
          {conductas.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-2">Sin conductas configuradas</p>
          ) : (
            conductas.map(conducta => {
              const completada = checkinPrincipal?.conductas_completadas?.includes(conducta.id) ?? false
              return (
                <div
                  key={conducta.id}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    completada ? 'bg-green-50' : 'bg-slate-50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    completada ? 'bg-green-500' : 'bg-slate-200'
                  }`}>
                    {completada && <span className="text-white text-[10px] font-bold">✓</span>}
                  </div>
                  <span className="text-lg leading-none">{conducta.icono}</span>
                  <span className={`text-sm flex-1 ${
                    completada ? 'text-green-700 line-through decoration-green-400' : 'text-slate-600'
                  }`}>
                    {conducta.nombre}
                  </span>
                </div>
              )
            })
          )}
          {!checkinPrincipal && (
            <p className="text-xs text-slate-400 text-center pt-1">
              Registralas en tu check-in
            </p>
          )}
        </div>
      </div>

      {/* ── Últimos 7 días ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-700 text-sm">Últimos 7 días</h2>
          <Link href="/historial" className="text-xs text-blue-600 font-medium hover:underline">
            Ver historial →
          </Link>
        </div>
        <UltimaSemana historial={historial} hoy={hoy} />
        <LeyendaSemaforo />
      </div>

      {/* ── Mensaje de apoyo ── */}
      {checkinPrincipal && (
        <MensajeApoyo semaforo={checkinPrincipal.semaforo} />
      )}

      {/* ── Info de seguimiento ── */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
        <span className="text-xl mt-0.5">🏥</span>
        <div>
          <p className="text-sm font-semibold text-blue-800">Seguimiento activo</p>
          <p className="text-xs text-blue-600 mt-0.5 leading-relaxed">
            Tu equipo de salud puede ver tu estado. Si tu semáforo es rojo, recibirán una alerta automática.
          </p>
        </div>
      </div>

    </div>
  )
}

// ── Sub-componentes ──

function TurnosDia({
  checkinManana,
  checkinNoche,
  turnoActual,
}: {
  checkinManana: Checkin | null
  checkinNoche: Checkin | null
  turnoActual: 'manana' | 'noche'
}) {
  const slots = [
    { turno: 'manana' as const, label: 'Mañana', icono: '☀️', checkin: checkinManana },
    { turno: 'noche' as const, label: 'Noche', icono: '🌙', checkin: checkinNoche },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {slots.map(({ turno, label, icono, checkin }) => {
        const esActual = turno === turnoActual
        const listo = !!checkin

        return listo ? (
          <div
            key={turno}
            className={`rounded-2xl p-4 border ${
              SEMAFORO_CONFIG[checkin!.semaforo].bg
            } ${SEMAFORO_CONFIG[checkin!.semaforo].border}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-slate-700">{icono} {label}</span>
              <span className="text-green-600 text-xs font-bold">✓ Listo</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{checkin!.emocion}</span>
              <span className={`text-xs font-medium ${SEMAFORO_CONFIG[checkin!.semaforo].text}`}>
                IEM {checkin!.iem}/7
              </span>
            </div>
          </div>
        ) : (
          <Link
            key={turno}
            href="/checkin"
            className={`rounded-2xl p-4 border-2 transition-all ${
              esActual
                ? 'border-blue-400 bg-blue-50 hover:bg-blue-100'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-slate-700">{icono} {label}</span>
              {esActual && (
                <span className="text-blue-600 text-xs font-bold animate-pulse">Pendiente</span>
              )}
            </div>
            <p className={`text-xs ${esActual ? 'text-blue-600' : 'text-slate-400'}`}>
              {esActual ? 'Tocá para registrar →' : 'Sin registro'}
            </p>
          </Link>
        )
      })}
    </div>
  )
}

function EstadoHoy({ checkin }: { checkin: Checkin }) {
  const config = SEMAFORO_CONFIG[checkin.semaforo]
  const mensaje = MENSAJES_SEMAFORO[checkin.semaforo]

  return (
    <div className={`rounded-2xl p-5 ${config.bg} border ${config.border}`}>
      <div className="flex items-center gap-4 mb-3">
        <SemaforoIndicador estado={checkin.semaforo} size="lg" animated={checkin.semaforo === 'rojo'} />
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Estado del día</p>
          <p className={`text-xl font-bold ${config.text}`}>{mensaje.titulo}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-2xl leading-none">{checkin.emocion}</span>
            <span className="text-sm text-slate-500">
              IEM <strong className="text-slate-700">{checkin.iem}/7</strong>
              <span className="text-slate-400"> · {iemLabel(checkin.iem)}</span>
            </span>
          </div>
        </div>
      </div>

      <p className={`text-sm ${config.text} opacity-80`}>{mensaje.cuerpo}</p>

      {checkin.notas && (
        <div className="mt-3 pt-3 border-t border-current border-opacity-20">
          <p className="text-xs text-slate-400 mb-1">Tu nota</p>
          <p className="text-sm text-slate-600 italic">"{checkin.notas}"</p>
        </div>
      )}
    </div>
  )
}

function UltimaSemana({
  historial,
  hoy,
}: {
  historial: { fecha: string; semaforo: Semaforo; iem: number; turno?: string }[]
  hoy: string
}) {
  const dias = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const fechaStr = d.toISOString().split('T')[0]
    // Priorizar noche si hay 2 registros del mismo día
    const registro =
      historial.find(h => h.fecha === fechaStr && h.turno === 'noche') ??
      historial.find(h => h.fecha === fechaStr)
    return { fecha: fechaStr, registro, esHoy: fechaStr === hoy, dia: d }
  })

  return (
    <div className="flex justify-between items-end gap-1">
      {dias.map(({ fecha, registro, esHoy, dia }) => (
        <div key={fecha} className="flex flex-col items-center gap-1.5 flex-1">
          <div className="relative flex items-center justify-center">
            {esHoy && registro?.semaforo === 'rojo' && (
              <div className="absolute w-7 h-7 rounded-full bg-red-400 opacity-30 animate-ping" />
            )}
            <div
              className={`w-7 h-7 rounded-full border-2 transition-all ${
                esHoy ? 'border-blue-400 scale-110' : 'border-transparent'
              } ${
                registro?.semaforo === 'verde' ? 'bg-green-500' :
                registro?.semaforo === 'amarillo' ? 'bg-yellow-400' :
                registro?.semaforo === 'rojo' ? 'bg-red-500' :
                'bg-slate-200'
              }`}
            />
          </div>
          <span className={`text-[10px] font-medium ${esHoy ? 'text-blue-600' : 'text-slate-400'}`}>
            {esHoy ? 'Hoy' : dia.toLocaleDateString('es', { weekday: 'narrow' })}
          </span>
        </div>
      ))}
    </div>
  )
}

function LeyendaSemaforo() {
  return (
    <div className="flex items-center gap-3 mt-4 justify-center">
      {(['verde', 'amarillo', 'rojo'] as Semaforo[]).map(s => (
        <div key={s} className="flex items-center gap-1.5">
          <div className={`w-2.5 h-2.5 rounded-full ${
            s === 'verde' ? 'bg-green-500' : s === 'amarillo' ? 'bg-yellow-400' : 'bg-red-500'
          }`} />
          <span className="text-[10px] text-slate-400 capitalize">{SEMAFORO_CONFIG[s].label}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
        <span className="text-[10px] text-slate-400">Sin registro</span>
      </div>
    </div>
  )
}

function MensajeApoyo({ semaforo }: { semaforo: Semaforo }) {
  const mensajes = {
    verde: {
      bg: 'bg-green-50 border-green-100',
      icono: '💚',
      texto: 'Mantené la constancia. Cada día que registrás suma a tu historial de salud.',
    },
    amarillo: {
      bg: 'bg-yellow-50 border-yellow-100',
      icono: '💛',
      texto: 'Pequeñas mejoras en sueño o hidratación pueden marcar la diferencia mañana.',
    },
    rojo: {
      bg: 'bg-red-50 border-red-100',
      icono: '❤️',
      texto: 'Es importante que te cuides hoy. Si necesitás apoyo, podés contactar a tu médica.',
    },
  }

  const m = mensajes[semaforo]

  return (
    <div className={`rounded-2xl border p-4 flex items-start gap-3 ${m.bg}`}>
      <span className="text-xl mt-0.5">{m.icono}</span>
      <p className="text-sm text-slate-600 leading-relaxed">{m.texto}</p>
    </div>
  )
}
