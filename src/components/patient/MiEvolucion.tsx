'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
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
}

interface Props {
  historial: CheckinSemanal[]
  rachaVerde: number
}

const DOMAIN_LABELS: Record<string, string> = {
  ica: 'Conductual',
  be:  'Emocional',
  ini: 'Cognitivo',
}

const SEMAPHORE_COLOR: Record<string, string> = {
  green: '#2A7B6F',
  amber: '#C87020',
  red:   '#A83020',
}

export default function MiEvolucion({ historial, rachaVerde }: Props) {
  if (historial.length < 3) {
    return (
      <div className="mx-5 mt-5 bg-white rounded-2xl border border-[#E5E7EB] p-6 text-center shadow-sm">
        <p className="text-3xl mb-2">📈</p>
        <p className="text-sm font-semibold text-[#1F2937]">
          Completá 3 check-ins para ver tu evolución
        </p>
        <p className="text-xs text-[#9CA3AF] mt-1">
          Llevás {historial.length} de 3
        </p>
      </div>
    )
  }

  // Gráfico en orden cronológico
  const chartData = [...historial].reverse().map(c => ({
    semana: new Date(c.week_start + 'T00:00:00').toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
    }),
    ics:  c.scores?.ics     ?? 0,
    ica:  c.scores?.ica     ?? 0,
    be:   c.scores?.be_norm  ?? 0,
    ini:  c.scores?.ini_norm ?? 0,
  }))

  // Métricas
  const todosIcs      = historial.map(c => c.scores?.ics ?? 0)
  const mejorICS      = Math.round(Math.max(...todosIcs))
  const ultimas4      = historial.slice(0, 4)
  const promedioICS   = ultimas4.length > 0
    ? Math.round(ultimas4.reduce((s, c) => s + (c.scores?.ics ?? 0), 0) / ultimas4.length)
    : 0

  // Dominio más frecuente
  const dominantCount: Record<string, number> = {}
  historial.forEach(c => {
    if (c.dominant_domain)
      dominantCount[c.dominant_domain] = (dominantCount[c.dominant_domain] ?? 0) + 1
  })
  const dominantDomain = Object.entries(dominantCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'ica'

  return (
    <div className="px-5 mt-6 space-y-4">
      <h3 className="text-sm font-bold text-[#1F2937]">Mi evolución</h3>

      {/* Gráfico multi-línea */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis
              dataKey="semana"
              tick={{ fontSize: 9, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 9, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
              width={24}
            />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8 }}
              formatter={(v: number, name: string) => [`${Math.round(v)}`, name.toUpperCase()]}
            />
            <ReferenceLine y={70} stroke="#1A6B3C" strokeDasharray="3 3" strokeOpacity={0.4} />
            <ReferenceLine y={45} stroke="#C87020" strokeDasharray="3 3" strokeOpacity={0.4} />
            <Line type="monotone" dataKey="ics" stroke="#1B3A5C" strokeWidth={2.5} dot={false} name="ics" />
            <Line type="monotone" dataKey="ica" stroke="#2563EB" strokeWidth={1.5} dot={false} name="ica" />
            <Line type="monotone" dataKey="be"  stroke="#2A7B6F" strokeWidth={1.5} dot={false} name="be"  />
            <Line type="monotone" dataKey="ini" stroke="#7C3AED" strokeWidth={1.5} dot={false} name="ini" />
          </LineChart>
        </ResponsiveContainer>

        {/* Leyenda */}
        <div className="flex items-center gap-3 mt-2 justify-center flex-wrap">
          {[
            { label: 'ICS',  color: '#1B3A5C', bold: true  },
            { label: 'ICA',  color: '#2563EB', bold: false },
            { label: 'BE',   color: '#2A7B6F', bold: false },
            { label: 'INI',  color: '#7C3AED', bold: false },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1">
              <div
                className="w-4 rounded-full"
                style={{ height: l.bold ? 2.5 : 1.5, background: l.color }}
              />
              <span className="text-[9px] font-medium" style={{ color: l.color }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Mejor ICS',   value: String(mejorICS),                          icon: '🏆' },
          { label: 'Racha verde', value: `${rachaVerde} sem`,                         icon: '🔥' },
          { label: 'Prom. 4 sem', value: String(promedioICS),                        icon: '📊' },
          { label: 'Dominio',     value: DOMAIN_LABELS[dominantDomain] ?? '-',       icon: '💪' },
        ].map(m => (
          <div
            key={m.label}
            className="bg-white rounded-xl border border-[#E5E7EB] p-2.5 text-center shadow-sm"
          >
            <div className="text-lg mb-0.5">{m.icon}</div>
            <div className="text-xs font-bold text-[#1F2937] leading-tight">{m.value}</div>
            <div className="text-[9px] text-[#9CA3AF] leading-tight mt-0.5">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Mini calendario de consistencia (últimas 12 semanas) */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm">
        <p className="text-xs font-semibold text-[#1F2937] mb-3">Consistencia — últimas 12 semanas</p>
        <MiniCalendario historial={historial} colorMap={SEMAPHORE_COLOR} />
        <div className="flex items-center gap-3 mt-3">
          {[
            { color: SEMAPHORE_COLOR.green, label: 'Verde'    },
            { color: SEMAPHORE_COLOR.amber, label: 'Amarillo' },
            { color: SEMAPHORE_COLOR.red,   label: 'Rojo'     },
            { color: '#E5E7EB',             label: 'Sin dato' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
              <span className="text-[9px] text-[#9CA3AF]">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Sub-componente: mini calendario tipo GitHub contributions ──

function MiniCalendario({
  historial,
  colorMap,
}: {
  historial: CheckinSemanal[]
  colorMap: Record<string, string>
}) {
  const semanas: { label: string; semaphore: string | null }[] = []
  const now = new Date()
  // Lunes de la semana actual
  const diffToMonday = now.getDay() === 0 ? 6 : now.getDay() - 1
  const lunes = new Date(now)
  lunes.setDate(now.getDate() - diffToMonday)
  lunes.setHours(0, 0, 0, 0)

  for (let i = 11; i >= 0; i--) {
    const d = new Date(lunes)
    d.setDate(lunes.getDate() - i * 7)
    const ws = d.toISOString().split('T')[0]
    const found = historial.find(c => c.week_start === ws)
    const label = d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
    semanas.push({ label, semaphore: found?.semaphore ?? null })
  }

  return (
    <div className="flex gap-1.5 flex-wrap">
      {semanas.map((s, i) => (
        <div
          key={i}
          title={s.label}
          className="w-6 h-6 rounded-md transition-transform hover:scale-110"
          style={{ background: s.semaphore ? colorMap[s.semaphore] : '#E5E7EB' }}
        />
      ))}
    </div>
  )
}
