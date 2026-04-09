'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ── Pasos informativos (existentes, sin cambios) ─────────────────
const PASOS_INFO_PACIENTE = [
  {
    titulo: '¡Bienvenido a tu Brújula!',
    descripcion: 'Cada semana, registrarás cómo te sentís en menos de 2 minutos.',
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
    titulo: 'Tus conductas ancla',
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
    descripcion: 'Cada semana calculamos tu estado: verde, amarillo o rojo, según tus respuestas.',
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

// ── Tipos para el formulario clínico ──────────────────────────────
interface DatosClinicosForm {
  peso_inicial: string
  altura: string
  toma_medicacion: boolean | null
  detalle_medicacion: string
  antec_tabaquismo: boolean
  antec_alcohol: boolean
  antec_otras_sustancias: boolean
  antec_cirugia: boolean
  antec_cancer: boolean
  antec_tiroides: boolean
  antec_otros: string
}

function Spinner() {
  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
    </div>
  )
}

// ── Toggle simple sí/no/no-responder ──────────────────────────────
function ToggleSiNo({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean | null
  onChange: (v: boolean | null) => void
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border-default last:border-0">
      <span className="text-sm text-text-primary">{label}</span>
      <div className="flex gap-1.5">
        {([true, false] as const).map(v => (
          <button
            key={String(v)}
            type="button"
            onClick={() => onChange(value === v ? null : v)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
              value === v
                ? v
                  ? 'bg-[#2C4A6E] text-white border-[#2C4A6E]'
                  : 'bg-[#F3F4F6] text-[#6B7280] border-[#D1D5DB]'
                : 'bg-white text-text-muted border-border-default hover:border-brand-primary'
            }`}
          >
            {v ? 'Sí' : 'No'}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const [role, setRole]   = useState<'paciente' | 'facilitador' | null>(null)
  const [loading, setLoading] = useState(false)
  // 'info' = pasos informativos, 'clinico' = cuestionario clínico, 'done'
  const [etapa, setEtapa] = useState<'info' | 'clinico'>('info')
  const [pasoInfo, setPasoInfo] = useState(0)

  const [clinico, setClin] = useState<DatosClinicosForm>({
    peso_inicial: '',
    altura: '',
    toma_medicacion: null,
    detalle_medicacion: '',
    antec_tabaquismo: false,
    antec_alcohol: false,
    antec_otras_sustancias: false,
    antec_cirugia: false,
    antec_cancer: false,
    antec_tiroides: false,
    antec_otros: '',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('users').select('role').eq('id', user.id).single()
          .then(({ data }) => setRole(data?.role ?? 'paciente'))
      }
    })
  }, [])

  if (!role) return <Spinner />

  const pasosInfo  = role === 'facilitador' ? PASOS_FACILITADOR : PASOS_INFO_PACIENTE
  const esFinalInfo = pasoInfo === pasosInfo.length - 1

  // ── Completar onboarding (sin paso clínico para facilitadores) ──
  async function completarOnboarding(skipClinico = false) {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    if (role === 'paciente') {
      await supabase.rpc('crear_conductas_default', { p_user_id: user.id })

      if (!skipClinico) {
        // Guardar datos clínicos
        const updates: Record<string, unknown> = {
          onboarding_completado: true,
          onboarding_clinico_completado: true,
        }
        if (clinico.peso_inicial)    updates.peso_inicial = parseFloat(clinico.peso_inicial)
        if (clinico.altura)          updates.altura = parseInt(clinico.altura)
        if (clinico.toma_medicacion !== null) {
          updates.toma_medicacion = clinico.toma_medicacion
          if (clinico.toma_medicacion && clinico.detalle_medicacion.trim()) {
            updates.detalle_medicacion = clinico.detalle_medicacion.trim()
          }
        }
        updates.antec_tabaquismo        = clinico.antec_tabaquismo
        updates.antec_alcohol           = clinico.antec_alcohol
        updates.antec_otras_sustancias  = clinico.antec_otras_sustancias
        updates.antec_cirugia           = clinico.antec_cirugia
        updates.antec_cancer            = clinico.antec_cancer
        updates.antec_tiroides          = clinico.antec_tiroides
        if (clinico.antec_otros.trim()) updates.antec_otros = clinico.antec_otros.trim()

        await supabase.from('users').update(updates).eq('id', user.id)

        // Si el paciente respondió que NO toma medicación,
        // desactivar la conducta ancla de medicación
        if (clinico.toma_medicacion === false) {
          await supabase
            .from('conductas_ancla')
            .update({ activa: false })
            .eq('user_id', user.id)
            .ilike('nombre', '%medicac%')
        }
      } else {
        await supabase.from('users').update({ onboarding_completado: true }).eq('id', user.id)
      }
    } else {
      await supabase.from('users').update({ onboarding_completado: true }).eq('id', user.id)
    }

    router.push(role === 'facilitador' ? '/dashboard' : '/inicio')
    router.refresh()
  }

  // ── ETAPA INFO ────────────────────────────────────────────────
  if (etapa === 'info') {
    const pasoActual = pasosInfo[pasoInfo]
    const totalPasos = role === 'paciente'
      ? pasosInfo.length + 1   // +1 para el paso clínico
      : pasosInfo.length
    const progress = ((pasoInfo + 1) / totalPasos) * 100

    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center p-4">
        <div className="w-full max-w-sm animate-fade-in-up">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2">
              <span className="text-2xl">🧭</span>
              <span className="font-heading font-bold text-text-primary">Mi Brújula de Salud</span>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-text-muted">Paso {pasoInfo + 1} de {totalPasos}</span>
              <span className="text-xs font-semibold text-brand-primary">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-surface-subtle rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: 'var(--brand-primary)' }} />
            </div>
          </div>

          <div className="bg-surface-card rounded-2xl border border-border-default p-8 text-center" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}>
            <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center" style={{ background: '#EFF6FF' }}>
              {pasoActual.icon}
            </div>
            <h2 className="font-heading text-h3 font-bold text-text-primary mb-3">{pasoActual.titulo}</h2>
            <p className="text-sm text-text-secondary leading-relaxed mb-6">{pasoActual.descripcion}</p>

            {/* Preview conductas (solo paciente, paso 1) */}
            {role === 'paciente' && pasoInfo === 1 && (
              <div className="bg-surface-subtle rounded-xl p-4 mb-6 text-left space-y-2">
                {['💧 Hidratación', '🏃 Actividad física', '😴 Sueño', '🥗 Alimentación', '💊 Medicación'].map(c => (
                  <div key={c} className="flex items-center gap-3 text-sm text-text-primary">
                    <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ background: '#ECFDF5', border: '1.5px solid #A7F3D0' }}>
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1 4l2 2 4-4" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    {c}
                  </div>
                ))}
              </div>
            )}

            {/* Preview semáforo (paciente, paso 2) */}
            {role === 'paciente' && pasoInfo === 2 && (
              <div className="flex justify-center gap-6 mb-6">
                {[
                  { label: 'Bien',     color: '#10B981', bg: '#ECFDF5' },
                  { label: 'Atención', color: '#F59E0B', bg: '#FFFBEB' },
                  { label: 'Alerta',   color: '#EF4444', bg: '#FEF2F2' },
                ].map(({ label, color }) => (
                  <div key={label} className="text-center">
                    <div className="w-10 h-10 rounded-full mx-auto mb-1.5" style={{ background: color }} />
                    <span className="text-xs font-medium text-text-muted">{label}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-2">
              {pasoInfo > 0 && (
                <button onClick={() => setPasoInfo(p => p - 1)} className="btn-secondary flex-1 py-2.5">Atrás</button>
              )}
              <button
                onClick={() => {
                  if (esFinalInfo && role === 'paciente') {
                    setEtapa('clinico')
                  } else if (esFinalInfo) {
                    completarOnboarding(true)
                  } else {
                    setPasoInfo(p => p + 1)
                  }
                }}
                disabled={loading}
                className="btn-primary flex-1 py-2.5"
              >
                {loading ? 'Configurando...' : esFinalInfo ? 'Siguiente →' : 'Siguiente →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── ETAPA CLÍNICA ──────────────────────────────────────────────
  const totalPasos = pasosInfo.length + 1
  const progress = (totalPasos / totalPasos) * 100

  return (
    <div className="min-h-screen bg-surface-base flex items-start justify-center p-4 py-8">
      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2">
            <span className="text-2xl">🧭</span>
            <span className="font-heading font-bold text-text-primary">Mi Brújula de Salud</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-text-muted">Paso {totalPasos} de {totalPasos}</span>
            <span className="text-xs font-semibold text-brand-primary">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-surface-subtle rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${progress}%`, background: 'var(--brand-primary)' }} />
          </div>
        </div>

        <div className="bg-surface-card rounded-2xl border border-border-default p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}>
          <div className="mb-5">
            <h2 className="font-heading font-bold text-text-primary text-lg mb-1">Un poco sobre vos 📋</h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Esta información nos ayuda a personalizar tu experiencia. Todos los campos son opcionales.
            </p>
          </div>

          {/* Datos físicos */}
          <div className="mb-5">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wide mb-3">Datos físicos</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-secondary mb-1 block">Peso (kg)</label>
                <input
                  type="number"
                  min="30" max="300" step="0.1"
                  value={clinico.peso_inicial}
                  onChange={e => setClin(c => ({ ...c, peso_inicial: e.target.value }))}
                  placeholder="Ej: 70"
                  className="w-full px-3 py-2.5 rounded-xl border border-border-default bg-white text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary mb-1 block">Altura (cm)</label>
                <input
                  type="number"
                  min="100" max="250"
                  value={clinico.altura}
                  onChange={e => setClin(c => ({ ...c, altura: e.target.value }))}
                  placeholder="Ej: 168"
                  className="w-full px-3 py-2.5 rounded-xl border border-border-default bg-white text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                />
              </div>
            </div>
          </div>

          {/* Medicación */}
          <div className="mb-5">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wide mb-3">Medicación</p>
            <div className="bg-surface-subtle rounded-xl p-3">
              <p className="text-sm text-text-primary mb-3">¿Tomás medicación actualmente?</p>
              <div className="flex gap-2 mb-3">
                {([true, false] as const).map(v => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => setClin(c => ({ ...c, toma_medicacion: c.toma_medicacion === v ? null : v }))}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                      clinico.toma_medicacion === v
                        ? v ? 'bg-[#2C4A6E] text-white border-[#2C4A6E]' : 'bg-[#F3F4F6] text-[#4B5563] border-[#D1D5DB]'
                        : 'bg-white text-text-muted border-border-default hover:border-brand-primary'
                    }`}
                  >
                    {v ? 'Sí' : 'No'}
                  </button>
                ))}
              </div>
              {/* Campo condicional: solo si dijo Sí */}
              {clinico.toma_medicacion === true && (
                <div className="animate-fade-in-up">
                  <label className="text-xs text-text-secondary mb-1 block">¿Cuál/es? (opcional)</label>
                  <textarea
                    value={clinico.detalle_medicacion}
                    onChange={e => setClin(c => ({ ...c, detalle_medicacion: e.target.value }))}
                    placeholder="Ej: Metformina, Levotiroxina..."
                    rows={2}
                    maxLength={300}
                    className="w-full px-3 py-2 rounded-xl border border-border-default bg-white text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 resize-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Antecedentes */}
          <div className="mb-6">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wide mb-3">Antecedentes relevantes</p>
            <div className="bg-surface-subtle rounded-xl px-3 py-1">
              <ToggleSiNo label="Tabaquismo"         value={clinico.antec_tabaquismo ? true : null}           onChange={v => setClin(c => ({ ...c, antec_tabaquismo: v === true }))} />
              <ToggleSiNo label="Alcohol"             value={clinico.antec_alcohol ? true : null}              onChange={v => setClin(c => ({ ...c, antec_alcohol: v === true }))} />
              <ToggleSiNo label="Otras sustancias"    value={clinico.antec_otras_sustancias ? true : null}     onChange={v => setClin(c => ({ ...c, antec_otras_sustancias: v === true }))} />
              <ToggleSiNo label="Cirugías previas"    value={clinico.antec_cirugia ? true : null}              onChange={v => setClin(c => ({ ...c, antec_cirugia: v === true }))} />
              <ToggleSiNo label="Antecedente de cáncer" value={clinico.antec_cancer ? true : null}            onChange={v => setClin(c => ({ ...c, antec_cancer: v === true }))} />
              <ToggleSiNo label="Tiroides"            value={clinico.antec_tiroides ? true : null}             onChange={v => setClin(c => ({ ...c, antec_tiroides: v === true }))} />
            </div>
            <div className="mt-3">
              <input
                type="text"
                value={clinico.antec_otros}
                onChange={e => setClin(c => ({ ...c, antec_otros: e.target.value }))}
                placeholder="Otro antecedente relevante (opcional)"
                maxLength={200}
                className="w-full px-3 py-2.5 rounded-xl border border-border-default bg-white text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setEtapa('info')}
              className="btn-secondary py-2.5 px-4"
            >
              ←
            </button>
            <button
              onClick={() => completarOnboarding(false)}
              disabled={loading}
              className="btn-primary flex-1 py-2.5"
            >
              {loading ? 'Configurando...' : '¡Empezar! 🚀'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => completarOnboarding(true)}
            disabled={loading}
            className="w-full mt-2 text-xs text-text-muted hover:text-text-secondary py-1.5 transition-colors"
          >
            Saltar por ahora
          </button>
        </div>
      </div>
    </div>
  )
}
