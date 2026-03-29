// DESIGN: Estado vacío con ilustración SVG inline
interface Props {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
}

// Ilustración SVG abstracta de salud
function HealthIllustration() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="mx-auto mb-4">
      <circle cx="40" cy="40" r="38" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="2"/>
      <path d="M28 38C28 32 34 28 40 34C46 28 52 32 52 38C52 44 40 52 40 52C40 52 28 44 28 38Z"
        fill="#2563EB" fillOpacity="0.15" stroke="#2563EB" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M40 34V26M36 30H44" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export default function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon ? (
        <div className="text-5xl mb-4">{icon}</div>
      ) : (
        <HealthIllustration />
      )}
      <h3 className="font-heading font-semibold text-text-primary text-lg mb-2">{title}</h3>
      {description && (
        <p className="text-text-secondary text-sm max-w-xs leading-relaxed mb-6">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}
