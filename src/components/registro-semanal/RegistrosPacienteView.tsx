'use client'

import Link from 'next/link'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { nivelEstilos } from '@/lib/scoring'
import { LOGROS_CONFIG } from '@/lib/logros'
import type { RegistroSemanal, LogroPaciente } from '@/types/database'

interface Paciente {
  nombre: string
  email: string
  whatsapp: string | null
}

interface Props {
  paciente: Paciente
  registros: RegistroSemanal[]
  logros: LogroPaciente[]
  pacienteId: string
}

function formatSemana(iso: string) {
  return format(parseISO(iso), "d MMM", { locale: es })
}

function EtiquetaNivel({ score }: { score: number | null }) {
  if (score === null) return <span className="text-slate-400 text-xs">—</span>
  const estilos = nivelEstilos(score)
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ color: estilos.color, background: estilos.bg, border: `1px solid ${estilos.border}` }}
    >
      {score}/100
    </span>
  )
}

function BaraValor({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = (value / max) * 100
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-slate-700 w-8 text-right">{value}/{max}</span>
    </div>
  )
}

export default function RegistrosPacienteView({ paciente, registros, logros, pacienteId }: Props) {
  const logrosDesbloqueados = logros.length
  const alertasActivas = registros.filter(r => r.requiere_atencion && !r.semana_fin).length
  const alertasPendientes = registros.filter(r => r.requiere_atencion).length

  // Datos para el gráfico (cronológico)
  const chartData = [...registros]
    .reverse()
    .map(r => ({
      semana: formatSemana(r.semana_inicio),
      score: r.score ?? 0,
      nivel: r.nivel_bienestar ?? '',
    }))

  function construirMensajeWA(r: RegistroSemanal): string {
    return `Hola ${paciente.nombre}! 👋 Vi tu registro semanal de Mi Brújula de Salud.

Tu score esta semana fue *${r.score}/100* (${r.nivel_bienestar}).

${r.requiere_atencion ? '⚠️ Noté que tuviste algunos días difíciles. Me gustaría hablar con vos.' : '¡Muy bien esta semana! Seguí así.'}

¿Cómo te estás sintiendo ahora? 😊`
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/dashboard" className="hover:text-slate-600">Panel</Link>
        <span>/</span>
        <Link href={`/dashboard/paciente/${pacienteId}`} className="hover:text-slate-600">
          {paciente.nombre}
        </Link>
        <span>/</span>
        <span className="text-slate-600">Registros semanales</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Registros semanales — {paciente.nombre}
          </h1>
          <p className="text-sm text-slate-400 mt-1">{paciente.email}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {alertasPendientes > 0 && (
            <span className="bg-red-100 text-red-700 font-bold text-sm px-3 py-1.5 rounded-xl">
              🚨 {alertasPendientes} alerta{alertasPendientes > 1 ? 's' : ''}
            </span>
          )}
          <span className="bg-yellow-100 text-yellow-700 text-sm font-medium px-3 py-1.5 rounded-xl">
            🏅 {logrosDesbloqueados} logro{logrosDesbloqueados !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Logros del paciente */}
      {logros.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Logros desbloqueados</h3>
          <div className="flex flex-wrap gap-2">
            {logros.map(l => {
              const cfg = LOGROS_CONFIG[l.logro_key]
              if (!cfg) return null
              return (
                <span
                  key={l.id}
                  className="bg-yellow-50 border border-yellow-200 text-sm px-3 py-1.5 rounded-xl font-medium text-yellow-800"
                  title={cfg.descripcion}
                >
                  {cfg.emoji} {cfg.nombre}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {registros.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400">
          Este paciente aún no completó ningún registro semanal.
        </div>
      ) : (
        <>
          {/* Gráfico de evolución */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Evolución del score semanal</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="semana"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  formatter={(value: number) => [`${value}/100`, 'Score']}
                />
                <ReferenceLine y={80} stroke="#15803d" strokeDasharray="4 4" strokeWidth={1} />
                <ReferenceLine y={60} stroke="#1d4ed8" strokeDasharray="4 4" strokeWidth={1} />
                <ReferenceLine y={40} stroke="#a16207" strokeDasharray="4 4" strokeWidth={1} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-4 justify-center mt-2 text-xs text-slate-400">
              <span style={{ color: '#15803d' }}>— Excelente (80+)</span>
              <span style={{ color: '#1d4ed8' }}>— Buena (60+)</span>
              <span style={{ color: '#a16207' }}>— Regular (40+)</span>
            </div>
          </div>

          {/* Historial */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">Historial de registros</h3>
            {registros.map(r => (
              <div
                key={r.id}
                className={`bg-white rounded-2xl border p-5 ${
                  r.requiere_atencion
                    ? 'border-red-200 shadow-sm shadow-red-50'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-slate-700">
                        {formatSemana(r.semana_inicio)} — {formatSemana(r.semana_fin)}
                      </span>
                      <EtiquetaNivel score={r.score} />
                      {r.requiere_atencion && (
                        <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                          🚨 Requiere atención
                        </span>
                      )}
                    </div>
                    {r.nivel_bienestar && (
                      <p className="text-xs text-slate-500 mt-1">{r.nivel_bienestar}</p>
                    )}
                  </div>

                  {paciente.whatsapp && (
                    <a
                      href={`https://wa.me/${paciente.whatsapp}?text=${encodeURIComponent(construirMensajeWA(r))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 text-xs font-medium px-3 py-2 rounded-xl transition-colors"
                    >
                      📲 Responder por WhatsApp
                    </a>
                  )}
                </div>

                {/* Barras de dimensiones */}
                <div className="mt-4 space-y-1.5">
                  <BaraValor label="Ánimo" value={r.animo} max={5} />
                  <BaraValor label="Sueño" value={r.sueno} max={5} />
                  <BaraValor label="Energía" value={r.energia} max={5} />
                  <BaraValor label="Alimentación" value={r.alimentacion} max={5} />
                  <BaraValor label="Actividad" value={r.actividad_fisica} max={7} />
                </div>

                {/* Textos libres */}
                {(r.logro_personal || r.dificultad || r.sintomas) && (
                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                    {r.logro_personal && (
                      <p className="text-xs text-slate-600">
                        <span className="font-medium">✨ Logro:</span> {r.logro_personal}
                      </p>
                    )}
                    {r.dificultad && (
                      <p className="text-xs text-slate-600">
                        <span className="font-medium">🪨 Dificultad:</span> {r.dificultad}
                      </p>
                    )}
                    {r.sintomas && (
                      <p className="text-xs text-slate-600">
                        <span className="font-medium">⚕️ Síntomas:</span> {r.sintomas}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
