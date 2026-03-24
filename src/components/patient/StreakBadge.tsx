interface Props {
  racha: number
}

export default function StreakBadge({ racha }: Props) {
  if (racha === 0) return null

  const color =
    racha >= 14 ? 'bg-purple-100 text-purple-700 border-purple-200' :
    racha >= 7  ? 'bg-orange-100 text-orange-700 border-orange-200' :
                  'bg-blue-100 text-blue-700 border-blue-200'

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-semibold ${color}`}>
      <span>🔥</span>
      <span>{racha} {racha === 1 ? 'día' : 'días'}</span>
    </div>
  )
}
