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

  // Contar alertas no resueltas de los pacientes de este facilitador
  // 🔒 Scoping explícito para no contar alertas de otros facilitadores (pre-RLS)
  const { data: miembrosData } = await supabase
    .from('grupo_miembros')
    .select('user_id, grupos!inner(facilitador_id)')
    .eq('grupos.facilitador_id', user.id)
    .eq('activo', true)

  const pacienteIds = Array.from(new Set((miembrosData ?? []).map((m: { user_id: string }) => m.user_id)))

  const { count: alertasCount } = pacienteIds.length > 0
    ? await supabase
        .from('alertas')
        .select('*', { count: 'exact', head: true })
        .in('user_id', pacienteIds)
        .eq('resuelta', false)
    : { count: 0 }

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
