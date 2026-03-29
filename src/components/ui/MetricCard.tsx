// DESIGN: Card de métrica con tendencia y color semántico
interface Props {
  label: string
  value: string | number
  sub?: string
  icon?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

const VARIANT_STYLES = {
  default:  { bg: '#FFFFFF',  border: '#E2E8F0', iconBg: '#F1F5F9', iconText: '#475569' },
  success:  { bg: '#ECFDF5',  border: '#A7F3D0', iconBg: '#D1FAE5', iconText: '#065F46' },
  warning:  { bg: '#FFFBEB',  border: '#FDE68A', iconBg: '#FEF3C7', iconText: '#92400E' },
  danger:   { bg: '#FEF2F2',  border: '#FECACA', iconBg: '#FEE2E2', iconText: '#991B1B' },
  info:     { bg: '#EFF6FF',  border: '#BFDBFE', iconBg: '#DBEAFE', iconText: '#1E40AF' },
} as const

export default function MetricCard({ label, value, sub, icon, trend, trendValue, variant = 'default', className = '' }: Props) {
  const s = VARIANT_STYLES[variant]

  return (
    <div
      className={`rounded-2xl border p-5 ${className}`}
      style={{ background: s.bg, borderColor: s.border, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-start justify-between mb-3">
        {icon && (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
            style={{ background: s.iconBg }}
          >
            {icon}
          </div>
        )}
        {trend && (
          <span className={`text-xs font-semibold flex items-center gap-0.5 ${
            trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-slate-400'
          }`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
            {trendValue}
          </span>
        )}
      </div>
      <div className="font-metric text-3xl font-bold text-text-primary leading-none">
        {value}
        {sub && <span className="text-base font-sans font-normal text-text-muted ml-1">{sub}</span>}
      </div>
      <p className="text-sm text-text-secondary mt-1.5">{label}</p>
    </div>
  )
}
