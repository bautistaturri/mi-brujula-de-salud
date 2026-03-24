'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const PASOS_PACIENTE = [
  {
    titulo: '¡Bienvenido a tu Brújula!',
    descripcion: 'Cada día, registrarás cómo te sentís en menos de 2 minutos.',
    icono: '🧭',
  },
  {
    titulo: 'Tus 5 conductas ancla',
    descripcion: 'Hemos configurado 5 hábitos clave para vos. Podés personalizarlos después.',
    icono: '✅',
  },
  {
    titulo: 'Tu semáforo personal',
    descripcion: 'Cada día calculamos tu estado: verde, amarillo o rojo, según tus respuestas.',
    icono: '🚦',
  },
]

const PASOS_FACILITADOR = [
  {
    titulo: 'Panel de Facilitador',
    descripcion: 'Desde acá podés monitorear el bienestar de todos tus pacientes en tiempo real.',
    icono: '📊',
  },
  {
    titulo: 'Alertas inteligentes',
    descripcion: 'El sistema detecta automáticamente señales de alerta y te las notifica.',
    icono: '🔔',
  },
  {
    titulo: 'Creá tu primer grupo',
    descripcion: 'Organizá a tus pacientes en grupos para un seguimiento más efectivo.',
    icono: '👥',
  },
]

const SEMAFORO_PREVIEW = [
  { key: 'verde',    label: 'Bien',     color: 'bg-semaforo-verde' },
  { key: 'amarillo', label: 'Atención', color: 'bg-semaforo-amarillo' },
  { key: 'rojo',     label: 'Alerta',   color: 'bg-semaforo-rojo' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [paso, setPaso] = useState(0)
  const [role, setRole] = useState<'paciente' | 'facilitador' | null>(null)
  const [loading, setLoading] = useState(false)

  const pasos = role === 'facilitador' ? PASOS_FACILITADOR : PASOS_PACIENTE
  const esFinal = paso === pasos.length - 1

  async function cargarRol() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      setRole(data?.role ?? 'paciente')
    }
  }

  useEffect(() => {
    cargarRol()
  }, [])

  if (!role) {
    return (
      <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2C4A6E]" />
      </div>
    )
  }

  async function completarOnboarding() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      if (role === 'paciente') {
        await supabase.rpc('crear_conductas_default', { p_user_id: user.id })
      }

      await supabase
        .from('users')
        .update({ onboarding_completado: true })
        .eq('id', user.id)
    }

    router.push(role === 'facilitador' ? '/dashboard' : '/inicio')
    router.refresh()
  }

  const pasoActual = pasos[paso]

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Progress dots */}
        <div className="flex gap-2 justify-center mb-8">
          {pasos.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i < paso
                  ? 'bg-[#2C4A6E] w-6'
                  : i === paso
                  ? 'bg-[#2C4A6E] w-10'
                  : 'bg-[#E2DDD6] w-6'
              }`}
            />
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#E2DDD6] p-8 text-center">
          <div className="text-5xl mb-5">{pasoActual.icono}</div>
          <h2 className="text-xl font-bold text-[#1C1917] mb-3">{pasoActual.titulo}</h2>
          <p className="text-sm text-[#78716C] leading-relaxed mb-6">{pasoActual.descripcion}</p>

          {/* Preview: conductas ancla */}
          {role === 'paciente' && paso === 1 && (
            <div className="bg-[#F7F6F3] rounded-xl p-4 mb-6 text-left space-y-2">
              {['💧 Hidratación', '🏃 Actividad física', '😴 Sueño', '🥗 Alimentación', '💊 Medicación'].map(c => (
                <div key={c} className="flex items-center gap-3 text-sm text-[#1C1917]">
                  <div className="w-4 h-4 rounded border-2 border-semaforo-verde-border bg-semaforo-verde-bg flex items-center justify-center flex-shrink-0">
                    <span className="text-semaforo-verde text-xs">✓</span>
                  </div>
                  {c}
                </div>
              ))}
            </div>
          )}

          {/* Preview: semáforo con colores clínicos */}
          {role === 'paciente' && paso === 2 && (
            <div className="flex justify-center gap-6 mb-6">
              {SEMAFORO_PREVIEW.map(({ key, label, color }) => (
                <div key={key} className="text-center">
                  <div className={`w-10 h-10 rounded-full mx-auto mb-1.5 ${color}`} />
                  <span className="text-xs text-[#78716C]">{label}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            {paso > 0 && (
              <button
                onClick={() => setPaso(p => p - 1)}
                className="flex-1 py-2.5 rounded-xl border border-[#E2DDD6] text-[#78716C] font-medium hover:bg-[#F7F6F3] transition-colors text-sm"
              >
                Atrás
              </button>
            )}
            <button
              onClick={esFinal ? completarOnboarding : () => setPaso(p => p + 1)}
              disabled={loading}
              className="flex-1 bg-[#2C4A6E] hover:bg-[#1E3550] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              {loading ? 'Configurando...' : esFinal ? '¡Empezar!' : 'Siguiente →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
