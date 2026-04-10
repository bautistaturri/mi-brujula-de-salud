'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calcICS } from '@/lib/scoring/motor_ics'
import type { EmocionPrincipal } from '@/types/database'

interface ConductaAncla {
  id: string
  nombre: string
  icono: string
  orden: number
}

interface Props {
  userId: string
  conductas: ConductaAncla[]   // exactamente 5, en orden
  weekStart: string             // YYYY-MM-DD del lunes actual
  yaCompletado: boolean
  redirectTo?: string           // ruta a la que redirigir al terminar (default: /dashboard/paciente)
  icaDaysIniciales?: number[]  // pre-poblar desde registros diarios
  beEnergyInicial?: number     // energía promedio de la semana (sugerencia)
}

type Paso = 1 | 2 | 3 | 'resultado'

const SEMAPHORE_CONFIG = {
  green: {
    label: 'Verde',
    bg: 'from-[#1A6B3C] to-[#2A9B5A]',
    text: 'text-[#1A6B3C]',
    bgLight: 'bg-[#D6EFE1]',
    msg: '¡Excelente semana! Seguís construyendo tu brújula.',
  },
  amber: {
    label: 'Amarillo',
    bg: 'from-[#8B4800] to-[#C87020]',
    text: 'text-[#8B4800]',
    bgLight: 'bg-[#FDE8CC]',
    msg: 'Semana de desafíos. Cada paso cuenta.',
  },
  red: {
    label: 'Rojo',
    bg: 'from-[#6B1010] to-[#A83020]',
    text: 'text-[#8B1A1A]',
    bgLight: 'bg-[#FADDDD]',
    msg: 'Tu equipo de salud está al tanto. No estás sola/o.',
  },
}

const DOMAIN_LABELS = {
  ica: 'Conductual',
  be: 'Emocional',
  ini: 'Mental',
}

const EMOCIONES_MF: { key: EmocionPrincipal; label: string; emoji: string }[] = [
  { key: 'alegre',   label: 'Alegre',    emoji: '😊' },
  { key: 'sorpresa', label: 'Sorpresa',  emoji: '😮' },
  { key: 'miedo',    label: 'Miedo',     emoji: '😨' },
  { key: 'triste',   label: 'Triste',    emoji: '😢' },
  { key: 'enojado',  label: 'Enojado/a', emoji: '😠' },
  { key: 'asco',     label: 'Asco',      emoji: '🤢' },
]

/** Deriva el ini_score legacy (1|3|5) a partir de saboteador vs observador */
function derivarIniScore(saboteador: number, observador: number): 1 | 3 | 5 {
  if (observador > saboteador) return 5
  if (observador < saboteador) return 1
  return 3
}

