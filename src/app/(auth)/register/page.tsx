'use client'

// DESIGN: Register page — selección de rol visual
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { RegisterSchema } from '@/lib/validations'
import type { Role } from '@/types/database'

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 inline mr-2" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// DESIGN: Cards de rol con ilustración SVG
const ROLE_CONFIG = {
  paciente: {
    emoji: '🏃',
    label: 'Soy paciente',
    desc: 'Quiero registrar mi bienestar y seguir mis hábitos diarios.',
    features: ['Check-in diario en 2 min', 'Semáforo de salud personal', 'Historial de progreso'],
  },
  facilitador: {
    emoji: '🩺',
    label: 'Soy facilitador',
    desc: 'Quiero hacer seguimiento clínico de mis pacientes.',
    features: ['Panel de seguimiento', 'Alertas automáticas', 'Grupos de pacientes'],
  },
} as const

function validateField(field: 'nombre' | 'email' | 'password', value: string, role: Role): string {
  const result = RegisterSchema.safeParse({
    nombre:   field === 'nombre'   ? value : 'Placeholder',
    email:    field === 'email'    ? value : 'placeholder@x.com',
    password: field === 'password' ? value : 'placeholder',
    role,
  })
  if (result.success) return ''
  const issue = result.error.issues.find(i => i.path[0] === field)
  return issue?.message ?? ''
}

export default function RegisterPage() {
  const router = useRouter()
  const [nombre,   setNombre]   = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [role,     setRole]     = useState<Role>('paciente')
  const [error,    setError]    = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading,  setLoading]  = useState(false)

  function handleBlur(field: 'nombre' | 'email' | 'password', value: string) {
    setFieldErrors(prev => ({ ...prev, [field]: validateField(field, value, role) }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    // Validación completa con Zod (mismas reglas que el servidor)
    const result = RegisterSchema.safeParse({ nombre, email, password, role })
    if (!result.success) {
      const errs: Record<string, string> = {}
      result.error.issues.forEach(i => { if (i.path[0]) errs[String(i.path[0])] = i.message })
      setFieldErrors(errs)
      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre, role } },
    })

    if (error) {
      setError('No se pudo crear la cuenta. Verificá los datos e intentá de nuevo.')
      setLoading(false)
      return
    }

    router.push('/onboarding')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg animate-fade-in-up">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <span className="text-3xl">🧭</span>
            <span className="font-heading font-bold text-xl text-text-primary">Mi Brújula de Salud</span>
          </div>
          <h1 className="font-heading text-h3 font-bold text-text-primary">Crear tu cuenta</h1>
          <p className="text-text-secondary mt-1 text-sm">Empezá en menos de 2 minutos</p>
        </div>

        <div className="bg-surface-card rounded-2xl border border-border-default p-6 md:p-8" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}>

          {/* DESIGN: Selector de rol en cards */}
          <p className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
            Soy...
          </p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {(Object.entries(ROLE_CONFIG) as [keyof typeof ROLE_CONFIG, typeof ROLE_CONFIG[keyof typeof ROLE_CONFIG]][]).map(([r, cfg]) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className="p-4 rounded-xl border-2 text-left transition-all"
                style={role === r
                  ? { borderColor: 'var(--brand-primary)', background: 'var(--brand-primary-soft)' }
                  : { borderColor: 'var(--border-default)', background: 'var(--surface-card)' }
                }
              >
                <div className="text-2xl mb-2">{cfg.emoji}</div>
                <div className="font-semibold text-sm text-text-primary">{cfg.label}</div>
                <div className="text-xs text-text-muted mt-1 leading-snug">{cfg.desc}</div>
                <ul className="mt-2.5 space-y-1">
                  {cfg.features.map(f => (
                    <li key={f} className="text-[10px] flex items-center gap-1.5" style={{ color: role === r ? 'var(--brand-primary)' : 'var(--text-muted)' }}>
                      <span>{role === r ? '✓' : '○'}</span> {f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          <form onSubmit={handleRegister} className="space-y-4" noValidate>
            {/* Nombre */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">
                Nombre completo
              </label>
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                onBlur={e => handleBlur('nombre', e.target.value.trim())}
                placeholder="Juan García"
                className="input-field"
                style={fieldErrors.nombre ? { borderColor: '#EF4444' } : {}}
              />
              {fieldErrors.nombre && (
                <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{fieldErrors.nombre}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={e => handleBlur('email', e.target.value)}
                placeholder="tu@email.com"
                className="input-field"
                style={fieldErrors.email ? { borderColor: '#EF4444' } : {}}
              />
              {fieldErrors.email && (
                <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{fieldErrors.email}</p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onBlur={e => handleBlur('password', e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
                  className="input-field pr-11"
                  style={fieldErrors.password ? { borderColor: '#EF4444' } : {}}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  aria-label={showPwd ? 'Ocultar' : 'Mostrar'}
                >
                  {showPwd ? '🙈' : '👁'}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{fieldErrors.password}</p>
              )}
            </div>

            {error && (
              <div className="rounded-xl p-3 text-sm flex items-center gap-2"
                style={{ background: 'var(--status-danger-soft)', color: 'var(--status-danger-text)', border: '1px solid var(--status-danger)' }}>
                <span>⚠️</span> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? <><Spinner />Creando cuenta...</> : 'Crear cuenta gratis'}
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-5">
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" className="text-brand-primary font-semibold hover:underline">
              Iniciá sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
