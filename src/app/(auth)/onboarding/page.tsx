'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const PASOS_PACIENTE = [
  {
    titulo: '¡Bienvenido a tu Brújula!',
    descripcion: 'Cada día, registrarás cómo te sentís en menos de 2 minutos.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="13" stroke="#2563EB" strokeWidth="1.5" strokeOpacity="0.3"/>
        <circle cx="16" cy="16" r="2" fill="#2563EB"/>
        <path d="M16 7l1.5 7L16 16l-1.5-2Z" fill="#2563EB"/>
        <path d="M16 25l-1.5-7L16 16l1.5 2Z" fill="#2563EB" fillOpacity="0.4"/>
        <path d="M7 16l7-1.5L16 16l-2 1.5Z" fill="#2563EB" fillOpacity="0.4"/>
        <path d="M25 16l-7 1.5L16 16l2-1.5Z" fill="#2563EB" fillOpacity="0.7"/>
      </svg>
    ),
  },
  {
    titulo: 'Tus 5 conductas ancla',
    descripcion: 'Hemos configurado 5 hábitos clave para vos. Podés personalizarlos después.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="5" y="5" width="22" height="22" rx="4" stroke="#2563EB" strokeWidth="1.5" fill="none"/>
        <path d="M11 16l3 3 7-7" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    titulo: 'Tu semáforo personal',
    descripcion: 'Cada día calculamos tu estado: verde, amarillo o rojo, según tus respuestas.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="12" y="3" width="8" height="26" rx="4" stroke="#94A3B8" strokeWidth="1.5" fill="none"/>
        <circle cx="16" cy="10" r="2.5" fill="#10B981"/>
        <circle cx="16" cy="16" r="2.5" fill="#F59E0B"/>
        <circle cx="16" cy="22" r="2.5" fill="#EF4444"/>
      </svg>
    ),
  },
]

const PASOS_FACILITADOR = [
  {
    titulo: 'Panel de Facilitador',
    descripcion: 'Desde acá podés monitorear el bienestar de todos tus pacientes en tiempo real.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="3" y="3" width="11" height="11" rx="2" stroke="#2563EB" strokeWidth="1.5"/>
        <rect x="18" y="3" width="11" height="11" rx="2" stroke="#2563EB" strokeWidth="1.5"/>
        <rect x="3" y="18" width="11" height="11" rx="2" stroke="#2563EB" strokeWidth="1.5"/>
        <rect x="18" y="18" width="11" height="11" rx="2" stroke="#2563EB" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    titulo: 'Alertas inteligentes',
    descripcion: 'El sistema detecta automáticamente señales de alerta y te las notifica.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M16 4a9 9 0 00-9 9v5l-2 3h22l-2-3v-5a9 9 0 00-9-9z" stroke="#2563EB" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M13 23a3 3 0 006 0" stroke="#2563EB" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    titulo: 'Creá tu primer grupo',
    descripcion: 'Organizá a tus pacientes en grupos para un seguimiento más efectivo.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="12" cy="11" r="4" stroke="#2563EB" strokeWidth="1.5"/>
        <path d="M4 27c0-4.42 3.58-8 8-8s8 3.58 8 8" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="24" cy="11" r="3" stroke="#2563EB" strokeWidth="1.5"/>
        <path d="M27 24c0-2.76-1.79-5.12-4.28-5.87" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
]

function Spinner() {
  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const [paso, setPaso] = useState(0)
  const [role, setRole] = useState<'paciente' | 'facilitador' | null>(null)
  const [loading, setLoading] = useState(false)

  const pasos = role === 'facilitador' ? PASOS_FACILITADOR : PASOS_PACIENTE
  const esFinal = paso === pasos.length - 1

  useEffect(() => {
    async function cargarRol() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
        setRole(data?.role ?? 'paciente')
      }
    }
    cargarRol()
  }, [])

  if (!role) return <Spinner />

  async function completarOnboarding() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      if (role === 'paciente') {
        await supabase.rpc('crear_conductas_default', { p_user_id: user.id })
      }
      await supabase.from('users').update({ onboarding_completado: true }).eq('id', user.id)
    }

    router.push(role === 'facilitador' ? '/dashboard' : '/inicio')
    router.refresh()
  }

  const pasoActual = pasos[paso]
  const progress = ((paso + 1) / pasos.length) * 100

  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in-up">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <span className="text-2xl">🧭</span>
            <span className="font-heading font-bold text-text-primary">Mi Brújula de Salud</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-text-muted">Paso {paso + 1} de {pasos.length}</span>
            <span className="text-xs font-semibold text-brand-primary">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-surface-subtle rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: 'var(--brand-primary)' }}
            />
          </div>
        </div>

        <div className="bg-surface-card rounded-2xl border border-border-default p-8 text-center" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}>

          {/* Icon */}
          <div
            className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
            style={{ background: '#EFF6FF' }}
          >
            {pasoActual.icon}
          </div>

          <h2 className="font-heading text-h3 font-bold text-text-primary mb-3">{pasoActual.titulo}</h2>
          <p className="text-sm text-text-secondary leading-relaxed mb-6">{pasoActual.descripcion}</p>

          {/* Preview: conductas ancla */}
          {role === 'paciente' && paso === 1 && (
            <div className="bg-surface-subtle rounded-xl p-4 mb-6 text-left space-y-2">
              {['💧 Hidratación', '🏃 Actividad física', '😴 Sueño', '🥗 Alimentación', '💊 Medicación'].map(c => (
                <div key={c} className="flex items-center gap-3 text-sm text-text-primary">
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                    style={{ background: '#ECFDF5', border: '1.5px solid #A7F3D0' }}
                  >
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1 4l2 2 4-4" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  {c}
                </div>
              ))}
            </div>
          )}

          {/* Preview: semáforo */}
          {role === 'paciente' && paso === 2 && (
            <div className="flex justify-center gap-6 mb-6">
              {[
                { label: 'Bien',     color: '#10B981', bg: '#ECFDF5' },
                { label: 'Atención', color: '#F59E0B', bg: '#FFFBEB' },
                { label: 'Alerta',   color: '#EF4444', bg: '#FEF2F2' },
              ].map(({ label, color, bg }) => (
                <div key={label} className="text-center">
                  <div
                    className="w-10 h-10 rounded-full mx-auto mb-1.5"
                    style={{ background: color }}
                  />
                  <span className="text-xs font-medium text-text-muted">{label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 mt-2">
            {paso > 0 && (
              <button
                onClick={() => setPaso(p => p - 1)}
                className="btn-secondary flex-1 py-2.5"
              >
                Atrás
              </button>
            )}
            <button
              onClick={esFinal ? completarOnboarding : () => setPaso(p => p + 1)}
              disabled={loading}
              className="btn-primary flex-1 py-2.5"
            >
              {loading ? 'Configurando...' : esFinal ? '¡Empezar!' : 'Siguiente →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
