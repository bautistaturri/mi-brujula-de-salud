import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SidebarFacilitador from '@/components/facilitator/SidebarFacilitador'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('nombre, role, avatar_url')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'facilitador') redirect('/login')

  // Contar alertas no resueltas
  const { count: alertasCount } = await supabase
    .from('alertas')
    .select('*', { count: 'exact', head: true })
    .eq('resuelta', false)

  return (
    <div className="min-h-screen bg-surface-base flex">
      <SidebarFacilitador
        nombre={profile.nombre}
        alertasCount={alertasCount ?? 0}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
