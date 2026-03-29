import type { LogroConfig } from '@/lib/logros'
import { formatFecha } from '@/lib/utils'

interface Props {
  config: LogroConfig
  desbloqueadoAt?: string | null
}

export default function LogroCard({ config, desbloqueadoAt }: Props) {
  const desbloqueado = !!desbloqueadoAt

  return (
    <div
      className={`rounded-2xl p-5 flex flex-col items-center text-center transition-all border-2 ${
        desbloqueado
          ? 'border-[#E8D4A8] bg-[#FBF4E8]'
          : 'border-[#E2DDD6] bg-[#F7F6F3] opacity-50 grayscale'
      }`}
    >
      <span className="text-4xl mb-2">{config.emoji}</span>
      <p className={`font-bold text-sm ${desbloqueado ? 'text-[#92671A]' : 'text-[#78716C]'}`}>
        {config.nombre}
      </p>
      <p className="text-xs text-[#78716C] mt-1 leading-snug">{config.descripcion}</p>
      {desbloqueado && desbloqueadoAt && (
        <p className="text-xs font-medium text-[#92671A] mt-2">
          ✓ {formatFecha(desbloqueadoAt.split('T')[0])}
        </p>
      )}
      {!desbloqueado && (
        <p className="text-xs text-[#C4BDB5] mt-2">🔒 Bloqueado</p>
      )}
    </div>
  )
}
