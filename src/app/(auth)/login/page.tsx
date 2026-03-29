'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-white inline mr-2" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email o contraseña incorrectos. Verificá tus datos e intentá de nuevo.')
      setLoading(false)
      return
    }

    const role = data.user?.user_metadata?.role
    window.location.href = role === 'facilitador' ? '/dashboard' : '/inicio'
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
          <h2 className="text-lg font-semibold text-[#1C1917] mb-6">Iniciar sesión</h2>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#1C1917] mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-[#E2DDD6] bg-white focus:outline-none focus:ring-2 focus:ring-[#2C4A6E] focus:border-transparent text-[#1C1917] placeholder:text-[#78716C] text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-[#1C1917]">
                  Contraseña
                </label>
                <Link
                  href="/recuperar"
                  className="text-xs text-[#78716C] hover:text-[#2C4A6E] transition-colors"
                >
                  ¿Olvidaste la contraseña?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-[#E2DDD6] bg-white focus:outline-none focus:ring-2 focus:ring-[#2C4A6E] focus:border-transparent text-[#1C1917] placeholder:text-[#78716C] text-sm"
              />
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
                <><Spinner />Entrando...</>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-[#78716C] mt-6">
            ¿No tenés cuenta?{' '}
            <Link href="/register" className="text-[#2C4A6E] font-medium hover:underline">
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
