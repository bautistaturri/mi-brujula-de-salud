'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { href: '/inicio', icon: '🏠', label: 'Inicio' },
  { href: '/checkin', icon: '✅', label: 'Check-in' },
  { href: '/historial', icon: '📊', label: 'Historial' },
]

interface Props {
  nombre: string
}

export default function NavPaciente({ nombre }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-bottom">
      <div className="max-w-lg mx-auto flex">
        {NAV_ITEMS.map(item => {
          const activo = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${
                activo ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center py-3 gap-1 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <span className="text-xl">🚪</span>
          <span className="text-xs font-medium">Salir</span>
        </button>
      </div>
    </nav>
  )
}
