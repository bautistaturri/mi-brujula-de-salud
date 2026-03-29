'use client'

import { useEffect, useState } from 'react'
import { LOGROS_CONFIG } from '@/lib/logros'

interface Props {
  logros: string[]
  onClose: () => void
}

export default function LogroNotification({ logros, onClose }: Props) {
  const [visible, setVisible] = useState(false)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (logros.length === 0) return
    setVisible(true)
  }, [logros])

  if (!visible || logros.length === 0) return null

  const config = LOGROS_CONFIG[logros[index]]
  if (!config) return null

  function next() {
    if (index < logros.length - 1) {
      setIndex(i => i + 1)
    } else {
      setVisible(false)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1917]/70 backdrop-blur-sm">
      <div
        className="bg-white rounded-3xl p-8 max-w-xs w-full text-center shadow-2xl border-2 border-[#E8D4A8]"
        style={{ animation: 'scale-in 0.3s ease-out' }}
      >
        <div className="text-7xl mb-4" style={{ animation: 'bounce 0.6s ease-in-out infinite alternate' }}>
          {config.emoji}
        </div>
        <div className="text-xs font-bold uppercase tracking-widest text-[#92671A] mb-2">
          ¡Nuevo logro desbloqueado!
        </div>
        <h3 className="text-xl font-bold text-[#1C1917] mb-2">{config.nombre}</h3>
        <p className="text-sm text-[#78716C] mb-6">{config.descripcion}</p>

        {logros.length > 1 && (
          <p className="text-xs text-[#78716C] mb-4">{index + 1} de {logros.length}</p>
        )}

        <button
          onClick={next}
          className="w-full bg-[#2C4A6E] hover:bg-[#1E3550] text-white font-bold py-3 rounded-xl transition-colors text-sm"
        >
          {index < logros.length - 1 ? 'Siguiente →' : '¡Genial! 🎉'}
        </button>
      </div>

      <style>{`
        @keyframes scale-in {
          from { transform: scale(0.7); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        @keyframes bounce {
          from { transform: translateY(0); }
          to   { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  )
}
