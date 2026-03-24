import type { Semaforo } from '@/types/database'

interface Props {
  estado: Semaforo
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
}

const sizeMap = {
  sm: 'w-3.5 h-3.5',
  md: 'w-8 h-8',
  lg: 'w-14 h-14',
}

// Colores clínicos apagados — no semáforo de tráfico
const colorMap: Record<Semaforo, string> = {
  verde:    'bg-semaforo-verde',
  amarillo: 'bg-semaforo-amarillo',
  rojo:     'bg-semaforo-rojo',
}

const ringMap: Record<Semaforo, string> = {
  verde:    'bg-semaforo-verde-bg',
  amarillo: 'bg-semaforo-amarillo-bg',
  rojo:     'bg-semaforo-rojo-bg',
}

export default function SemaforoIndicador({ estado, size = 'md', animated = false }: Props) {
  return (
    <div className="relative flex items-center justify-center">
      {animated && estado === 'rojo' && (
        <div className={`absolute rounded-full ${ringMap[estado]} animate-ping ${sizeMap[size]} opacity-50`} />
      )}
      <div className={`rounded-full ${colorMap[estado]} ${sizeMap[size]} flex-shrink-0`} />
    </div>
  )
}
