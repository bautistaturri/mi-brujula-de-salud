// DESIGN: Banner de alerta médica con borde izquierdo de color
type Variant = 'danger' | 'warning' | 'info' | 'success'

interface Props {
  variant: Variant
  title: string
  message?: string
  icon?: string
  onClose?: () => void
}

const VARIANT_CONFIG: Record<Variant, { bg: string; border: string; title: string; accent: string; defaultIcon: string }> = {
  danger:  { bg: '#FEF2F2', border: '#FECACA', title: '#991B1B', accent: '#EF4444', defaultIcon: '🚨' },
  warning: { bg: '#FFFBEB', border: '#FDE68A', title: '#92400E', accent: '#F59E0B', defaultIcon: '⚠️' },
  info:    { bg: '#EFF6FF', border: '#BFDBFE', title: '#1E40AF', accent: '#2563EB', defaultIcon: 'ℹ️' },
  success: { bg: '#ECFDF5', border: '#A7F3D0', title: '#065F46', accent: '#10B981', defaultIcon: '✅' },
}

export default function AlertaBanner({ variant, title, message, icon, onClose }: Props) {
  const c = VARIANT_CONFIG[variant]

  return (
    <div
      className="rounded-xl flex gap-3 p-4 relative"
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderLeft: `3px solid ${c.accent}`,
      }}
    >
      <span className="text-xl flex-shrink-0 mt-0.5">{icon ?? c.defaultIcon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm" style={{ color: c.title }}>{title}</p>
        {message && (
          <p className="text-sm mt-0.5 leading-relaxed" style={{ color: c.title, opacity: 0.8 }}>
            {message}
          </p>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-sm opacity-50 hover:opacity-100 transition-opacity flex-shrink-0 self-start"
          style={{ color: c.title }}
          aria-label="Cerrar"
        >
          ✕
        </button>
      )}
    </div>
  )
}
