import { LOGROS_CONFIG } from '@/lib/logros'
import type { LogroPaciente } from '@/types/database'
import LogroCard from './LogroCard'

interface Props {
  logros: LogroPaciente[]
}

export default function LogrosGrid({ logros }: Props) {
  const mapaLogros = new Map(logros.map(l => [l.logro_key, l.desbloqueado_at]))
  const total = Object.keys(LOGROS_CONFIG).length
  const desbloqueados = logros.length

  return (
    <div>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-[#1C1917]">Mis logros</h2>
          <p className="text-sm text-[#78716C] mt-0.5">
            {desbloqueados} de {total} desbloqueados
          </p>
        </div>
        {desbloqueados > 0 && (
          <div className="text-2xl font-bold text-[#92671A]">{desbloqueados} 🏅</div>
        )}
      </div>

      <div className="h-1.5 bg-[#E2DDD6] rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-[#92671A] rounded-full transition-all"
          style={{ width: `${(desbloqueados / total) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Object.values(LOGROS_CONFIG).map(config => (
          <LogroCard
            key={config.key}
            config={config}
            desbloqueadoAt={mapaLogros.get(config.key) ?? null}
          />
        ))}
      </div>

      {desbloqueados === 0 && (
        <p className="text-center text-sm text-[#78716C] mt-4">
          Completá tu primer registro semanal para empezar a desbloquear logros 🚀
        </p>
      )}
    </div>
  )
}
