'use client'

// DESIGN: Círculo animado con score principal (SVG)
import { getNivelConfig } from './WellnessBadge'

interface Props {
  score: number
  size?: number
  strokeWidth?: number
  showLabel?: boolean
}

export default function ScoreRing({ score, size = 120, strokeWidth = 10, showLabel = true }: Props) {
  const config = getNivelConfig(score)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  // Color del arco según score
  const strokeColor =
    score >= 80 ? '#10B981' :
    score >= 60 ? '#2563EB' :
    score >= 40 ? '#F59E0B' :
    '#EF4444'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      {/* Centro */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-metric font-bold leading-none"
          style={{
            fontSize: size * 0.28,
            color: strokeColor,
          }}
        >
          {score}
        </span>
        {showLabel && (
          <span className="text-[10px] font-medium mt-0.5" style={{ color: '#94A3B8' }}>
            / 100
          </span>
        )}
      </div>
    </div>
  )
}
