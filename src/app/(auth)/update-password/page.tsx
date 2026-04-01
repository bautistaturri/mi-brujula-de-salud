'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UpdatePasswordSchema } from '@/lib/validations'

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 inline mr-2" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const parsed = UpdatePasswordSchema.safeParse({ password, confirmPassword })
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({
      password: parsed.data.password,
    })

    if (err) {
      // Sesión expirada es el error más común — link de recovery válido por 1h
      if (err.message?.toLowerCase().includes('session')) {
        setError('El link expiró. Pedí un nuevo link desde la pantalla de login.')
      } else {
        setError('No se pudo actualizar la contraseña. Intentá de nuevo.')
      }
      setLoading(false)
      return
    }

    // Éxito: redirigir al login con mensaje de confirmación
    router.push('/login?msg=password_actualizado')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface-base">
      <div className="w-full max-w-md animate-fade-in-up">

        <div className="mb-8">
          <div
            className="w-12 h-12 rounded-xl mb-6 flex items-center justify-center"
            style={{ background: '#EFF6FF' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="#2563EB" strokeWidth="1.5"/>
              <path d="M7 11V7a5 5 0 0110 0v4" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="font-heading text-h3 font-bold text-text-primary">Nueva contraseña</h1>
          <p className="text-text-secondary mt-1">
            Elegí una contraseña segura de al menos 8 caracteres.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                autoFocus
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

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">
              Confirmar contraseña
            </label>
            <input
              type={showPwd ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repetí la contraseña"
              required
              className="input-field"
            />
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
            {loading ? <><Spinner />Guardando...</> : 'Guardar nueva contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
