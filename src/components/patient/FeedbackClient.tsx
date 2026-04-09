'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId: string
}

export default function FeedbackClient({ userId }: Props) {
  const [rating, setRating] = useState<number | null>(null)
  const [queFunciona, setQueFunciona] = useState('')
  const [queMejorar, setQueMejorar] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function enviar() {
    if (!rating) return
    setEnviando(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase
      .from('feedback_respuestas')
      .insert({
        usuario_id: userId,
        tipo: 'app',
        rating,
        que_funciona: queFunciona || null,
        que_mejorar: queMejorar || null,
      })
    if (err) {
      setError(err.message)
    } else {
      setEnviado(true)
    }
    setEnviando(false)
  }

  if (enviado) {
    return (
      <div className="px-5 pt-16 text-center">
        <p className="text-5xl mb-4">🙏</p>
        <h2 className="font-serif text-[24px] text-[#1A1A2E] mb-2">¡Gracias!</h2>
        <p className="text-sm text-[#6B7280]">Tu feedback nos ayuda a mejorar la app.</p>
      </div>
    )
  }

  return (
    <div className="pb-8">
      <div className="px-5 pt-6 pb-4">
        <h1 className="font-serif text-[28px] text-[#1A1A2E] leading-tight">Tu opinión</h1>
        <p className="text-sm text-[#6B7280] mt-1">Ayudanos a mejorar la experiencia</p>
      </div>

      <div className="px-5 space-y-6">
        {/* Rating NPS */}
        <div>
          <p className="text-sm font-semibold text-[#1F2937] mb-3">
            ¿Cómo calificarías la app? <span className="text-[#9CA3AF] font-normal">(1–10)</span>
          </p>
          <div className="grid grid-cols-5 gap-2">
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <button
                key={n}
                onClick={() => setRating(n)}
                className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                  rating === n
                    ? 'bg-[#1B3A5C] text-white border-[#1B3A5C]'
                    : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:border-[#9CA3AF]'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Qué funciona */}
        <div>
          <label className="block text-sm font-semibold text-[#1F2937] mb-2">
            ¿Qué te está funcionando bien? <span className="text-[#9CA3AF] font-normal">(opcional)</span>
          </label>
          <textarea
            value={queFunciona}
            onChange={e => setQueFunciona(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Lo que más valoro es..."
            className="w-full px-4 py-3 rounded-2xl border border-[#E5E7EB] bg-white text-sm text-[#1F2937] placeholder-[#9CA3AF] resize-none focus:outline-none focus:ring-2 focus:ring-[#2A7B6F]/30 focus:border-[#2A7B6F] transition"
          />
        </div>

        {/* Qué mejorar */}
        <div>
          <label className="block text-sm font-semibold text-[#1F2937] mb-2">
            ¿Qué mejorarías? <span className="text-[#9CA3AF] font-normal">(opcional)</span>
          </label>
          <textarea
            value={queMejorar}
            onChange={e => setQueMejorar(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Me gustaría que..."
            className="w-full px-4 py-3 rounded-2xl border border-[#E5E7EB] bg-white text-sm text-[#1F2937] placeholder-[#9CA3AF] resize-none focus:outline-none focus:ring-2 focus:ring-[#2A7B6F]/30 focus:border-[#2A7B6F] transition"
          />
        </div>

        {error && (
          <div className="bg-[#FADDDD] border border-[#F5AEAE] rounded-xl p-3 text-sm text-[#8B1A1A]">
            {error}
          </div>
        )}

        <button
          onClick={enviar}
          disabled={!rating || enviando}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#2A7B6F] to-[#1B3A5C] text-white font-semibold shadow-md hover:opacity-90 disabled:opacity-50 transition"
        >
          {enviando ? 'Enviando...' : 'Enviar feedback'}
        </button>
      </div>
    </div>
  )
}
