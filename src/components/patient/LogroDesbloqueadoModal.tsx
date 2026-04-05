'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { LogroConfig } from '@/lib/logros'

interface Props {
  logro: LogroConfig
  onClose: () => void
}

// Confetti SVG simple animado vía CSS
function ConfettiPiece({ x, delay, color }: { x: number; delay: number; color: string }) {
  return (
    <div
      className="absolute top-0 w-2 h-2 rounded-sm animate-confetti"
      style={{
        left: `${x}%`,
        animationDelay: `${delay}s`,
        backgroundColor: color,
      }}
    />
  )
}

const CONFETTI_COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6', '#EC4899']

export default function LogroDesbloqueadoModal({ logro, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoError, setVideoError] = useState(false)
  const [botonVisible, setBotonVisible] = useState(false)
  const [marcandoVisto, setMarcandoVisto] = useState(false)

  // El botón "¡Genial!" aparece después de 3 segundos
  useEffect(() => {
    const timer = setTimeout(() => setBotonVisible(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  // Intentar reproducir el video al montar
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay bloqueado → no es un error fatal, el fallback al ícono está activo
        setVideoError(true)
      })
    }
  }, [videoError])

  async function handleClose() {
    if (marcandoVisto) return
    setMarcandoVisto(true)

    // Marcar video_visto = true en Supabase (fire-and-forget, no bloquea el cierre)
    const supabase = createClient()
    supabase
      .from('logros_paciente')
      .update({ video_visto: true })
      .eq('logro_key', logro.key)
      .then(({ error }) => {
        if (error) console.error('[LogroModal] error marcando video_visto:', error.message)
      })

    onClose()
  }

  // Piezas de confetti generadas estáticamente para evitar hidratación mismatch
  const confettiPieces = [
    { x: 10, delay: 0,   color: CONFETTI_COLORS[0] },
    { x: 20, delay: 0.2, color: CONFETTI_COLORS[1] },
    { x: 30, delay: 0.1, color: CONFETTI_COLORS[2] },
    { x: 40, delay: 0.3, color: CONFETTI_COLORS[3] },
    { x: 50, delay: 0,   color: CONFETTI_COLORS[4] },
    { x: 60, delay: 0.2, color: CONFETTI_COLORS[5] },
    { x: 70, delay: 0.1, color: CONFETTI_COLORS[0] },
    { x: 80, delay: 0.3, color: CONFETTI_COLORS[1] },
    { x: 90, delay: 0,   color: CONFETTI_COLORS[2] },
    { x: 15, delay: 0.4, color: CONFETTI_COLORS[3] },
    { x: 35, delay: 0.5, color: CONFETTI_COLORS[4] },
    { x: 55, delay: 0.4, color: CONFETTI_COLORS[5] },
    { x: 75, delay: 0.5, color: CONFETTI_COLORS[0] },
    { x: 95, delay: 0.3, color: CONFETTI_COLORS[1] },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      aria-modal="true"
      role="dialog"
      aria-label={`Logro desbloqueado: ${logro.nombre}`}
    >
      {/* Card animada con scale + fade in */}
      <div className="relative w-[90vw] max-w-sm mx-auto animate-logro-in">

        {/* Confetti sobre la card */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
          {confettiPieces.map((p, i) => (
            <ConfettiPiece key={i} x={p.x} delay={p.delay} color={p.color} />
          ))}
        </div>

        {/* Card principal */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-[#1A1A2E]">

          {/* Video o fallback con ícono */}
          <div className="relative aspect-video bg-[#0F0F1A]">
            {!videoError ? (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                playsInline
                autoPlay
                onError={() => setVideoError(true)}
              >
                {/* Intenta video específico del logro, con fallback al genérico */}
                <source src={`/videos/logros/${logro.key}.mp4`} type="video/mp4" />
                <source src="/videos/logros/default.mp4" type="video/mp4" />
              </video>
            ) : (
              // Fallback: ícono animado cuando el video falla o no existe
              <div className="w-full h-full flex items-center justify-center">
                <span
                  className="text-8xl animate-logro-icon"
                  style={{ filter: 'drop-shadow(0 0 24px rgba(250,204,21,0.6))' }}
                >
                  {logro.emoji}
                </span>
              </div>
            )}

            {/* Overlay inferior con gradiente — información encima del video */}
            <div
              className="absolute bottom-0 left-0 right-0 p-4"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)' }}
            >
              <p className="text-[10px] font-bold tracking-widest uppercase text-amber-400 mb-1">
                ¡Desbloqueaste un logro!
              </p>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{logro.emoji}</span>
                <h2 className="text-white font-bold text-lg leading-tight">
                  {logro.nombre}
                </h2>
              </div>
            </div>
          </div>

          {/* Cuerpo de la card */}
          <div className="p-5 space-y-4">
            <p className="text-[#CBD5E1] text-sm text-center leading-relaxed">
              {logro.descripcion}
            </p>

            {/* Botón que aparece después de 3s */}
            <div
              className="transition-all duration-500"
              style={{ opacity: botonVisible ? 1 : 0, transform: botonVisible ? 'translateY(0)' : 'translateY(8px)' }}
            >
              <button
                onClick={handleClose}
                disabled={!botonVisible || marcandoVisto}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-white font-bold text-base shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:cursor-not-allowed"
              >
                ¡Genial! 🎉
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
