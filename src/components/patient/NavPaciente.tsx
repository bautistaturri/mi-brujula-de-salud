'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ThemeToggle from '@/components/ThemeToggle'

const NAV_ITEMS = [
  {
    href: '/inicio',
    label: 'Inicio',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M7 18v-6h6v6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: '/checkin',
    label: 'Check-in',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: '/registro-semanal',
    label: 'Semana',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M3 8h14M7 2v4M13 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/logros',
    label: 'Logros',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2l2.09 4.26L17 7.27l-3.5 3.41.83 4.82L10 13.27l-4.33 2.23.83-4.82L3 7.27l4.91-.71L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: '/historial',
    label: 'Historial',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 5h14M3 10h10M3 15h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
]

interface Props {
  nombre: string
}

export default function NavPaciente({ nombre }: Props) {
  const pathname = usePathname()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-surface-card border-t border-border-default"
      style={{ boxShadow: '0 -1px 0 rgba(0,0,0,0.04), 0 -4px 16px rgba(0,0,0,0.06)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-lg mx-auto flex">
        {NAV_ITEMS.map(item => {
          const activo = pathname === item.href || (item.href !== '/inicio' && pathname.startsWith(item.href))
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
              <span className={activo ? 'opacity-100' : 'opacity-60'}>{item.icon}</span>
              <span className="text-[9px] font-semibold tracking-wide">{item.label}</span>
            </Link>
          )
        })}
        <ThemeToggle variant="icon" className="flex-1" />

        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center pt-2 pb-3 gap-0.5 transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <span className="opacity-60">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M13 3h4a1 1 0 011 1v12a1 1 0 01-1 1h-4M9 14l4-4-4-4M13 10H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className="text-[9px] font-semibold tracking-wide">Salir</span>
        </button>
      </div>
    </nav>
  )
}
