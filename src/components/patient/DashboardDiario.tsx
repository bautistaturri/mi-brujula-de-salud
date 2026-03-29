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

const STATUS_COLORS: Record<Semaforo, { bg: string; border: string; text: string; dot: string }> = {
  verde:    { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46', dot: '#10B981' },
  amarillo: { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', dot: '#F59E0B' },
  rojo:     { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', dot: '#EF4444' },
}

const MENSAJES_SEMAFORO: Record<Semaforo, { titulo: string; cuerpo: string }> = {
  verde:    { titulo: 'Estado óptimo',   cuerpo: 'Tu energía y hábitos están en buen nivel. Seguí así.' },
  amarillo: { titulo: 'Estado moderado', cuerpo: 'Hay aspectos para mejorar. Prestá atención a tu descanso.' },
  rojo:     { titulo: 'Requiere atención', cuerpo: 'Tu estado generó una alerta. Tu equipo de salud puede verlo.' },
}

export default function DashboardDiario({ nombre, checkinManana, checkinNoche, conductas, racha, historial }: Props) {
  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'
  const hoy = new Date().toISOString().split('T')[0]

  const checkinPrincipal = checkinNoche ?? checkinManana
  const turnoActual = hora < 15 ? 'manana' : 'noche'

  const conductasCompletadas = checkinPrincipal?.conductas_completadas?.length ?? 0
  const totalConductas = conductas.length

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-text-secondary">{saludo}</p>
          <h1 className="font-heading text-h2 font-bold text-text-primary mt-0.5">
            {nombre.split(' ')[0]}
          </h1>
          <p className="text-xs text-text-muted mt-0.5 capitalize">
            {new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <StreakBadge racha={racha} />
      </div>

      {/* ── Turnos del día ── */}
      <TurnosDia checkinManana={checkinManana} checkinNoche={checkinNoche} turnoActual={turnoActual} />

      {/* ── Estado del día ── */}
      {checkinPrincipal && <EstadoHoy checkin={checkinPrincipal} />}

      {/* ── Conductas ancla ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm text-text-primary">Conductas ancla</h2>
          {checkinPrincipal && totalConductas > 0 && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={
                conductasCompletadas === totalConductas
                  ? { background: '#ECFDF5', color: '#065F46' }
                  : conductasCompletadas >= totalConductas / 2
                  ? { background: '#FFFBEB', color: '#92400E' }
                  : { background: '#FEF2F2', color: '#991B1B' }
              }
            >
              {conductasCompletadas}/{totalConductas}
            </span>
          )}
        </div>

        {checkinPrincipal && totalConductas > 0 && (
          <div className="h-1.5 bg-surface-subtle rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(conductasCompletadas / totalConductas) * 100}%`,
                background: conductasCompletadas === totalConductas ? '#10B981' :
                            conductasCompletadas >= totalConductas / 2 ? '#F59E0B' : '#EF4444',
              }}
            />
          </div>
        )}

        <div className="space-y-2">
          {conductas.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-2">Sin conductas configuradas</p>
          ) : (
            conductas.map(conducta => {
              const completada = checkinPrincipal?.conductas_completadas?.includes(conducta.id) ?? false
              return (
                <div
                  key={conducta.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{ background: completada ? '#ECFDF5' : 'var(--surface-subtle)' }}
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: completada ? '#10B981' : 'var(--border-default)' }}
                  >
                    {completada && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-lg leading-none">{conducta.icono}</span>
                  <span
                    className="text-sm flex-1"
                    style={{
                      color: completada ? '#065F46' : 'var(--text-secondary)',
                      textDecoration: completada ? 'line-through' : 'none',
                    }}
                  >
                    {conducta.nombre}
                  </span>
                </div>
              )
            })
          )}
          {!checkinPrincipal && (
            <p className="text-xs text-text-muted text-center pt-1">
              Registralas en tu check-in
            </p>
          )}
        </div>
      </div>

      {/* ── Últimos 7 días ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm text-text-primary">Últimos 7 días</h2>
          <Link href="/historial" className="text-xs font-semibold text-brand-primary hover:underline">
            Ver historial →
          </Link>
        </div>
        <UltimaSemana historial={historial} hoy={hoy} />
        <LeyendaSemaforo />
      </div>

      {/* ── Mensaje de apoyo ── */}
      {checkinPrincipal && <MensajeApoyo semaforo={checkinPrincipal.semaforo} />}

      {/* ── Seguimiento activo ── */}
      <div
        className="rounded-xl p-4 flex items-start gap-3"
        style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-shrink-0 mt-0.5" style={{ color: '#2563EB' }}>
          <path d="M10 2C6.68 2 4 4.68 4 8c0 5 6 10 6 10s6-5 6-10c0-3.32-2.68-6-6-6z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <circle cx="10" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#1E40AF' }}>Seguimiento activo</p>
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#3B82F6' }}>
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

        if (listo) {
          const c = STATUS_COLORS[checkin!.semaforo]
          return (
            <div
              key={turno}
              className="rounded-2xl p-4"
              style={{ background: c.bg, border: `1px solid ${c.border}` }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-text-primary">{icono} {label}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#ECFDF5', color: '#065F46' }}>✓ Listo</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{checkin!.emocion}</span>
                <span className="text-xs font-medium" style={{ color: c.text }}>
                  IEM {checkin!.iem}/7
                </span>
              </div>
            </div>
          )
        }

        return (
          <Link
            key={turno}
            href="/checkin"
            className="rounded-2xl p-4 transition-all"
            style={
              esActual
                ? { background: '#EFF6FF', border: '2px solid #93C5FD' }
                : { background: 'var(--surface-subtle)', border: '1px solid var(--border-default)' }
            }
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-text-primary">{icono} {label}</span>
              {esActual && (
                <span className="text-[10px] font-bold animate-pulse" style={{ color: '#2563EB' }}>Pendiente</span>
              )}
            </div>
            <p className="text-xs" style={{ color: esActual ? '#2563EB' : 'var(--text-muted)' }}>
              {esActual ? 'Tocá para registrar →' : 'Sin registro'}
            </p>
          </Link>
        )
      })}
    </div>
  )
}

function EstadoHoy({ checkin }: { checkin: Checkin }) {
  const c = STATUS_COLORS[checkin.semaforo]
  const mensaje = MENSAJES_SEMAFORO[checkin.semaforo]

  return (
    <div className="rounded-2xl p-5" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
      <div className="flex items-center gap-4 mb-3">
        <SemaforoIndicador estado={checkin.semaforo} size="lg" animated={checkin.semaforo === 'rojo'} />
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-0.5">Estado del día</p>
          <p className="font-heading text-lg font-bold" style={{ color: c.text }}>{mensaje.titulo}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xl leading-none">{checkin.emocion}</span>
            <span className="text-sm text-text-secondary">
              IEM <strong className="text-text-primary">{checkin.iem}/7</strong>
              <span className="text-text-muted"> · {iemLabel(checkin.iem)}</span>
            </span>
          </div>
        </div>
      </div>

      <p className="text-sm leading-relaxed" style={{ color: c.text, opacity: 0.8 }}>{mensaje.cuerpo}</p>

      {checkin.notas && (
        <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${c.border}` }}>
          <p className="text-xs text-text-muted mb-1">Tu nota</p>
          <p className="text-sm text-text-secondary italic">"{checkin.notas}"</p>
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
    const registro =
      historial.find(h => h.fecha === fechaStr && h.turno === 'noche') ??
      historial.find(h => h.fecha === fechaStr)
    return { fecha: fechaStr, registro, esHoy: fechaStr === hoy, dia: d }
  })

  return (
    <div className="flex justify-between items-end gap-1">
      {dias.map(({ fecha, registro, esHoy, dia }) => {
        const dotColor = registro?.semaforo === 'verde' ? '#10B981'
          : registro?.semaforo === 'amarillo' ? '#F59E0B'
          : registro?.semaforo === 'rojo' ? '#EF4444'
          : 'var(--border-strong)'

        return (
          <div key={fecha} className="flex flex-col items-center gap-1.5 flex-1">
            <div className="relative flex items-center justify-center">
              {esHoy && registro?.semaforo === 'rojo' && (
                <div className="absolute w-7 h-7 rounded-full opacity-30 animate-ping" style={{ background: '#EF4444' }} />
              )}
              <div
                className="w-7 h-7 rounded-full transition-all"
                style={{
                  background: dotColor,
                  border: esHoy ? '2px solid var(--brand-primary)' : '2px solid transparent',
                  transform: esHoy ? 'scale(1.1)' : 'scale(1)',
                  opacity: registro ? 1 : 0.4,
                }}
              />
            </div>
            <span
              className="text-[10px] font-semibold"
              style={{ color: esHoy ? 'var(--brand-primary)' : 'var(--text-muted)' }}
            >
              {esHoy ? 'Hoy' : dia.toLocaleDateString('es', { weekday: 'narrow' })}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function LeyendaSemaforo() {
  return (
    <div className="flex items-center gap-4 mt-4 justify-center">
      {[
        { label: 'Óptimo', color: '#10B981' },
        { label: 'Moderado', color: '#F59E0B' },
        { label: 'Atención', color: '#EF4444' },
        { label: 'Sin registro', color: 'var(--border-strong)' },
      ].map(({ label, color }) => (
        <div key={label} className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: color }} />
          <span className="text-[9px] font-medium text-text-muted">{label}</span>
        </div>
      ))}
    </div>
  )
}

function MensajeApoyo({ semaforo }: { semaforo: Semaforo }) {
  const msgs = {
    verde:    { bg: '#ECFDF5', border: '#A7F3D0', color: '#065F46', texto: 'Mantené la constancia. Cada día que registrás suma a tu historial de salud.' },
    amarillo: { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E', texto: 'Pequeñas mejoras en sueño o hidratación pueden marcar la diferencia mañana.' },
    rojo:     { bg: '#FEF2F2', border: '#FECACA', color: '#991B1B', texto: 'Es importante que te cuides hoy. Si necesitás apoyo, podés contactar a tu médica.' },
  }
  const m = msgs[semaforo]
  return (
    <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: m.bg, border: `1px solid ${m.border}` }}>
      <span className="text-lg mt-0.5">{semaforo === 'verde' ? '💚' : semaforo === 'amarillo' ? '💛' : '❤️'}</span>
      <p className="text-sm leading-relaxed" style={{ color: m.color }}>{m.texto}</p>
    </div>
  )
}
