// DESIGN: Skeleton loader para cards y listas
interface Props {
  lines?: number
  showAvatar?: boolean
  className?: string
}

function SkeletonLine({ width = 'full', height = 'h-3' }: { width?: string; height?: string }) {
  return (
    <div
      className={`${height} rounded-md animate-pulse`}
      style={{
        width: width === 'full' ? '100%' : width,
        background: 'linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.5s infinite',
      }}
    />
  )
}

export default function SkeletonCard({ lines = 3, showAvatar = false, className = '' }: Props) {
  return (
    <div
      className={`rounded-2xl border border-border-default bg-surface-card p-5 ${className}`}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      {showAvatar && (
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-surface-subtle animate-pulse" />
          <div className="flex-1 space-y-2">
            <SkeletonLine width="60%" height="h-3" />
            <SkeletonLine width="40%" height="h-2.5" />
          </div>
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonLine
            key={i}
            width={i === lines - 1 ? '70%' : 'full'}
            height={i === 0 ? 'h-4' : 'h-3'}
          />
        ))}
      </div>
      <style>{`
        @keyframes skeleton-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}
