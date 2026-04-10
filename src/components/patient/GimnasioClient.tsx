'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ContenidoGimnasio, ProgresoGimnasio, CategoriaContenido, TipoContenido } from '@/types/database'

interface Props {
  userId: string
  contenidos: ContenidoGimnasio[]
  progreso: ProgresoGimnasio[]
}

const CATEGORIA_CONFIG: Record<CategoriaContenido, { label: string; emoji: string; bgVar: string; textVar: string }> = {
  conductas_ancla:   { label: 'Conductas Ancla',    emoji: '🎯', bgVar: 'var(--semaforo-verde-bg)',    textVar: 'var(--semaforo-verde-text)'    },
  saboteador_sabio:  { label: 'Saboteador y Sabio', emoji: '🧠', bgVar: 'var(--brand-primary-soft)',   textVar: 'var(--status-info-text)'       },
  gimnasia_mental:   { label: 'Gimnasia Mental',    emoji: '💪', bgVar: 'var(--status-warning-soft)',  textVar: 'var(--status-warning-text)'    },
  habitos:           { label: 'Hábitos',            emoji: '🌱', bgVar: 'var(--status-success-soft)',  textVar: 'var(--status-success-text)'    },
  general:           { label: 'General',            emoji: '📚', bgVar: 'var(--surface-subtle)',       textVar: 'var(--text-secondary)'         },
}

const TIPO_ICON: Record<TipoContenido, string> = {
  video:   '▶️',
  audio:   '🎧',
  lectura: '📄',
}

export default function GimnasioClient({ userId, contenidos, progreso }: Props) {
  const completadosSet = new Set(progreso.map(p => p.contenido_id))
  const [completados, setCompletados] = useState<Set<string>>(completadosSet)
  const [cargando, setCargando] = useState<string | null>(null)

  const totalCount = contenidos.length
  const completadosCount = contenidos.filter(c => completados.has(c.id)).length

  async function marcarCompletado(contenidoId: string) {
    if (completados.has(contenidoId) || cargando) return
    setCargando(contenidoId)
    const supabase = createClient()
    const { error } = await supabase
      .from('progreso_gimnasio')
      .upsert({ usuario_id: userId, contenido_id: contenidoId, minutos_vistos: 0 })
    if (!error) {
      setCompletados(prev => new Set(Array.from(prev).concat(contenidoId)))
    }
    setCargando(null)
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="font-serif text-[28px] text-text-primary leading-tight">Gimnasio Mental</h1>
        <p className="text-sm text-text-secondary mt-1">Entrenamiento para el bienestar cognitivo</p>
      </div>

      {/* Progreso general */}
      {totalCount > 0 && (
        <div className="mx-5 mb-6 rounded-2xl p-4" style={{ background: 'var(--semaforo-verde-bg)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold" style={{ color: 'var(--semaforo-verde-text)' }}>Tu progreso</span>
            <span className="text-sm font-bold" style={{ color: 'var(--semaforo-verde-text)' }}>
              {completadosCount}/{totalCount}
            </span>
          </div>
          <div className="h-2 bg-surface-card/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2A7B6F] rounded-full transition-all duration-500"
              style={{ width: `${totalCount > 0 ? (completadosCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Contenidos */}
      {contenidos.length === 0 ? (
        <div className="mx-5 bg-surface-subtle rounded-2xl p-8 text-center">
          <p className="text-3xl mb-3">🏋️</p>
          <p className="text-sm text-text-secondary">
            Pronto habrá contenidos disponibles.
          </p>
        </div>
      ) : (
        <div className="px-5 space-y-4">
          {contenidos.map(c => {
            const cat = CATEGORIA_CONFIG[c.categoria]
            const completado = completados.has(c.id)
            return (
              <div
                key={c.id}
                className={`bg-surface-card rounded-2xl border shadow-sm overflow-hidden transition-all ${
                  completado ? 'border-[#A8D5B5] dark:border-[#065F46]' : ''
                }`}
              >
                <div className="p-4">
                  {/* Categoría badge */}
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold mb-2"
                    style={{ background: cat.bgVar, color: cat.textVar }}
                  >
                    {cat.emoji} {cat.label}
                  </span>

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-text-primary leading-snug">{c.titulo}</h3>
                      {c.descripcion && (
                        <p className="text-xs text-text-secondary mt-1 leading-relaxed line-clamp-2">
                          {c.descripcion}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm">{TIPO_ICON[c.tipo]}</span>
                        <span className="text-xs text-text-muted">{c.duracion_min} min</span>
                      </div>
                    </div>

                    {completado ? (
                      <span
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm"
                        style={{ background: 'var(--semaforo-verde-bg)', color: 'var(--semaforo-verde-text)' }}
                      >
                        ✓
                      </span>
                    ) : (
                      <button
                        onClick={() => marcarCompletado(c.id)}
                        disabled={cargando === c.id}
                        className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-[#1B3A5C] dark:bg-[#3B82F6] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition"
                      >
                        {cargando === c.id ? '...' : 'Hecho'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
