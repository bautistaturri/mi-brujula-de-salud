'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Panel general',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="10" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="2" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="10" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/alertas',
    label: 'Alertas',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 2a5.5 5.5 0 00-5.5 5.5v3l-1 2h13l-1-2V7.5A5.5 5.5 0 009 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M7 13.5a2 2 0 004 0" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/grupos',
    label: 'Grupos',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M3 16c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="14" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M16 12c0-1.66-1.34-3-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/perfil',
    label: 'Mi perfil & WhatsApp',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M3 16c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
]

interface Props {
  nombre: string
  alertasCount: number
}

export default function SidebarFacilitador({ nombre, alertasCount }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className="w-[260px] flex flex-col min-h-screen bg-surface-card border-r border-border-default"
      style={{ boxShadow: '1px 0 0 var(--border-default)' }}
    >
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border-default">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--brand-primary)' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="7" stroke="white" strokeWidth="1.2" strokeOpacity="0.4"/>
              <circle cx="9" cy="9" r="1.5" fill="white"/>
              <path d="M9 3L10 8L9 9L8 8Z" fill="white"/>
              <path d="M9 15L8 10L9 9L10 10Z" fill="white" fillOpacity="0.5"/>
              <path d="M3 9L8 8L9 9L8 10Z" fill="white" fillOpacity="0.5"/>
              <path d="M15 9L10 10L9 9L10 8Z" fill="white" fillOpacity="0.7"/>
            </svg>
          </div>
          <div>
            <div className="font-heading font-bold text-sm text-text-primary">Mi Brújula</div>
            <div className="text-xs text-text-muted">Panel Facilitador</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const activo = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium"
              style={
                activo
                  ? { background: '#EFF6FF', color: 'var(--brand-primary)' }
                  : { color: 'var(--text-secondary)' }
              }
            >
              <span style={{ color: activo ? 'var(--brand-primary)' : 'var(--text-muted)' }}>
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {item.href === '/dashboard/alertas' && alertasCount > 0 && (
                <span
                  className="text-[10px] font-bold rounded-full px-1.5 py-0.5 tabular-nums"
                  style={{ background: '#EF4444', color: 'white' }}
                >
                  {alertasCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Usuario */}
      <div className="px-3 py-4 border-t border-border-default">
        <div className="flex items-center gap-3 px-3 mb-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
            style={{ background: 'var(--brand-primary)' }}
          >
            {nombre.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-text-primary truncate">{nombre}</div>
            <div className="text-xs text-text-muted">Facilitador</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-text-muted hover:text-status-error transition-colors"
          style={{ '--hover-bg': '#FEF2F2' } as React.CSSProperties}
          onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10.5 3h3a1 1 0 011 1v8a1 1 0 01-1 1h-3M7 11l4-3-4-3M11 8H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
