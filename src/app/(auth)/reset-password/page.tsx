'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { LoginSchema } from '@/lib/validations'

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 inline mr-2" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validar email con Zod (reutiliza el campo email del LoginSchema)
    const parsed = LoginSchema.pick({ email: true }).safeParse({ email })
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      setLoading(false)
      return
    }

    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/callback?next=/update-password`

    const { error: err } = await supabase.auth.resetPasswordForEmail(
      parsed.data.email,
      { redirectTo }
    )

    if (err) {
      // No exponer si el email existe o no (previene user enumeration)
      if (process.env.NODE_ENV === 'development') console.error('[reset-password]', err)
    }

    // Siempre mostrar el mensaje de éxito (evita confirmar si el email existe)
    setEnviado(true)
    setLoading(false)
  }

  if (enviado) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-surface-base">
        <div className="w-full max-w-md text-center space-y-6 animate-fade-in-up">
          <div
            className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
            style={{ background: '#ECFDF5' }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M8 16l5 5 11-10" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h1 className="font-heading text-h3 font-bold text-text-primary">Revisá tu email</h1>
            <p className="text-text-secondary mt-2 leading-relaxed">
              Si existe una cuenta con ese email, recibirás un link para restablecer tu contraseña en los próximos minutos.
            </p>
            <p className="text-sm text-text-muted mt-2">
              Revisá también la carpeta de spam.
            </p>
          </div>
          <Link href="/login" className="btn-primary inline-block px-8 py-3">
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface-base">
      <div className="w-full max-w-md animate-fade-in-up">

        <div className="mb-8">
          <Link href="/login" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-secondary mb-6 transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Volver al login
          </Link>
          <h1 className="font-heading text-h3 font-bold text-text-primary">Restablecer contraseña</h1>
          <p className="text-text-secondary mt-1">
            Ingresá tu email y te enviaremos un link para crear una nueva contraseña.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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
              autoFocus
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
            {loading ? <><Spinner />Enviando...</> : 'Enviar link de recuperación'}
          </button>
        </form>
      </div>
    </div>
  )
}
