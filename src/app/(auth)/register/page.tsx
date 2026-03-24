'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Role } from '@/types/database'

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-white inline mr-2" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}

const ROLE_CONFIG = {
  paciente: { emoji: '🏃', label: 'Paciente', desc: 'Registrá tu bienestar diario' },
  facilitador: { emoji: '🩺', label: 'Facilitador', desc: 'Monitoreá a tus pacientes' },
} as const

export default function RegisterPage() {
  const router = useRouter()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<Role>('paciente')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  function validateField(field: string, value: string) {
    if (field === 'nombre' && value.trim().length < 2) {
      return 'Ingresá tu nombre completo'
    }
    if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Email inválido'
    }
    if (field === 'password' && value.length < 8) {
      return 'Mínimo 8 caracteres'
    }
    return ''
  }

  function handleBlur(field: string, value: string) {
    const msg = validateField(field, value)
    setFieldErrors(prev => ({ ...prev, [field]: msg }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()

    // Validate all fields before submit
    const errors = {
      nombre: validateField('nombre', nombre),
      email: validateField('email', email),
      password: validateField('password', password),
    }
    setFieldErrors(errors)
    if (Object.values(errors).some(Boolean)) return

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre, role },
      },
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
    <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-4xl mb-3">🧭</div>
          <h1 className="text-xl font-bold text-[#1C1917] tracking-tight">Mi Brújula de Salud</h1>
          <p className="text-sm text-[#78716C] mt-1">Plataforma de seguimiento clínico</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#E2DDD6] p-8">
          <h2 className="text-lg font-semibold text-[#1C1917] mb-6">Crear cuenta</h2>

          {/* Selector de rol */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {(Object.entries(ROLE_CONFIG) as [Role, typeof ROLE_CONFIG[Role]][]).map(([r, cfg]) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`p-3.5 rounded-xl border-2 text-center transition-all ${
                  role === r
                    ? 'border-[#2C4A6E] bg-[#EEF4F0]'
                    : 'border-[#E2DDD6] hover:border-[#C8DDD0]'
                }`}
              >
                <div className="text-2xl mb-1">{cfg.emoji}</div>
                <div className="text-sm font-semibold text-[#1C1917]">{cfg.label}</div>
                <div className="text-xs text-[#78716C] mt-0.5">{cfg.desc}</div>
              </button>
            ))}
          </div>

          <form onSubmit={handleRegister} className="space-y-4" noValidate>
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-[#1C1917] mb-1.5">
                Nombre completo
              </label>
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                onBlur={e => handleBlur('nombre', e.target.value)}
                placeholder="Juan García"
                required
                className={`w-full px-4 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-[#2C4A6E] focus:border-transparent text-[#1C1917] placeholder:text-[#78716C] text-sm transition-colors ${
                  fieldErrors.nombre ? 'border-semaforo-rojo-border' : 'border-[#E2DDD6]'
                }`}
              />
              {fieldErrors.nombre && (
                <p className="text-xs text-semaforo-rojo mt-1">{fieldErrors.nombre}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#1C1917] mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={e => handleBlur('email', e.target.value)}
                placeholder="tu@email.com"
                required
                className={`w-full px-4 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-[#2C4A6E] focus:border-transparent text-[#1C1917] placeholder:text-[#78716C] text-sm transition-colors ${
                  fieldErrors.email ? 'border-semaforo-rojo-border' : 'border-[#E2DDD6]'
                }`}
              />
              {fieldErrors.email && (
                <p className="text-xs text-semaforo-rojo mt-1">{fieldErrors.email}</p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-[#1C1917] mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onBlur={e => handleBlur('password', e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
                  required
                  className={`w-full px-4 py-2.5 pr-10 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-[#2C4A6E] focus:border-transparent text-[#1C1917] placeholder:text-[#78716C] text-sm transition-colors ${
                    fieldErrors.password ? 'border-semaforo-rojo-border' : 'border-[#E2DDD6]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C1917] transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-semaforo-rojo mt-1">{fieldErrors.password}</p>
              )}
            </div>

            {error && (
              <div className="bg-semaforo-rojo-bg border border-semaforo-rojo-border rounded-xl p-3 text-sm text-semaforo-rojo">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2C4A6E] hover:bg-[#1E3550] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors text-sm mt-1"
            >
              {loading ? (
                <><Spinner />Creando cuenta...</>
              ) : (
                'Crear cuenta'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-[#78716C] mt-6">
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" className="text-[#2C4A6E] font-medium hover:underline">
              Iniciá sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
