// DESIGN: Header reutilizable de página con título, subtítulo y acciones
interface Props {
  title: string
  subtitle?: string
  badge?: string
  action?: React.ReactNode
  backHref?: string
  backLabel?: string
}

export default function PageHeader({ title, subtitle, badge, action, backHref, backLabel }: Props) {
  return (
    <div className="mb-8">
      {backHref && (
        <a
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4"
        >
          <span className="text-base">←</span>
          <span>{backLabel ?? 'Volver'}</span>
        </a>
      )}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-heading text-h2 font-bold text-text-primary">{title}</h1>
            {badge && (
              <span className="text-xs font-semibold bg-brand-primary-soft text-brand-primary px-3 py-1 rounded-full border border-blue-200">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-text-secondary mt-1 text-base">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  )
}
