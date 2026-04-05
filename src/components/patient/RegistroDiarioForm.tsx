'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { LogroConfig } from '@/lib/logros'
import LogroDesbloqueadoModal from './LogroDesbloqueadoModal'

interface ConductaAncla {
  id: string
  nombre: string
  icono: string
  orden: number
}

interface Props {
  userId: string
  nombre: string
  conductas: ConductaAncla[]
  fechaHoy: string   // YYYY-MM-DD
  yaRegistrado: boolean
}

type Paso = 1 | 2 | 3

const EMOJI_ENERGÍA = ['', '😔', '😐', '🙂', '😊', '🌟']

function getGreeting(nombre: string): { texto: string; emoji: string } {
  const hora = new Date().getHours()
  if (hora >= 6 && hora < 12)  return { texto: `Buenos días, ${nombre}`,    emoji: '☀️' }
  if (hora >= 12 && hora < 19) return { texto: `Buenas tardes, ${nombre}`,  emoji: '🌤' }
  return { texto: `Buenas noches, ${nombre}`, emoji: '🌙' }
}

function getPreguntaDia(): string {
  const hora = new Date().getHours()
  if (hora >= 6 && hora < 12)  return '¿Cómo arrancaste el día?'
  if (hora >= 12 && hora < 19) return '¿Cómo va el día?'
  return '¿Cómo estuvo el día?'
}

