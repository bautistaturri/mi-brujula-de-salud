'use client'

import Link from 'next/link'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts'

interface CheckinSemanal {
  week_start: string
  semaphore: 'green' | 'amber' | 'red'
  scores: {
    ics: number
    ica: number
    be_norm: number
    ini_norm: number
    [key: string]: number
  }
  dominant_domain: string
  ica_days?: number[]   // días cumplidos por conducta [0-7] × 5
}

interface ConductaAncla {
  id: string
  nombre: string
  icono: string
  orden: number
}

interface Props {
  nombre: string
  checkinActual: CheckinSemanal | null
  historial: CheckinSemanal[]
  conductas: ConductaAncla[]
  rachaVerde: number
  weekStart: string
}

const SEMAPHORE_CONFIG = {
  green: {
    label: 'Verde',
    gradiente: 'from-[#1A6B3C] to-[#2A9B5A]',
    textLight: 'text-[#1A6B3C]',
    bg: 'bg-[#D6EFE1]',
    mensaje: {
      ica: '¡Tus conductas están construyendo el cambio!',
      be:  '¡Tu estado emocional brilla esta semana!',
      ini: '¡Tu voz interna te acompaña con compasión!',
    },
  },
  amber: {
    label: 'Amarillo',
    gradiente: 'from-[#8B4800] to-[#C87020]',
    textLight: 'text-[#8B4800]',
    bg: 'bg-[#FDE8CC]',
    mensaje: {
      ica: 'Seguí con las conductas, el hábito se construye paso a paso.',
      be:  'Tu energía merece atención. ¿Qué necesitás esta semana?',
      ini: 'Ser consciente ya es un gran paso.',
    },
  },
  red: {
    label: 'Rojo',
    gradiente: 'from-[#6B1010] to-[#A83020]',
    textLight: 'text-[#8B1A1A]',
    bg: 'bg-[#FADDDD]',
    mensaje: {
      ica: 'Tu equipo de salud está al tanto. Pequeños pasos cuentan.',
      be:  'Tu bienestar emocional importa. Pedí apoyo.',
      ini: 'La autocompasión es el primer paso para volver.',
    },
  },
} as const

const SEMAPHORE_COLOR: Record<string, string> = {
  green: '#1A6B3C',
  amber: '#C87020',
  red:   '#A83020',
}

const DOMAIN_LABELS: Record<string, string> = {
  ica: 'conductual',
  be:  'emocional',
  ini: 'cognitivo',
}