export default function CheckinICS({
  userId,
  conductas,
  weekStart,
  yaCompletado,
  redirectTo = '/dashboard/paciente',
  icaDaysIniciales,
  beEnergyInicial,
}: Props) {
  const router = useRouter()

  // Estado ICA
  const [icaDays, setIcaDays] = useState<number[]>(
    icaDaysIniciales ?? [0, 0, 0, 0, 0]
  )
  const [icaBarriers, setIcaBarriers] = useState(0)

  // Estado BE
  const [beEnergy, setBeEnergy] = useState(beEnergyInicial ?? 3)
  const [beRegulation, setBeRegulation] = useState<1 | 3 | 5>(3)
  const [emocionPrincipal, setEmocionPrincipal] = useState<EmocionPrincipal | null>(null)

  // Estado Mental Fitness (reemplaza el picker 1/3/5)
  const [saboteadorScore, setSaboteadorScore] = useState(4)
  const [observadorScore, setObservadorScore] = useState(4)

  // Control
  const [paso, setPaso] = useState<Paso>(1)
  const [guardando, setGuardando] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [resultado, setResultado] = useState<ReturnType<typeof calcICS> | null>(null)

  // Preview en tiempo real
  const icaPreview = useMemo(() => {
    const total = icaDays.reduce((a, b) => a + b, 0)
    return Math.round((total / 35) * 100)
  }, [icaDays])

  const bePreview = useMemo(() => {
    const be = beEnergy * 0.4 + beRegulation * 0.6
    return Math.round(((be - 1) / 4) * 100)
  }, [beEnergy, beRegulation])

  if (yaCompletado) {
    return (
      <div
        className="mx-5 mt-6 p-6 rounded-2xl text-center border"
        style={{ background: 'var(--semaforo-verde-bg)', borderColor: 'var(--semaforo-verde-border)' }}
      >
        <p className="text-2xl mb-2">✅</p>
        <p className="font-semibold" style={{ color: 'var(--semaforo-verde-text)' }}>Ya completaste tu check-in esta semana</p>
        <p className="text-sm mt-1" style={{ color: 'var(--semaforo-verde-text)' }}>Volvé el próximo lunes</p>
        <button
          onClick={() => router.push(redirectTo)}
          className="mt-4 text-sm underline"
          style={{ color: 'var(--semaforo-verde-text)' }}
        >
          Ver mi dashboard →
        </button>
      </div>
    )
  }

  async function guardar() {
    setGuardando(true)
    setErrorMsg(null)

    const iniScore = derivarIniScore(saboteadorScore, observadorScore)

    const res = calcICS({
      ica_days: icaDays,
      ica_barriers: icaBarriers,
      be_energy: beEnergy,
      be_regulation: beRegulation,
      ini_score: iniScore,
    })

    setResultado(res)

    const supabase = createClient()
    const { error } = await supabase.rpc('save_checkin_ics', {
      p_user_id:           userId,
      p_week_start:        weekStart,
      p_ica_days:          icaDays,
      p_ica_barriers:      icaBarriers,
      p_be_energy:         beEnergy,
      p_be_regulation:     beRegulation,
      p_ini_score:         iniScore,
      p_semaphore:         res.semaphore,
      p_alerts:            res.alerts,
      p_scores:            res.scores,
      p_dominant:          res.dominant_domain,
      p_emocion_principal: emocionPrincipal,
      p_saboteador_score:  saboteadorScore,
      p_observador_score:  observadorScore,
    })

    if (error) {
      setErrorMsg(error.message)
      setGuardando(false)
      return
    }

    setPaso('resultado')
    setGuardando(false)
  }

  const progreso = paso === 'resultado' ? 100 : ((paso as number) / 3) * 100

  return (
    <div className="pb-24">
      {/* Barra de progreso */}
      {paso !== 'resultado' && (
        <div className="px-5 pt-5 mb-6">
          <div className="flex justify-between text-[11px] font-semibold text-text-muted mb-2">
            <span className={paso === 1 ? 'text-[#2A7B6F]' : ''}>Conductual</span>
            <span className={paso === 2 ? 'text-[#B8860B]' : ''}>Emocional</span>
            <span className={paso === 3 ? 'text-[#1B3A5C] dark:text-[#93C5FD]' : ''}>Mental Fitness</span>
          </div>
          <div className="h-1 bg-surface-subtle rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#2A7B6F] to-[#1B3A5C] transition-all duration-500"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>
      )}

      {/* ── PASO 1: ICA ── */}
      {paso === 1 && (
        <div className="px-5 space-y-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#D4EDEA] dark:bg-[#064E3B] text-[#2A7B6F] dark:text-[#6EE7B7] mb-3">
              🎯 Conductas Ancla
            </span>
            <h2 className="font-serif text-[26px] text-text-primary leading-tight mb-1">
              ¿Cuántos días la cumpliste?
            </h2>
            <p className="text-sm text-text-secondary">
              Mové cada slider para indicar los días (0–7) que realizaste cada conducta esta semana.
            </p>
          </div>

          {/* Sliders por conducta */}
          <div className="space-y-5">
            {conductas.map((conducta, i) => (
              <div key={conducta.id} className="bg-surface-card rounded-2xl border p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{conducta.icono}</span>
                    <span className="text-sm font-medium text-text-primary">{conducta.nombre}</span>
                  </div>
                  <span className="text-xl font-bold text-[#2A7B6F] tabular-nums w-6 text-right">
                    {icaDays[i]}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={7}
                  step={1}
                  value={icaDays[i]}
                  onChange={e => {
                    const next = [...icaDays]
                    next[i] = Number(e.target.value)
                    setIcaDays(next)
                  }}
                  className="w-full h-1.5 rounded-full cursor-pointer accent-[#2A7B6F]"
                />
                <div className="flex justify-between text-[10px] text-text-muted mt-1">
                  <span>0 días</span>
                  <span>7 días</span>
                </div>
              </div>
            ))}
          </div>

          {/* Preview ICA */}
          <div
            className="rounded-xl px-4 py-3 flex items-center justify-between"
            style={{ background: 'var(--semaforo-verde-bg)' }}
          >
            <span className="text-sm font-medium" style={{ color: 'var(--semaforo-verde-text)' }}>Conductas logradas</span>
            <span className="text-xl font-bold" style={{ color: 'var(--semaforo-verde-text)' }}>{icaPreview}%</span>
          </div>

          {/* Selector de barreras */}
          <div>
            <p className="text-sm font-semibold text-text-primary mb-2">
              ¿Superaste barreras para cumplirlas?
            </p>
            <div className="flex gap-2">
              {([0, 1, 2, 3] as const).map(n => (
                <button
                  key={n}
                  onClick={() => setIcaBarriers(n)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                    icaBarriers === n
                      ? 'bg-[#D4EDEA] dark:bg-[#064E3B] text-[#2A7B6F] dark:text-[#6EE7B7] border-[#2A7B6F] dark:border-[#10B981]'
                      : 'bg-surface-subtle text-text-secondary border hover:border-[#9CA3AF]'
                  }`}
                >
                  {n === 0 ? 'Ninguna' : n === 1 ? '1' : n === 2 ? '2' : '3+'}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setPaso(2)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#2A7B6F] to-[#1B3A5C] text-white font-semibold text-base shadow-md hover:opacity-90 transition"
          >
            Siguiente — Brújula Emocional →
          </button>
        </div>
      )}

      {/* ── PASO 2: BE ── */}
      {paso === 2 && (
        <div className="px-5 space-y-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#FDF3D0] dark:bg-[#451A03] text-[#B8860B] dark:text-[#FCD34D] mb-3">
              🧭 Brújula Emocional
            </span>
            <h2 className="font-serif text-[26px] text-text-primary leading-tight mb-1">
              ¿Cómo estuvo tu energía?
            </h2>
            <p className="text-sm text-text-secondary">
              Evaluá tu estado emocional de esta semana.
            </p>
          </div>

          {/* Energía vital */}
          <div className="bg-surface-card rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-text-primary">Energía vital</p>
              <span className="text-2xl font-bold text-[#B8860B]">{beEnergy}/5</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={beEnergy}
              onChange={e => setBeEnergy(Number(e.target.value))}
              className="w-full h-1.5 rounded-full cursor-pointer accent-[#B8860B] mt-3"
            />
            <div className="flex justify-between text-[10px] text-text-muted mt-1">
              <span>Sin energía</span>
              <span>Plena energía</span>
            </div>
          </div>

          {/* Regulación emocional */}
          <div>
            <p className="text-sm font-semibold text-text-primary mb-3">Regulación emocional</p>
            <div className="grid grid-cols-3 gap-3">
              {([
                { value: 1, icon: '⛈️', label: 'Tempestad', desc: 'Difícil manejar las emociones' },
                { value: 3, icon: '⛅', label: 'Nublado',   desc: 'Momentos altos y bajos' },
                { value: 5, icon: '☀️', label: 'Sol',       desc: 'Bien regulada/o' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setBeRegulation(opt.value)}
                  className={`flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition-all text-center ${
                    beRegulation === opt.value
                      ? 'border-[#B8860B] bg-[#FDF3D0] dark:bg-[#451A03]'
                      : 'border bg-surface-card hover:border-[#D1D5DB]'
                  }`}
                >
                  <span className="text-3xl">{opt.icon}</span>
                  <span className="text-xs font-bold text-text-primary">{opt.label}</span>
                  <span className="text-[10px] text-text-secondary leading-tight">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Emoción principal */}
          <div>
            <p className="text-sm font-semibold text-text-primary mb-1">
              ¿Qué emoción estuvo presente la mayor parte de la semana?
            </p>
            <p className="text-xs text-text-secondary mb-3">Opcional</p>
            <div className="grid grid-cols-3 gap-2">
              {EMOCIONES_MF.map(em => (
                <button
                  key={em.key}
                  onClick={() => setEmocionPrincipal(
                    emocionPrincipal === em.key ? null : em.key
                  )}
                  className={`flex flex-col items-center gap-1 py-3 px-2 rounded-2xl border-2 transition-all ${
                    emocionPrincipal === em.key
                      ? 'border-[#B8860B] bg-[#FDF3D0] dark:bg-[#451A03]'
                      : 'border bg-surface-card hover:border-[#D1D5DB]'
                  }`}
                >
                  <span className="text-2xl">{em.emoji}</span>
                  <span className="text-[11px] font-medium text-text-primary">{em.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Preview BE */}
          <div
            className="rounded-xl px-4 py-3 flex items-center justify-between"
            style={{ background: 'var(--semaforo-amarillo-bg)' }}
          >
            <span className="text-sm font-medium" style={{ color: 'var(--semaforo-amarillo-text)' }}>Bienestar emocional</span>
            <span className="text-xl font-bold" style={{ color: 'var(--semaforo-amarillo-text)' }}>{bePreview}%</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setPaso(1)}
              className="px-5 py-4 rounded-2xl border text-text-secondary font-medium hover:bg-surface-subtle transition"
            >
              ←
            </button>
            <button
              onClick={() => setPaso(3)}
              className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-[#2A7B6F] to-[#1B3A5C] text-white font-semibold shadow-md hover:opacity-90 transition"
            >
              Siguiente — Mental Fitness →
            </button>
          </div>
        </div>
      )}

      {/* ── PASO 3: Mental Fitness ── */}
      {paso === 3 && (
        <div className="px-5 space-y-6">
          <div>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-3"
              style={{ background: 'var(--brand-primary-soft)', color: 'var(--brand-primary)' }}
            >
              🧠 Entrenamiento Cerebral (Mental Fitness)
            </span>
            <h2 className="font-serif text-[26px] text-text-primary leading-tight mb-1">
              ¿Cómo te hablaste esta semana?
            </h2>
            <p className="text-sm text-text-secondary">
              Indicá en qué medida estuvieron presentes el Saboteador y el Observador.
            </p>
          </div>

          {/* Saboteador slider */}
          <div className="bg-surface-card rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">😤</span>
                <div>
                  <p className="text-sm font-bold text-text-primary">Saboteador</p>
                  <p className="text-[11px] text-text-secondary">Me critiqué, me boicoteé o abandoné</p>
                </div>
              </div>
              <span className="text-xl font-bold text-[#8B1A1A] dark:text-[#FCA5A5] tabular-nums">{saboteadorScore}</span>
            </div>
            <input
              type="range"
              min={1}
              max={7}
              step={1}
              value={saboteadorScore}
              onChange={e => setSaboteadorScore(Number(e.target.value))}
              className="w-full h-1.5 rounded-full cursor-pointer accent-[#A83020] mt-3"
            />
            <div className="flex justify-between text-[10px] text-text-muted mt-1">
              <span>Casi nada</span>
              <span>Muy presente</span>
            </div>
          </div>

          {/* Observador slider */}
          <div className="bg-surface-card rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">👁️</span>
                <div>
                  <p className="text-sm font-bold text-text-primary">Observador</p>
                  <p className="text-[11px] text-text-secondary">Fui consciente y me acompañé con compasión</p>
                </div>
              </div>
              <span className="text-xl font-bold text-[#1B3A5C] dark:text-[#93C5FD] tabular-nums">{observadorScore}</span>
            </div>
            <input
              type="range"
              min={1}
              max={7}
              step={1}
              value={observadorScore}
              onChange={e => setObservadorScore(Number(e.target.value))}
              className="w-full h-1.5 rounded-full cursor-pointer accent-[#2A4F7A] mt-3"
            />
            <div className="flex justify-between text-[10px] text-text-muted mt-1">
              <span>Casi nada</span>
              <span>Muy presente</span>
            </div>
          </div>

          {/* Indicador resultado Mental Fitness */}
          <div
            className="rounded-xl px-4 py-3 flex items-center justify-between"
            style={{ background: 'var(--brand-primary-soft)' }}
          >
            <span className="text-sm font-medium" style={{ color: 'var(--brand-primary)' }}>Voz predominante</span>
            <span className="text-sm font-bold" style={{ color: 'var(--brand-primary)' }}>
              {observadorScore > saboteadorScore
                ? '💚 Aliado/Observador'
                : observadorScore === saboteadorScore
                ? '👁️ Equilibrado'
                : '😤 Saboteador'}
            </span>
          </div>

          {errorMsg && (
            <div
              className="rounded-xl p-3 text-sm border"
              style={{ background: 'var(--semaforo-rojo-bg)', borderColor: 'var(--semaforo-rojo-border)', color: 'var(--semaforo-rojo-text)' }}
            >
              {errorMsg}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setPaso(2)}
              className="px-5 py-4 rounded-2xl border text-text-secondary font-medium hover:bg-surface-subtle transition"
            >
              ←
            </button>
            <button
              onClick={guardar}
              disabled={guardando}
              className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-[#2A7B6F] to-[#1B3A5C] text-white font-semibold shadow-md hover:opacity-90 disabled:opacity-50 transition"
            >
              {guardando ? 'Guardando...' : '✓ Ver mi semáforo'}
            </button>
          </div>
        </div>
      )}

      {/* ── RESULTADO ── */}
      {paso === 'resultado' && resultado && (
        <div className="px-5 space-y-5 pt-4">
          {/* Hero semáforo */}
          <div className={`bg-gradient-to-br ${SEMAPHORE_CONFIG[resultado.semaphore].bg} rounded-3xl p-7 text-white relative overflow-hidden`}>
            <div className="absolute top-[-40px] right-[-40px] w-48 h-48 rounded-full bg-white/10 pointer-events-none" />
            <p className="text-[11px] font-bold tracking-widest uppercase opacity-70 mb-1">
              Índice Compass Semanal
            </p>
            <h2 className="font-serif text-[32px] leading-tight mb-1">
              Zona {SEMAPHORE_CONFIG[resultado.semaphore].label}
            </h2>
            <p className="text-sm opacity-80 max-w-[200px] leading-relaxed">
              {SEMAPHORE_CONFIG[resultado.semaphore].msg}
            </p>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-center">
              <span className="font-serif text-6xl opacity-90 block leading-none">
                {resultado.scores.ics}
              </span>
              <span className="text-[10px] font-semibold tracking-widest uppercase opacity-60">
                ICS
              </span>
            </div>
          </div>

          {/* Breakdown 3 dominios */}
          <div className="grid grid-cols-3 gap-3">
            <DomainCard label="ICA" value={resultado.scores.ica} color="teal" icon="🎯" />
            <DomainCard label="BE"  value={resultado.scores.be_norm} color="amber" icon="🧭" />
            <DomainCard label="MF"  value={resultado.scores.ini_norm} color="navy" icon="🧠" />
          </div>

          {/* Resumen de scores */}
          <div className="bg-surface-card rounded-2xl border p-5 shadow-sm space-y-3">
            <ResultRow label="Conductas logradas (ICA)" value={`${resultado.scores.ica}%`} />
            <ResultRow label="Brújula emocional (BE)" value={`${resultado.scores.be}/5`} />
            {emocionPrincipal && (
              <ResultRow
                label="Emoción principal"
                value={EMOCIONES_MF.find(e => e.key === emocionPrincipal)?.label ?? emocionPrincipal}
              />
            )}
            <ResultRow
              label="Mental Fitness (MF)"
              value={
                observadorScore > saboteadorScore ? 'Aliado/Observador' :
                observadorScore === saboteadorScore ? 'Equilibrado' : 'Saboteador'
              }
            />
            <ResultRow
              label="Dominio principal"
              value={DOMAIN_LABELS[resultado.dominant_domain as keyof typeof DOMAIN_LABELS]}
            />
          </div>

          {/* Alertas activas */}
          {resultado.alerts.length > 0 && (
            <div
              className="rounded-2xl p-4 space-y-1.5 border"
              style={{ background: 'var(--semaforo-rojo-bg)', borderColor: 'var(--semaforo-rojo-border)' }}
            >
              <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--semaforo-rojo-text)' }}>
                Alertas activas
              </p>
              {resultado.alerts.map(a => (
                <p key={a} className="text-sm flex items-center gap-2" style={{ color: 'var(--semaforo-rojo-text)' }}>
                  <span>⚠️</span>
                  <span>
                    {a === 'be_critical'    && 'Energía emocional crítica'}
                    {a === 'ini_saboteador' && 'Voz interna saboteadora'}
                    {a === 'ica_zero'       && 'Sin conductas cumplidas'}
                    {a === 'combined_risk'  && 'Riesgo combinado alto'}
                  </span>
                </p>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => router.push(redirectTo)}
              className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-[#2A7B6F] to-[#1B3A5C] text-white font-semibold shadow-md hover:opacity-90 transition"
            >
              Ver mi dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Sub-componentes

function DomainCard({ label, value, color, icon }: {
  label: string
  value: number
  color: 'teal' | 'amber' | 'navy'
  icon: string
}) {
  const colors = {
    teal:  { text: 'text-[#2A7B6F]',                      bar: 'bg-[#2A7B6F]'  },
    amber: { text: 'text-[#B8860B]',                      bar: 'bg-[#C87020]'  },
    navy:  { text: 'text-[#1B3A5C] dark:text-[#93C5FD]',  bar: 'bg-[#2A4F7A]'  },
  }
  const c = colors[color]
  return (
    <div className="bg-surface-card rounded-2xl border p-3 text-center shadow-sm">
      <div className="text-xl mb-1">{icon}</div>
      <div className="text-[10px] font-bold text-text-muted uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-lg font-bold font-serif ${c.text}`}>{Math.round(value)}%</div>
      <div className="h-1 bg-surface-subtle rounded-full mt-2 overflow-hidden">
        <div
          className={`h-full rounded-full ${c.bar} transition-all duration-700`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  )
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b last:border-0">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="text-sm font-bold text-text-primary">{value}</span>
    </div>
  )
}