export default function RegistroDiarioForm({
  nombre,
  conductas,
  fechaHoy,
  yaRegistrado,
}: Props) {
  const router = useRouter()

  const [paso, setPaso]             = useState<Paso>(1)
  const [energiaDia, setEnergiaDia] = useState(3)
  const [animoDia, setAnimoDia]     = useState(3)
  const [conductasHoy, setConductasHoy] = useState<boolean[]>(
    conductas.map(() => false)
  )
  const [notaLibre, setNotaLibre]   = useState('')
  const [guardando, setGuardando]   = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [logrosNuevos, setLogrosNuevos] = useState<LogroConfig[]>([])
  const [logroActual, setLogroActual]   = useState(0)
  const [registrado, setRegistrado]     = useState(false)

  const greeting = getGreeting(nombre)

  if (yaRegistrado || registrado) {
    return (
      <div className="mx-5 mt-8 p-6 bg-[#D6EFE1] border border-[#A8D5B5] rounded-2xl text-center">
        <p className="text-3xl mb-3">✅</p>
        <p className="text-[#1A6B3C] font-semibold text-lg">
          Seguís construyendo tu semana.
        </p>
        <p className="text-sm text-[#4A9E6B] mt-1">
          Ya registraste el día de hoy.
        </p>
        <button
          onClick={() => router.push('/inicio')}
          className="mt-4 text-sm text-[#2A7B6F] underline"
        >
          Volver al inicio →
        </button>
      </div>
    )
  }

  async function handleSubmit() {
    setGuardando(true)
    setError(null)

    try {
      const res = await fetch('/api/checkin/diario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha:         fechaHoy,
          energia_dia:   energiaDia,
          animo_dia:     animoDia,
          conductas_hoy: conductasHoy,
          nota_libre:    notaLibre.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.codigo === 'DUPLICATE') {
          setRegistrado(true)
          return
        }
        throw new Error(data.error ?? 'Error desconocido')
      }

      if (data.logros_nuevos && data.logros_nuevos.length > 0) {
        setLogrosNuevos(data.logros_nuevos)
        setLogroActual(0)
      } else {
        setRegistrado(true)
        router.push('/inicio')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  function avanzarLogros() {
    const siguiente = logroActual + 1
    if (siguiente < logrosNuevos.length) {
      setLogroActual(siguiente)
    } else {
      setRegistrado(true)
      router.push('/inicio')
    }
  }

  const progreso = (paso / 3) * 100

  return (
    <>
      {/* Modal de logros — se muestra después de guardar */}
      {logrosNuevos.length > 0 && logroActual < logrosNuevos.length && (
        <LogroDesbloqueadoModal
          logro={logrosNuevos[logroActual]}
          onClose={avanzarLogros}
        />
      )}

      <div className="pb-24">
        {/* Greeting */}
        <div className="px-5 pt-6 pb-4 bg-white border-b border-[#E5E7EB]">
          <p className="text-2xl mb-1">{greeting.emoji}</p>
          <h1 className="text-xl font-bold text-[#1A1A2E]">{greeting.texto}</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">{getPreguntaDia()}</p>
        </div>

        {/* Barra de progreso */}
        <div className="px-5 pt-5 mb-6">
          <div className="flex justify-between text-[11px] font-semibold text-[#9CA3AF] mb-2">
            <span className={paso === 1 ? 'text-[#2A7B6F]' : ''}>Energía y ánimo</span>
            <span className={paso === 2 ? 'text-[#B8860B]' : ''}>Conductas</span>
            <span className={paso === 3 ? 'text-[#1B3A5C]' : ''}>Nota libre</span>
          </div>
          <div className="h-1 bg-[#E5E7EB] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#2A7B6F] to-[#1B3A5C] transition-all duration-500"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>

        {/* ── PASO 1: Energía y Ánimo ── */}
        {paso === 1 && (
          <div className="px-5 space-y-6">
            {/* Energía */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-[#1F2937]">Energía</p>
                <span className="text-3xl">{EMOJI_ENERGÍA[energiaDia]}</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={energiaDia}
                onChange={e => setEnergiaDia(Number(e.target.value))}
                className="w-full h-2 rounded-full cursor-pointer accent-[#2A7B6F]"
              />
              <div className="flex justify-between mt-2">
                {EMOJI_ENERGÍA.slice(1).map((em, i) => (
                  <span
                    key={i}
                    className={`text-lg transition-all ${
                      energiaDia === i + 1 ? 'scale-125' : 'opacity-30'
                    }`}
                  >
                    {em}
                  </span>
                ))}
              </div>
            </div>

            {/* Ánimo */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-[#1F2937]">Ánimo</p>
                <span className="text-3xl">{EMOJI_ENERGÍA[animoDia]}</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={animoDia}
                onChange={e => setAnimoDia(Number(e.target.value))}
                className="w-full h-2 rounded-full cursor-pointer accent-[#B8860B]"
              />
              <div className="flex justify-between mt-2">
                {EMOJI_ENERGÍA.slice(1).map((em, i) => (
                  <span
                    key={i}
                    className={`text-lg transition-all ${
                      animoDia === i + 1 ? 'scale-125' : 'opacity-30'
                    }`}
                  >
                    {em}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => setPaso(2)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#2A7B6F] to-[#1B3A5C] text-white font-semibold text-base shadow-md hover:opacity-90 transition"
            >
              Siguiente →
            </button>
          </div>
        )}

        {/* ── PASO 2: Conductas ancla ── */}
        {paso === 2 && (
          <div className="px-5 space-y-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#FDF3D0] text-[#B8860B] mb-3">
                🎯 Conductas del día
              </span>
              <p className="text-sm text-[#4B5563]">
                ¿Cuáles cumpliste hoy?
              </p>
            </div>

            <div className="space-y-3">
              {conductas.map((conducta, i) => (
                <button
                  key={conducta.id}
                  onClick={() => {
                    const next = [...conductasHoy]
                    next[i] = !next[i]
                    setConductasHoy(next)
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                    conductasHoy[i]
                      ? 'border-[#2A7B6F] bg-[#D4EDEA]'
                      : 'border-[#E5E7EB] bg-white hover:border-[#9CA3AF]'
                  }`}
                >
                  <span className="text-2xl">{conducta.icono}</span>
                  <span className="flex-1 text-sm font-medium text-[#1F2937]">
                    {conducta.nombre}
                  </span>
                  <span className={`text-xl ${conductasHoy[i] ? 'text-[#2A7B6F]' : 'text-[#D1D5DB]'}`}>
                    {conductasHoy[i] ? '✓' : '○'}
                  </span>
                </button>
              ))}
            </div>

            {/* Resumen rápido */}
            <div className="bg-[#D4EDEA] rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-medium text-[#2A7B6F]">
                {conductasHoy.filter(Boolean).length} de {conductas.length} cumplidas
              </span>
              <span className="text-lg">
                {conductasHoy.filter(Boolean).length === conductas.length ? '🌟' :
                 conductasHoy.filter(Boolean).length >= 3 ? '💪' : '💙'}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setPaso(1)}
                className="px-5 py-4 rounded-2xl border border-[#E5E7EB] text-[#6B7280] font-medium hover:bg-[#F9FAFB] transition"
              >
                ←
              </button>
              <button
                onClick={() => setPaso(3)}
                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-[#2A7B6F] to-[#1B3A5C] text-white font-semibold shadow-md hover:opacity-90 transition"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {/* ── PASO 3: Nota libre ── */}
        {paso === 3 && (
          <div className="px-5 space-y-5">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#E8ECF5] text-[#1B3A5C] mb-3">
                ✍️ Nota del día (opcional)
              </span>
              <p className="text-sm text-[#4B5563]">
                ¿Algo que quieras recordar de hoy?
              </p>
            </div>

            <div className="relative">
              <textarea
                value={notaLibre}
                onChange={e => {
                  if (e.target.value.length <= 280) setNotaLibre(e.target.value)
                }}
                placeholder="¿Algo que quieras recordar de hoy?"
                rows={5}
                className="w-full bg-white border border-[#E5E7EB] rounded-2xl p-4 text-sm text-[#1F2937] placeholder-[#9CA3AF] resize-none focus:outline-none focus:ring-2 focus:ring-[#2A7B6F]/30 focus:border-[#2A7B6F]"
              />
              <span
                className={`absolute bottom-3 right-4 text-xs ${
                  notaLibre.length >= 260 ? 'text-[#C87020]' : 'text-[#9CA3AF]'
                }`}
              >
                {notaLibre.length}/280
              </span>
            </div>

            {error && (
              <div className="bg-[#FADDDD] border border-[#F5AEAE] rounded-xl p-3 text-sm text-[#8B1A1A]">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setPaso(2)}
                className="px-5 py-4 rounded-2xl border border-[#E5E7EB] text-[#6B7280] font-medium hover:bg-[#F9FAFB] transition"
              >
                ←
              </button>
              <button
                onClick={handleSubmit}
                disabled={guardando}
                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-[#2A7B6F] to-[#1B3A5C] text-white font-semibold shadow-md hover:opacity-90 disabled:opacity-50 transition"
              >
                {guardando ? 'Guardando...' : '✓ Registrar el día'}
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={guardando}
              className="w-full text-sm text-[#9CA3AF] hover:text-[#6B7280] py-2 transition"
            >
              Saltar nota y registrar
            </button>
          </div>
        )}
      </div>
    </>
  )
}
