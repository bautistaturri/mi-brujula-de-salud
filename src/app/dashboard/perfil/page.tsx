'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { WhatsappSchema } from '@/lib/validations'

export default function PerfilFacilitadorPage() {
  const [whatsapp, setWhatsapp] = useState('')
  const [nombre, setNombre] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('users')
        .select('nombre, whatsapp')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setNombre(data.nombre ?? '')
            setWhatsapp(data.whatsapp ?? '')
          }
        })
    })
  }, [])

  async function guardar() {
    setGuardando(true)
    setMensaje(null)

    // Validar formato de WhatsApp antes de guardar
    const parsed = WhatsappSchema.safeParse({ whatsapp: whatsapp.trim() })
    if (!parsed.success) {
      setMensaje({ tipo: 'error', texto: parsed.error.issues[0].message })
      setGuardando(false)
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('users')
      .update({ whatsapp: parsed.data.whatsapp || null })
      .eq('id', user.id)

    if (error) {
      setMensaje({ tipo: 'error', texto: 'No se pudo guardar. Intentá de nuevo.' })
    } else {
      setMensaje({ tipo: 'ok', texto: '¡Número guardado! Tus pacientes podrán enviarte su resumen por WhatsApp.' })
    }
    setGuardando(false)
  }

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Mi perfil</h1>
        <p className="text-slate-500 mt-1">Configurá tu número de WhatsApp para recibir resúmenes de tus pacientes.</p>
      </div>

      {/* Info del usuario */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
            {nombre.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-800">{nombre}</p>
            <p className="text-sm text-slate-400">Facilitadora / Coach</p>
          </div>
        </div>
      </div>

      {/* WhatsApp */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📲</span>
          <div>
            <h2 className="font-semibold text-slate-700">Número de WhatsApp</h2>
            <p className="text-xs text-slate-400">
              Incluí el código de país. Ej: 5491112345678 (Argentina)
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-400 transition-colors">
            <span className="px-3 text-slate-400 text-sm bg-slate-50 self-stretch flex items-center border-r border-slate-200">
              wa.me/
            </span>
            <input
              type="tel"
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value.replace(/[^\d+]/g, ''))}
              placeholder="5491112345678"
              className="flex-1 px-4 py-3 text-slate-700 placeholder-slate-300 focus:outline-none text-base"
            />
          </div>

          {whatsapp && (
            <p className="text-xs text-slate-400">
              Enlace: wa.me/{whatsapp}
            </p>
          )}
        </div>

        <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 leading-relaxed">
          <strong>¿Cómo funciona?</strong> Cuando tus pacientes terminan su check-in, ven un botón
          para enviarte el resumen por WhatsApp con su estado, IEM y emociones del día.
        </div>

        {mensaje && (
          <div className={`rounded-xl p-3 text-sm ${
            mensaje.tipo === 'ok'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {mensaje.tipo === 'ok' ? '✓ ' : '✗ '}{mensaje.texto}
          </div>
        )}

        <button
          onClick={guardar}
          disabled={guardando}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors"
        >
          {guardando ? 'Guardando...' : 'Guardar número'}
        </button>
      </div>
    </div>
  )
}
