'use client'

// DESIGN: Login page — estilo SaaS médico profesional
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 inline mr-2" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// DESIGN: Ilustración SVG de brújula
function CompassLogo() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="19" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1.5"/>
      <circle cx="20" cy="20" r="12" fill="none" stroke="#2563EB" strokeWidth="1.5" strokeOpacity="0.3"/>
      <circle cx="20" cy="20" r="2.5" fill="#2563EB"/>
      <path d="M20 10L22 18L20 20L18 18Z" fill="#2563EB"/>
      <path d="M20 30L18 22L20 20L22 22Z" fill="#CBD5E1"/>
      <path d="M10 20L18 18L20 20L18 22Z" fill="#CBD5E1"/>
      <path d="M30 20L22 22L20 20L22 18Z" fill="#2563EB" fillOpacity="0.5"/>
    </svg>
  )
}

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email o contraseña incorrectos.')
      setLoading(false)
      return
    }

    const role = data.user?.user_metadata?.role
    window.location.href = role === 'facilitador' ? '/dashboard' : '/inicio'
  }

  return (
    // DESIGN: Layout split — izquierda branding, derecha formulario
    <div className="min-h-screen flex">

      {/* Panel izquierdo — solo desktop */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)' }}
      >
        {/* Patrón de fondo decorativo */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, #BFDBFE 0%, transparent 50%), radial-gradient(circle at 80% 20%, #A7F3D0 0%, transparent 50%)',
        }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <CompassLogo />
            <span className="font-heading font-bold text-xl text-text-primary">Mi Brújula de Salud</span>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-primary mb-4">
              Plataforma de coaching de salud
            </p>
            <h2 className="font-heading text-h1 font-bold text-text-primary mb-6 leading-tight">
              Tu brújula hacia<br />el bienestar
            </h2>
            <p className="text-text-secondary text-lg leading-relaxed max-w-sm">
              Registrá tu bienestar diario, seguí tus hábitos y mantené a tu equipo médico informado.
            </p>
          </div>
        </div>

        {/* Stats decorativos */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { value: '98%', label: 'Adherencia' },
            { value: '3min', label: 'Por día' },
            { value: '24/7', label: 'Seguimiento' },
          ].map(s => (
            <div key={s.label} className="bg-white/70 backdrop-blur-sm rounded-xl p-4 text-center border border-white/80">
              <div className="font-metric font-bold text-2xl text-brand-primary">{s.value}</div>
              <div className="text-xs text-text-secondary mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center p-6 bg-surface-base">
        <div className="w-full max-w-md animate-fade-in-up">

          {/* Header mobile */}
          <div className="flex items-center gap-3 justify-center mb-10 lg:hidden">
            <CompassLogo />
            <span className="font-heading font-bold text-xl text-text-primary">Mi Brújula de Salud</span>
          </div>

          <div className="mb-8">
            <h1 className="font-heading text-h3 font-bold text-text-primary">Bienvenido de vuelta</h1>
            <p className="text-text-secondary mt-1">Ingresá a tu cuenta para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="input-field"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-text-primary">Contraseña</label>
                <Link href="/recuperar" className="text-xs text-brand-primary hover:underline font-medium">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input-field pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPwd ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="rounded-xl p-3 text-sm font-medium flex items-center gap-2"
                style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }}
              >
                <span>⚠️</span> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-center">
              {loading ? <><Spinner />Ingresando...</> : 'Ingresar'}
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-6">
            ¿No tenés cuenta?{' '}
            <Link href="/register" className="text-brand-primary font-semibold hover:underline">
              Registrate gratis
            </Link>
          </p>

          <p className="text-center text-xs text-text-muted mt-8">
            Al ingresar aceptás los términos de uso y la política de privacidad.
          </p>
        </div>
      </div>
    </div>
  )
}
