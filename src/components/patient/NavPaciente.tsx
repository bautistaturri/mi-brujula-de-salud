'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { href: '/inicio', icon: '🏠', label: 'Inicio' },
  { href: '/checkin', icon: '✅', label: 'Check-in' },
  { href: '/registro-semanal', icon: '📋', label: 'Semana' },
  { href: '/logros', icon: '🏅', label: 'Logros' },
  { href: '/historial', icon: '📊', label: 'Historial' },
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
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1C1917] border-t border-[#2C2420] safe-bottom">
      <div className="max-w-lg mx-auto flex">
        {NAV_ITEMS.map(item => {
          const activo = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors ${
                activo ? 'text-[#93C5FD]' : 'text-[#57534E] hover:text-[#A8A29E]'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[9px] font-medium">{item.label}</span>
            </Link>
          )
        })}
        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center py-3 gap-0.5 text-[#57534E] hover:text-[#A8A29E] transition-colors"
        >
          <span className="text-lg">🚪</span>
          <span className="text-[9px] font-medium">Salir</span>
        </button>
      </div>
    </nav>
  )
}
