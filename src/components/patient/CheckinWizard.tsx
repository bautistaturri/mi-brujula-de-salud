'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ConductaAncla, Emocion, Turno } from '@/types/database'
import { EMOCIONES } from '@/types/database'
import { calcularSemaforo, iemLabel } from '@/lib/utils'

interface Props {
  userId: string
  conductas: ConductaAncla[]
  turno: Turno
  waTelefono: string | null
}

type Paso = 'conductas' | 'iem' | 'emocion' | 'notas' | 'resultado'

const TURNO_LABEL: Record<Turno, string> = {
  manana: 'Mañana ☀️',
  noche: 'Noche 🌙',
}

// IEM color segmentation using clinical tokens
function iemColor(v: number, iem: number): string {
  if (v > iem) return 'bg-[#E2DDD6]'
  if (v <= 2) return 'bg-semaforo-rojo'
  if (v <= 4) return 'bg-semaforo-amarillo'
  return 'bg-semaforo-verde'
}

export default function CheckinWizard({ userId, conductas, turno, waTelefono }: Props) {
  const router = useRouter()
  const [paso, setPaso] = useState<Paso>('conductas')
  const [conductasCompletadas, setConductasCompletadas] = useState<string[]>([])
  const [iem, setIem] = useState(4)
  const [emocion, setEmocion] = useState<Emocion | null>(null)
  const [notas, setNotas] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const pasos: Paso[] = ['conductas', 'iem', 'emocion', 'notas', 'resultado']
  const indicePaso = pasos.indexOf(paso)

  function toggleConducta(id: string) {
    setConductasCompletadas(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  async function guardarCheckin() {
    if (!emocion) return
    setGuardando(true)

    const semaforo = calcularSemaforo(iem, conductasCompletadas.length)
    const supabase = createClient()

    const { error } = await supabase.rpc('save_checkin', {
      p_fecha: new Date().toISOString().split('T')[0],
      p_turno: turno,
      p_conductas: conductasCompletadas,
      p_iem: iem,
      p_emocion: emocion,
      p_semaforo: semaforo,
      p_notas: notas.trim() || null,
    })

    if (error) {
      setErrorMsg(error.message)
    } else {
      setPaso('resultado')
    }
    setGuardando(false)
  }

  // Paso: Conductas
  if (paso === 'conductas') {
    return (
      <div className="px-4 pt-6 space-y-5">
        <PasoHeader
          titulo="¿Qué hiciste hoy?"
          subtitulo="Marcá las conductas que completaste"
          turnoLabel={TURNO_LABEL[turno]}
          progreso={1}
          total={4}
        />

        <div className="space-y-3">
          {conductas.map(conducta => {
            const marcada = conductasCompletadas.includes(conducta.id)
            return (
              <button
                key={conducta.id}
                onClick={() => toggleConducta(conducta.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                  marcada
                    ? 'border-semaforo-verde-border bg-semaforo-verde-bg'
                    : 'border-[#E2DDD6] bg-white hover:border-[#C8DDD0]'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all ${
                  marcada ? 'bg-semaforo-verde' : 'bg-[#F7F6F3]'
                }`}>
                  {marcada ? <span className="text-white text-sm font-bold">✓</span> : conducta.icono}
                </div>
                <span className={`font-medium text-sm ${marcada ? 'text-semaforo-verde' : 'text-[#1C1917]'}`}>
                  {conducta.nombre}
                </span>
              </button>
            )
          })}
        </div>

        <div className="bg-[#F7F6F3] rounded-xl p-3 text-center">
          <span className="text-2xl font-bold text-[#1C1917]">{conductasCompletadas.length}</span>
          <span className="text-[#78716C]"> / {conductas.length} completadas</span>
        </div>

        <BotonSiguiente onClick={() => setPaso('iem')} />
      </div>
    )
  }

  // Paso: IEM
  if (paso === 'iem') {
    return (
      <div className="px-4 pt-6 space-y-6">
        <PasoHeader
          titulo="¿Cómo está tu energía?"
          subtitulo="Índice de Energía Motivacional"
          turnoLabel={TURNO_LABEL[turno]}
          progreso={2}
          total={4}
        />

        <div className="bg-white rounded-2xl border border-[#E2DDD6] p-6 shadow-sm">
          <div className="text-center mb-6">
            <span className="text-7xl font-bold text-[#1C1917]">{iem}</span>
            <span className="text-2xl text-[#78716C]">/7</span>
            <p className="text-base text-[#78716C] mt-2">{iemLabel(iem)}</p>
          </div>

          <input
            type="range"
            min={1}
            max={7}
            step={1}
            value={iem}
            onChange={e => setIem(Number(e.target.value))}
            className="w-full accent-[#2C4A6E]"
          />

          <div className="flex justify-between text-xs text-[#78716C] mt-1">
            <span>Sin energía</span>
            <span>Excelente</span>
          </div>

          <div className="flex gap-1 mt-4 rounded-xl overflow-hidden h-3">
            {[1, 2, 3, 4, 5, 6, 7].map(v => (
              <div key={v} className={`flex-1 transition-all ${iemColor(v, iem)}`} />
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <BotonAtras onClick={() => setPaso('conductas')} />
          <BotonSiguiente onClick={() => setPaso('emocion')} />
        </div>
      </div>
    )
  }

  // Paso: Emoción
  if (paso === 'emocion') {
    return (
      <div className="px-4 pt-6 space-y-6">
        <PasoHeader
          titulo="¿Cómo te sentís?"
          subtitulo="Elegí la emoción que mejor te describe ahora"
          turnoLabel={TURNO_LABEL[turno]}
          progreso={3}
          total={4}
        />

        <div className="grid grid-cols-5 gap-2">
          {EMOCIONES.map(({ emoji, label }) => (
            <button
              key={emoji}
              onClick={() => setEmocion(emoji)}
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                emocion === emoji
                  ? 'border-[#2C4A6E] bg-[#EEF4F0] scale-105'
                  : 'border-[#E2DDD6] bg-white hover:border-[#C8DDD0]'
              }`}
            >
              <span className="text-4xl">{emoji}</span>
              <span className="text-xs text-[#78716C] text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <BotonAtras onClick={() => setPaso('iem')} />
          <BotonSiguiente onClick={() => setPaso('notas')} disabled={!emocion} />
        </div>
      </div>
    )
  }

  // Paso: Notas (opcional)
  if (paso === 'notas') {
    return (
      <div className="px-4 pt-6 space-y-6">
        <PasoHeader
          titulo="¿Algo que agregar?"
          subtitulo="Opcional: escribí una nota breve"
          turnoLabel={TURNO_LABEL[turno]}
          progreso={4}
          total={4}
        />

        <div className="bg-white rounded-2xl border border-[#E2DDD6] p-4 shadow-sm">
          <textarea
            value={notas}
            onChange={e => setNotas(e.target.value)}
            placeholder="Hoy me sentí diferente porque..."
            maxLength={300}
            rows={5}
            className="w-full text-[#1C1917] placeholder:text-[#78716C] resize-none focus:outline-none text-sm"
          />
          <div className="text-right text-xs text-[#78716C] mt-1">{notas.length}/300</div>
        </div>

        {errorMsg && (
          <div className="bg-semaforo-rojo-bg border border-semaforo-rojo-border rounded-xl p-3 text-sm text-semaforo-rojo">
            {errorMsg}
          </div>
        )}

        <div className="flex gap-3">
          <BotonAtras onClick={() => setPaso('emocion')} />
          <button
            onClick={guardarCheckin}
            disabled={guardando}
            className="flex-1 bg-[#2C4A6E] hover:bg-[#1E3550] disabled:opacity-60 text-white font-semibold py-4 rounded-2xl transition-colors"
          >
            {guardando ? 'Guardando...' : '✓ Guardar check-in'}
          </button>
        </div>
      </div>
    )
  }

  // Paso: Resultado
  if (paso === 'resultado') {
    const semaforo = calcularSemaforo(iem, conductasCompletadas.length)
    const config = {
      verde:    { msg: '¡Excelente!',              bg: 'bg-semaforo-verde-bg',    border: 'border-semaforo-verde-border',    text: 'text-semaforo-verde',    dot: 'bg-semaforo-verde' },
      amarillo: { msg: 'Día regular, ¡seguí!',     bg: 'bg-semaforo-amarillo-bg', border: 'border-semaforo-amarillo-border', text: 'text-semaforo-amarillo', dot: 'bg-semaforo-amarillo' },
      rojo:     { msg: 'Mañana es otro día',       bg: 'bg-semaforo-rojo-bg',     border: 'border-semaforo-rojo-border',     text: 'text-semaforo-rojo',     dot: 'bg-semaforo-rojo' },
    }
    const c = config[semaforo]

    const emocionLabel = EMOCIONES.find(e => e.emoji === emocion)?.label ?? ''
    const conductasNombres = conductas
      .filter(c => conductasCompletadas.includes(c.id))
      .map(c => c.nombre)
      .join(', ')

    const waTexto = [
      `🧭 *Mi Brújula de Salud* — Check-in ${TURNO_LABEL[turno]}`,
      `📅 ${new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}`,
      '',
      `Estado: *${semaforo.charAt(0).toUpperCase() + semaforo.slice(1)}*`,
      `⚡ Energía (IEM): *${iem}/7* — ${iemLabel(iem)}`,
      `${emocion} Emoción: *${emocionLabel}*`,
      `✅ Conductas: *${conductasCompletadas.length}/${conductas.length}*${conductasNombres ? ` (${conductasNombres})` : ''}`,
      notas ? `📝 Nota: "${notas}"` : '',
    ].filter(Boolean).join('\n')

    const waUrl = waTelefono
      ? `https://wa.me/${waTelefono.replace(/\D/g, '')}?text=${encodeURIComponent(waTexto)}`
      : null

    return (
      <div className="px-4 pt-6 space-y-5">
        {/* Result card */}
        <div className={`${c.bg} border ${c.border} rounded-3xl p-8 text-center animate-check-pop`}>
          <div className={`w-16 h-16 rounded-full ${c.dot} mx-auto mb-4`} />
          <h2 className={`text-2xl font-bold ${c.text} mb-1`}>{c.msg}</h2>
          <p className="text-[#78716C] text-sm">{TURNO_LABEL[turno]} guardado ✓</p>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl border border-[#E2DDD6] p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#78716C]">Conductas completadas</span>
            <span className="font-bold text-[#1C1917] text-sm">{conductasCompletadas.length}/{conductas.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#78716C]">Energía motivacional</span>
            <span className="font-bold text-[#1C1917] text-sm">{iem}/7 · {iemLabel(iem)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#78716C]">Estado emocional</span>
            <span className="font-bold text-[#1C1917] text-sm">{emocion} {emocionLabel}</span>
          </div>
        </div>

        {waUrl && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full bg-semaforo-verde hover:opacity-90 text-white font-semibold py-4 rounded-2xl transition-opacity text-base"
          >
            <span className="text-xl">📲</span>
            Compartir con mi profesional de salud
          </a>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => router.push('/historial')}
            className="flex-1 py-3.5 rounded-2xl border border-[#E2DDD6] text-[#78716C] font-medium hover:bg-[#F7F6F3] transition-colors text-sm"
          >
            Ver historial
          </button>
          <button
            onClick={() => router.push('/inicio')}
            className="flex-1 bg-[#2C4A6E] hover:bg-[#1E3550] text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  return null
}

// ── Sub-componentes internos ──

function PasoHeader({
  titulo,
  subtitulo,
  turnoLabel,
  progreso,
  total,
}: {
  titulo: string
  subtitulo: string
  turnoLabel: string
  progreso: number
  total: number
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 flex-1">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i < progreso ? 'bg-[#2C4A6E]' : 'bg-[#E2DDD6]'
              }`}
            />
          ))}
        </div>
        <span className="ml-3 text-xs font-medium text-[#78716C] bg-[#F7F6F3] px-2.5 py-1 rounded-full whitespace-nowrap">
          {turnoLabel}
        </span>
      </div>
      <h1 className="text-2xl font-bold text-[#1C1917]">{titulo}</h1>
      <p className="text-sm text-[#78716C] mt-1">{subtitulo}</p>
    </div>
  )
}

function BotonSiguiente({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex-1 bg-[#2C4A6E] hover:bg-[#1E3550] disabled:opacity-40 text-white font-semibold py-4 rounded-2xl transition-colors"
    >
      Siguiente →
    </button>
  )
}

function BotonAtras({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-6 py-4 rounded-2xl border border-[#E2DDD6] text-[#78716C] font-medium hover:bg-[#F7F6F3] transition-colors"
    >
      ←
    </button>
  )
}
