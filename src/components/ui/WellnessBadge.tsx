// DESIGN: Badge de nivel de bienestar con color semántico
interface Props {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showScore?: boolean
}

interface NivelConfig {
  label: string
  emoji: string
  bg: string
  text: string
  border: string
}

export function getNivelConfig(score: number): NivelConfig {
  if (score >= 80) return {
    label: 'Excelente', emoji: '🌟',
    bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0',
  }
  if (score >= 60) return {
    label: 'Buena', emoji: '💪',
    bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE',
  }
  if (score >= 40) return {
    label: 'Regular', emoji: '🌤',
    bg: '#FFFBEB', text: '#92400E', border: '#FDE68A',
  }
  return {
    label: 'Difícil', emoji: '💙',
    bg: '#FEF2F2', text: '#991B1B', border: '#FECACA',
  }
}

export default function WellnessBadge({ score, size = 'md', showScore = false }: Props) {
  const config = getNivelConfig(score)

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 gap-1',
    md: 'text-sm px-3 py-1.5 gap-1.5',
    lg: 'text-base px-4 py-2 gap-2',
  }

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${sizeClasses[size]}`}
      style={{ background: config.bg, color: config.text, borderColor: config.border }}
    >
      <span>{config.emoji}</span>
      <span>{config.label}{showScore ? ` · ${score}` : ''}</span>
    </span>
  )
}
