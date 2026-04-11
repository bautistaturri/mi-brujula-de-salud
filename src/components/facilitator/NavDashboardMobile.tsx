'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Panel',
    icon: (
      <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
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
      <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
        <path d="M9 2a5.5 5.5 0 00-5.5 5.5v3l-1 2h13l-1-2V7.5A5.5 5.5 0 009 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M7 13.5a2 2 0 004 0" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/grupos',
    label: 'Grupos',
    icon: (
      <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M3 16c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="14" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M16 12c0-1.66-1.34-3-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/perfil',
    label: 'Perfil',
    icon: (
      <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
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

export default function NavDashboardMobile({ nombre, alertasCount }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Sticky top header — mobile only */}
      <header className="md:hidden sticky top-0 z-30 bg-surface-card border-b border-border-default px-4 py-3 flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--brand-primary)' }}
        >
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="7" stroke="white" strokeWidth="1.2" strokeOpacity="0.4"/>
            <circle cx="9" cy="9" r="1.5" fill="white"/>
            <path d="M9 3L10 8L9 9L8 8Z" fill="white"/>
            <path d="M9 15L8 10L9 9L10 10Z" fill="white" fillOpacity="0.5"/>
            <path d="M3 9L8 8L9 9L8 10Z" fill="white" fillOpacity="0.5"/>
            <path d="M15 9L10 10L9 9L10 8Z" fill="white" fillOpacity="0.7"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-text-primary leading-none">Mi Brújula</p>
          <p className="text-xs text-text-muted leading-none mt-0.5 truncate">{nombre}</p>
        </div>
      </header>

      {/* Fixed bottom nav — mobile only */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-card border-t border-border-default z-30"
        style={{ boxShadow: '0 -1px 0 rgba(0,0,0,0.04), 0 -4px 16px rgba(0,0,0,0.06)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex">
          {NAV_ITEMS.map(item => {
            const activo = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 flex flex-col items-center pt-2 pb-3 gap-0.5 transition-colors relative"
                style={{ color: activo ? 'var(--brand-primary)' : 'var(--text-muted)' }}
              >
                {activo && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                    style={{ background: 'var(--brand-primary)' }}
                  />
                )}
                <span className={`relative ${activo ? 'opacity-100' : 'opacity-60'}`}>
                  {item.icon}
                  {item.href === '/dashboard/alertas' && alertasCount > 0 && (
                    <span
                      className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[8px] font-bold flex items-center justify-center tabular-nums"
                      style={{ background: '#EF4444', color: 'white' }}
                    >
                      {alertasCount > 9 ? '9+' : alertasCount}
                    </span>
                  )}
                </span>
                <span className="text-[9px] font-semibold tracking-wide">{item.label}</span>
              </Link>
            )
          })}

          <button
            onClick={handleLogout}
            className="flex-1 flex flex-col items-center pt-2 pb-3 gap-0.5 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <span className="opacity-60">
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                <path d="M10.5 3h3a1 1 0 011 1v8a1 1 0 01-1 1h-3M7 11l4-3-4-3M11 8H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span className="text-[9px] font-semibold tracking-wide">Salir</span>
          </button>
        </div>
      </nav>
    </>
  )
}
