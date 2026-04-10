'use client'

import { useState } from 'react'
import { LOGROS_CONFIG } from '@/lib/logros'
import type { LogroPaciente } from '@/types/database'
import type { LogroConfig } from '@/lib/logros'
import LogroDesbloqueadoModal from '@/components/patient/LogroDesbloqueadoModal'
import { formatFecha } from '@/lib/utils'

interface Props {
  logros: LogroPaciente[]
}

export default function LogrosPageClient({ logros }: Props) {
  const [logroEnModal, setLogroEnModal] = useState<LogroConfig | null>(null)

  const mapaLogros = new Map(logros.map(l => [l.logro_key, l]))
  const total        = Object.keys(LOGROS_CONFIG).length
  const desbloqueados = logros.length

  const logrosDesbloqueados = logros
    .map(l => ({ logro: l, config: LOGROS_CONFIG[l.logro_key] }))
    .filter(({ config }) => !!config)

  const logrosBlockeados = Object.values(LOGROS_CONFIG).filter(
    cfg => !mapaLogros.has(cfg.key)
  )

  return (
    <>
      {logroEnModal && (
        <LogroDesbloqueadoModal
          logro={logroEnModal}
          onClose={() => setLogroEnModal(null)}
        />
      )}

      <div>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Mis logros</h2>
            <p className="text-sm text-text-secondary mt-0.5">
              {desbloqueados} de {total} desbloqueados
            </p>
          </div>
          {desbloqueados > 0 && (
            <div className="text-2xl font-bold text-[#92671A] dark:text-[#FCD34D]">{desbloqueados} 🏅</div>
          )}
        </div>

        <div className="h-1.5 bg-surface-subtle rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-[#92671A] dark:bg-[#FCD34D] rounded-full transition-all"
            style={{ width: `${(desbloqueados / total) * 100}%` }}
          />
        </div>

        {/* ── Logros desbloqueados ── */}
        {logrosDesbloqueados.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-text-primary mb-3">Desbloqueados</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {logrosDesbloqueados.map(({ logro, config }) => (
                <div
                  key={config.key}
                  className="rounded-2xl p-4 flex flex-col items-center text-center border-2 border-[#E8D4A8] dark:border-[#78350F] bg-[#FBF4E8] dark:bg-[#451A03]"
                >
                  <span className="text-4xl mb-2">{config.emoji}</span>
                  <p className="font-bold text-sm text-[#92671A] dark:text-[#FCD34D]">{config.nombre}</p>
                  <p className="text-xs text-text-secondary mt-1 leading-snug">{config.descripcion}</p>
                  {logro.desbloqueado_at && (
                    <p className="text-xs font-medium text-[#92671A] dark:text-[#FCD34D] mt-2">
                      ✓ {formatFecha(logro.desbloqueado_at.split('T')[0])}
                    </p>
                  )}
                  <button
                    onClick={() => setLogroEnModal(config)}
                    className="mt-3 text-xs font-semibold text-[#92671A] dark:text-[#FCD34D] underline hover:opacity-80 transition"
                  >
                    Ver video 🎬
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Logros bloqueados ── */}
        {logrosBlockeados.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-text-secondary mb-3">Por desbloquear</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {logrosBlockeados.map(config => (
                <div
                  key={config.key}
                  className="rounded-2xl p-4 flex flex-col items-center text-center border bg-surface-subtle opacity-60 grayscale"
                >
                  <span className="text-4xl mb-2">{config.emoji}</span>
                  <p className="font-bold text-sm text-text-secondary">{config.nombre}</p>
                  <p className="text-xs text-text-secondary mt-1 leading-snug">{config.descripcion}</p>
                  <p className="text-xs text-text-muted mt-2">🔒 Bloqueado</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {desbloqueados === 0 && (
          <p className="text-center text-sm text-text-secondary mt-4">
            Completá tu primer registro para empezar a desbloquear logros 🚀
          </p>
        )}
      </div>
    </>
  )
}