export default function DashboardPacienteView({
  nombre,
  checkinActual,
  historial,
  conductas,
  rachaVerde,
  weekStart,
}: Props) {
  const tieneCheckin = !!checkinActual
  const config = checkinActual
    ? SEMAPHORE_CONFIG[checkinActual.semaphore]
    : null

  // Datos para el gráfico (orden cronológico)
  const chartData = [...historial].reverse().map(c => ({
    semana: new Date(c.week_start + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }),
    ics:    c.scores?.ics ?? 0,
  }))

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-28">
      {/* Header */}
      <div className="bg-white border-b border-[#E5E7EB] px-5 py-4">
        <p className="text-sm text-[#9CA3AF]">Hola,</p>
        <h1 className="text-xl font-bold text-[#1A1A2E]">{nombre} 🧭</h1>
      </div>

      {/* ── Hero semáforo ── */}
      {tieneCheckin && config && checkinActual ? (
        <div className={`mx-5 mt-5 bg-gradient-to-br ${config.gradiente} rounded-3xl p-6 text-white relative overflow-hidden`}>
          <div className="absolute top-[-40px] right-[-40px] w-48 h-48 rounded-full bg-white/10 pointer-events-none" />

          <p className="text-[11px] font-bold tracking-widest uppercase opacity-70 mb-1">
            Índice Compass Semanal
          </p>
          <h2 className="font-serif text-3xl leading-tight mb-1">
            Zona {config.label}
          </h2>
          <p className="text-sm opacity-80 max-w-[180px] leading-relaxed">
            {config.mensaje[checkinActual.dominant_domain as keyof typeof config.mensaje] ?? ''}
          </p>

          {/* Score ICS grande */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-center">
            <span className="font-serif text-6xl opacity-90 leading-none block">
              {checkinActual.scores.ics}
            </span>
            <span className="text-[10px] font-semibold tracking-widest uppercase opacity-60">ICS</span>
          </div>

          {/* Racha */}
          {rachaVerde > 0 && (
            <div className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5 text-xs font-semibold mt-4">
              🔥 {rachaVerde} semana{rachaVerde !== 1 ? 's' : ''} verde{rachaVerde !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      ) : (
        /* Banner motivacional — sin checkin */
        <div className="mx-5 mt-5 bg-gradient-to-br from-[#1B3A5C] to-[#2A4F7A] rounded-3xl p-6 text-white">
          <p className="text-sm opacity-70 mb-2">Esta semana</p>
          <h2 className="font-serif text-2xl mb-2">¿Cómo estuvo tu semana?</h2>
          <p className="text-sm opacity-80 mb-5">
            Completá tu check-in semanal para ver tu semáforo ICS.
          </p>
          <Link
            href="/dashboard/paciente/checkin"
            className="inline-flex items-center gap-2 bg-white text-[#1B3A5C] font-bold px-5 py-3 rounded-2xl text-sm hover:bg-[#F9FAFB] transition"
          >
            Completar check-in →
          </Link>
        </div>
      )}

      {/* ── Breakdown 3 dominios ── */}
      {tieneCheckin && checkinActual && (
        <div className="grid grid-cols-3 gap-3 px-5 mt-4">
          <DomainCard
            icon="🎯" label="ICA"
            value={checkinActual.scores.ica}
            color="teal"
          />
          <DomainCard
            icon="🧭" label="BE"
            value={checkinActual.scores.be_norm}
            color="amber"
          />
          <DomainCard
            icon="🧠" label="INI"
            value={checkinActual.scores.ini_norm}
            color="navy"
          />
        </div>
      )}

      {/* ── Botón check-in (si ya completó) ── */}
      {tieneCheckin && (
        <div className="px-5 mt-4">
          <div className="bg-[#F3F4F6] rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#6B7280]">Check-in completado ✓</p>
              <p className="text-xs text-[#9CA3AF]">Próximo check-in el lunes que viene</p>
            </div>
            <span className="text-2xl">✅</span>
          </div>
        </div>
      )}

      {!tieneCheckin && (
        <div className="px-5 mt-4">
          <Link
            href="/dashboard/paciente/checkin"
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-[#2A7B6F] to-[#1B3A5C] text-white font-semibold shadow-md hover:opacity-90 transition"
          >
            🧭 Completar check-in semanal
          </Link>
        </div>
      )}

      {/* ── Gráfico evolución histórica ── */}
      {historial.length > 1 && (
        <div className="px-5 mt-6">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
            <h3 className="text-sm font-bold text-[#1F2937] mb-4">
              Evolución ICS — últimas {historial.length} semanas
            </h3>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData}>
                <XAxis
                  dataKey="semana"
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(v: number) => [`${v} pts`, 'ICS']}
                />
                <ReferenceLine y={70} stroke="#1A6B3C" strokeDasharray="4 4" strokeOpacity={0.5} />
                <ReferenceLine y={45} stroke="#C87020" strokeDasharray="4 4" strokeOpacity={0.5} />
                <Line
                  type="monotone"
                  dataKey="ics"
                  stroke="#2A7B6F"
                  strokeWidth={2.5}
                  dot={(props) => {
                    const { cx, cy, payload } = props as { cx: number; cy: number; payload: { ics: number } }
                    const color = payload.ics >= 70 ? '#1A6B3C' : payload.ics >= 45 ? '#C87020' : '#A83020'
                    return <circle key={`dot-${cx}`} cx={cx} cy={cy} r={4} fill={color} strokeWidth={0} />
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-3 text-[10px] text-[#9CA3AF]">
              <span className="flex items-center gap-1"><span className="w-4 border-t-2 border-[#1A6B3C] border-dashed inline-block" /> Verde ≥70</span>
              <span className="flex items-center gap-1"><span className="w-4 border-t-2 border-[#C87020] border-dashed inline-block" /> Amarillo ≥45</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Conductas ancla ── */}
      {conductas.length > 0 && tieneCheckin && checkinActual && (
        <div className="px-5 mt-5">
          <h3 className="text-sm font-bold text-[#1F2937] mb-3">Mis conductas ancla</h3>
          <div className="space-y-2">
            {conductas.map((c, i) => {
              const dias = checkinActual.ica_days?.[i] ?? 0
              const pct = dias / 7
              return (
                <div key={c.id} className="bg-white rounded-xl border border-[#E5E7EB] px-4 py-3 flex items-center gap-3">
                  <span className="text-xl">{c.icono}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1F2937] truncate">{c.nombre}</p>
                    <div className="h-1 bg-[#E5E7EB] rounded-full mt-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct >= 0.7 ? 'bg-[#2A7B6F]' : pct >= 0.4 ? 'bg-[#C87020]' : 'bg-[#9CA3AF]'
                        }`}
                        style={{ width: `${pct * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#6B7280] tabular-nums">{dias}/7</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-componentes ──

function DomainCard({ icon, label, value, color }: {
  icon: string
  label: string
  value: number
  color: 'teal' | 'amber' | 'navy'
}) {
  const colors = {
    teal:  { text: 'text-[#2A7B6F]', bar: 'bg-[#2A7B6F]' },
    amber: { text: 'text-[#B8860B]', bar: 'bg-[#C87020]' },
    navy:  { text: 'text-[#1B3A5C]', bar: 'bg-[#2A4F7A]' },
  }
  const c = colors[color]
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-3 text-center shadow-sm">
      <div className="text-xl mb-1">{icon}</div>
      <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-lg font-bold ${c.text}`}>{Math.round(value)}%</div>
      <div className="h-1 bg-[#E5E7EB] rounded-full mt-2 overflow-hidden">
        <div
          className={`h-full rounded-full ${c.bar}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  )
}
