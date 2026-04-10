'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calcularScore, type AdherenciaMedicacion } from '@/lib/scoring'
import { evaluarLogros, type RegistroParaLogros } from '@/lib/logros'
import type { InsertRegistroSemanal } from '@/types/database'
import ScoreDisplay from './ScoreDisplay'
import LogroNotification from './LogroNotification'
import { RegistroSemanalSchema } from '@/lib/validations'

interface Props {
  pacienteId: string
  pacienteNombre: string
  semanaInicio: string
  semanaFin: string
  facilitadorWhatsapp: string | null
  registrosAnteriores: RegistroParaLogros[]
  logrosObtenidos: string[]
}

interface FormData {
  animo: number
  sueno: number
  energia: number
  alimentacion: number
  actividad_fisica: number
  adherencia_medicacion: AdherenciaMedicacion
  sintomas: string
  logro_personal: string
  dificultad: string
}

interface Resultado {
  score: number
  nivel_bienestar: string
  emoji_nivel: string
  requiere_atencion: boolean
  logrosNuevos: string[]
}

function Escala({
  label,
  sublabel,
  value,
  onChange,
}: {
  label: string
  sublabel?: string
  value: number
  onChange: (v: number) => void
}) {
  const OPCIONES = [
    { val: 1, emoji: '😰', texto: 'Muy mal' },
    { val: 2, emoji: '😔', texto: 'Mal' },
    { val: 3, emoji: '😐', texto: 'Regular' },
    { val: 4, emoji: '🙂', texto: 'Bien' },
    { val: 5, emoji: '😄', texto: 'Excelente' },
  ]
  return (
    <div className="mb-5">
      <p className="text-sm font-semibold text-text-primary mb-0.5">{label}</p>
      {sublabel && <p className="text-xs text-text-secondary mb-3">{sublabel}</p>}
      <div className="flex gap-2">
        {OPCIONES.map(op => (
          <button
            key={op.val}
            type="button"
            onClick={() => onChange(op.val)}
            className={`flex-1 flex flex-col items-center py-3 rounded-2xl border-2 transition-all ${
              value === op.val
                ? 'border-[#2C4A6E] dark:border-[#3B82F6] bg-[#EEF4F0] dark:bg-[#1E3A5F] scale-105'
                : 'border bg-surface-card hover:border-[#C8DDD0]'
            }`}
          >
            <span className="text-xl">{op.emoji}</span>
            <span className="text-[9px] text-text-secondary mt-0.5">{op.texto}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ProgressBar({ paso }: { paso: number }) {
  const TOTAL = 3
  const TITULOS = ['', 'Estado físico', 'Estado emocional', 'Reflexión personal']
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[#2C4A6E] dark:text-[#93C5FD] uppercase tracking-wide">
          {TITULOS[paso]}
        </span>
        <span className="text-xs text-text-secondary">{paso} / {TOTAL}</span>
      </div>
      <div className="h-1.5 bg-surface-subtle rounded-full overflow-hidden">
        <div
          className="h-full bg-[#2C4A6E] dark:bg-[#3B82F6] rounded-full transition-all duration-500"
          style={{ width: `${(paso / TOTAL) * 100}%` }}
        />
      </div>
    </div>
  )
}

export default function StepperForm({
  pacienteId,
  pacienteNombre,
  semanaInicio,
  semanaFin,
  facilitadorWhatsapp,
  registrosAnteriores,
  logrosObtenidos,
}: Props) {
  const router = useRouter()
  const [paso, setPaso] = useState<1 | 2 | 3 | 'resultado'>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [mostrarLogros, setMostrarLogros] = useState(false)

  const [form, setForm] = useState<FormData>({
    animo: 3,
    sueno: 3,
    energia: 3,
    alimentacion: 3,
    actividad_fisica: 3,
    adherencia_medicacion: 'no_aplica',
    sintomas: '',
    logro_personal: '',
    dificultad: '',
  })

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      // Validar datos del formulario antes de enviar al servidor
      const parsed = RegistroSemanalSchema.safeParse({
        ...form,
        semana_inicio: semanaInicio,
        semana_fin: semanaFin,
      })
      if (!parsed.success) {
        setError('Datos inválidos. Por favor revisá el formulario.')
        return
      }

      const supabase = createClient()
      const scoreResult = calcularScore({
        animo: form.animo,
        sueno: form.sueno,
        energia: form.energia,
        alimentacion: form.alimentacion,
        actividad_fisica: form.actividad_fisica,
        adherencia_medicacion: form.adherencia_medicacion,
      })

      const insert: InsertRegistroSemanal = {
        paciente_id: pacienteId,
        semana_inicio: semanaInicio,
        semana_fin: semanaFin,
        animo: form.animo,
        sueno: form.sueno,
        energia: form.energia,
        alimentacion: form.alimentacion,
        actividad_fisica: form.actividad_fisica,
        adherencia_medicacion: form.adherencia_medicacion,
        sintomas: form.sintomas.trim() || null,
        logro_personal: form.logro_personal.trim() || null,
        dificultad: form.dificultad.trim() || null,
        score: scoreResult.score,
        nivel_bienestar: scoreResult.nivel_bienestar,
        requiere_atencion: scoreResult.requiere_atencion,
      }

      const { error: insertError } = await supabase
        .from('registros_semanales')
        .insert(insert)

      // 🚨 SECURITY: no exponer detalles internos del error al usuario
      if (insertError) throw new Error('SAVE_FAILED')

      const todosRegistros: RegistroParaLogros[] = [
        ...registrosAnteriores,
        { semana_inicio: semanaInicio, score: scoreResult.score, sueno: form.sueno, actividad_fisica: form.actividad_fisica },
      ]
      const logrosNuevos = evaluarLogros(todosRegistros, logrosObtenidos)
      if (logrosNuevos.length > 0) {
        // upsert ignorando conflictos: evita error si el logro ya existe
        // (puede ocurrir por re-submit o race condition)
        await supabase
          .from('logros_paciente')
          .upsert(
            logrosNuevos.map(key => ({ paciente_id: pacienteId, logro_key: key, video_visto: false })),
            { onConflict: 'paciente_id,logro_key', ignoreDuplicates: true }
          )
      }

      setResultado({ ...scoreResult, logrosNuevos })
      setPaso('resultado')
      if (logrosNuevos.length > 0) setMostrarLogros(true)
    } catch (e: unknown) {
      // 🚨 SECURITY: nunca mostrar detalles técnicos al usuario
      if (process.env.NODE_ENV === 'development') {
        console.error('[StepperForm] Error al guardar registro:', e)
      }
      setError('Ocurrió un error al guardar. Por favor intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (paso === 'resultado' && resultado) {
    return (
      <>
        {mostrarLogros && (
          <LogroNotification logros={resultado.logrosNuevos} onClose={() => setMostrarLogros(false)} />
        )}
        <div className="bg-surface-card rounded-2xl border shadow-sm p-6">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-text-primary">¡Registro guardado! 🎉</h2>
            <p className="text-sm text-text-secondary mt-1">Resumen de tu semana</p>
          </div>
          <ScoreDisplay
            score={resultado.score}
            nivel_bienestar={resultado.nivel_bienestar}
            emoji_nivel={resultado.emoji_nivel}
            requiere_atencion={resultado.requiere_atencion}
            semana_inicio={semanaInicio}
            semana_fin={semanaFin}
            facilitadorWhatsapp={facilitadorWhatsapp}
            pacienteNombre={pacienteNombre}
            animo={form.animo}
            sueno={form.sueno}
            energia={form.energia}
            alimentacion={form.alimentacion}
            actividad_fisica={form.actividad_fisica}
            adherencia_medicacion={form.adherencia_medicacion}
            logro_personal={form.logro_personal}
            dificultad={form.dificultad}
            logrosNuevos={resultado.logrosNuevos}
            onVerLogros={() => router.push('/avances')}
          />
        </div>
      </>
    )
  }

  return (
    <div className="bg-surface-card rounded-2xl border shadow-sm p-6">
      <ProgressBar paso={paso as number} />

      {/* PASO 1 */}
      {paso === 1 && (
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-1">¿Cómo estuvo tu cuerpo?</h2>
          <p className="text-sm text-text-secondary mb-6">Sé honesto/a, no hay respuestas incorrectas 💙</p>

          <Escala label="Calidad del sueño" sublabel="¿Cómo dormiste?" value={form.sueno} onChange={v => set('sueno', v)} />
          <Escala label="Nivel de energía" sublabel="¿Cómo estuvo tu energía?" value={form.energia} onChange={v => set('energia', v)} />
          <Escala label="Alimentación" sublabel="¿Cómo comiste?" value={form.alimentacion} onChange={v => set('alimentacion', v)} />

          {/* Actividad física */}
          <div className="mb-5">
            <p className="text-sm font-semibold text-text-primary mb-0.5">Actividad física</p>
            <p className="text-xs text-text-secondary mb-3">Días que hiciste ejercicio esta semana</p>
            <div className="flex gap-1.5">
              {[0,1,2,3,4,5,6,7].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => set('actividad_fisica', d)}
                  className={`flex-1 h-10 rounded-xl font-semibold text-sm border-2 transition-all ${
                    form.actividad_fisica === d
                      ? 'border-[#2C4A6E] dark:border-[#3B82F6] bg-[#EEF4F0] dark:bg-[#1E3A5F] text-[#2C4A6E] dark:text-[#93C5FD] scale-110'
                      : 'border bg-surface-card text-text-secondary hover:border-[#C8DDD0]'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <p className="text-xs text-text-secondary mt-1.5">
              {form.actividad_fisica === 0 ? 'Ningún día' :
               form.actividad_fisica === 7 ? '¡Todos los días! 💪' :
               `${form.actividad_fisica} día${form.actividad_fisica !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Medicación */}
          <div className="mb-7">
            <p className="text-sm font-semibold text-text-primary mb-3">Adherencia a medicación</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { val: 'si' as const,        label: '✅ Sí',  desc: 'Tomé todo' },
                { val: 'no' as const,        label: '❌ No',  desc: 'No tomé' },
                { val: 'no_aplica' as const, label: '➖ N/A', desc: 'No tomo' },
              ]).map(op => (
                <button
                  key={op.val}
                  type="button"
                  onClick={() => set('adherencia_medicacion', op.val)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    form.adherencia_medicacion === op.val
                      ? 'border-[#2C4A6E] dark:border-[#3B82F6] bg-[#EEF4F0] dark:bg-[#1E3A5F]'
                      : 'border bg-surface-card hover:border-[#C8DDD0]'
                  }`}
                >
                  <div className="font-semibold text-sm text-text-primary">{op.label}</div>
                  <div className="text-xs text-text-secondary mt-0.5">{op.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setPaso(2)}
            className="w-full bg-[#2C4A6E] dark:bg-[#3B82F6] hover:bg-[#1E3550] dark:hover:bg-[#2563EB] text-white font-semibold py-3.5 rounded-xl transition-colors text-sm"
          >
            Continuar →
          </button>
        </div>
      )}

      {/* PASO 2 */}
      {paso === 2 && (
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-1">¿Y emocionalmente?</h2>
          <p className="text-sm text-text-secondary mb-6">Tu bienestar emocional importa tanto como el físico 💛</p>

          <Escala label="Estado de ánimo general" sublabel="¿Cómo estuvo tu ánimo esta semana?" value={form.animo} onChange={v => set('animo', v)} />

          <div className="mb-7">
            <p className="text-sm font-semibold text-text-primary mb-1">Síntomas destacados</p>
            <p className="text-xs text-text-secondary mb-2">¿Hubo algo relevante esta semana? (opcional)</p>
            <textarea
              value={form.sintomas}
              onChange={e => set('sintomas', e.target.value)}
              placeholder="Ej: dolor de cabeza, ansiedad, cansancio..."
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 rounded-xl border bg-surface-card focus:outline-none focus:ring-2 focus:ring-[#2C4A6E] dark:focus:ring-[#3B82F6] text-text-primary placeholder:text-text-muted text-sm resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setPaso(1)} className="flex-1 bg-surface-subtle hover:bg-surface-hover text-text-secondary font-medium py-3 rounded-xl transition-colors text-sm border">
              ← Atrás
            </button>
            <button onClick={() => setPaso(3)} className="flex-1 bg-[#2C4A6E] dark:bg-[#3B82F6] hover:bg-[#1E3550] dark:hover:bg-[#2563EB] text-white font-semibold py-3 rounded-xl transition-colors text-sm">
              Continuar →
            </button>
          </div>
        </div>
      )}

      {/* PASO 3 */}
      {paso === 3 && (
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-1">Un momento para reflexionar</h2>
          <p className="text-sm text-text-secondary mb-6">Reconocer logros y obstáculos es parte del proceso 🌱</p>

          <div className="mb-5">
            <p className="text-sm font-semibold text-text-primary mb-1">✨ ¿Tu mayor logro de la semana?</p>
            <p className="text-xs text-text-secondary mb-2">Puede ser algo pequeño, ¡todo cuenta! (opcional)</p>
            <textarea
              value={form.logro_personal}
              onChange={e => set('logro_personal', e.target.value)}
              placeholder="Ej: Me levanté temprano todos los días..."
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 rounded-xl border bg-surface-card focus:outline-none focus:ring-2 focus:ring-[#2C4A6E] dark:focus:ring-[#3B82F6] text-text-primary placeholder:text-text-muted text-sm resize-none"
            />
          </div>

          <div className="mb-6">
            <p className="text-sm font-semibold text-text-primary mb-1">🪨 ¿Qué obstáculo encontraste?</p>
            <p className="text-xs text-text-secondary mb-2">Identificarlo ayuda a buscar soluciones (opcional)</p>
            <textarea
              value={form.dificultad}
              onChange={e => set('dificultad', e.target.value)}
              placeholder="Ej: Me costó mantener la rutina..."
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 rounded-xl border bg-surface-card focus:outline-none focus:ring-2 focus:ring-[#2C4A6E] dark:focus:ring-[#3B82F6] text-text-primary placeholder:text-text-muted text-sm resize-none"
            />
          </div>

          {error && (
            <div className="bg-semaforo-rojo-bg border border-semaforo-rojo-border rounded-xl p-3 text-sm text-semaforo-rojo mb-4">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setPaso(2)} disabled={loading} className="flex-1 bg-surface-subtle hover:bg-surface-hover disabled:opacity-50 text-text-secondary font-medium py-3 rounded-xl transition-colors text-sm border">
              ← Atrás
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-[#2C4A6E] dark:bg-[#3B82F6] hover:bg-[#1E3550] dark:hover:bg-[#2563EB] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Guardando...
                </span>
              ) : 'Enviar registro ✓'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
