'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', icon: '📊', label: 'Panel general' },
  { href: '/dashboard/alertas', icon: '🔔', label: 'Alertas' },
  { href: '/dashboard/grupos', icon: '👥', label: 'Grupos' },
  { href: '/dashboard/perfil', icon: '📲', label: 'Mi perfil & WhatsApp' },
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
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col min-h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧭</span>
          <div>
            <div className="font-bold text-slate-800 text-sm">Mi Brújula</div>
            <div className="text-xs text-slate-400">Panel Facilitador</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map(item => {
          const activo = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${
                activo
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
              {item.href === '/dashboard/alertas' && alertasCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                  {alertasCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Usuario */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
            {nombre.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-700 truncate">{nombre}</div>
            <div className="text-xs text-slate-400">Facilitador</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-sm text-slate-500 hover:text-red-500 py-2 rounded-lg hover:bg-red-50 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
