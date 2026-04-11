import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SidebarFacilitador from '@/components/facilitator/SidebarFacilitador'
import NavDashboardMobile from '@/components/facilitator/NavDashboardMobile'

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

  // Contar alertas ICS no leídas (tabla `alerts` del motor ICS)
  const { count: alertasCount } = pacienteIds.length > 0
    ? await supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .in('patient_id', pacienteIds)
        .eq('is_read', false)
    : { count: 0 }

  return (
    <div className="min-h-screen bg-surface-base flex">
      <SidebarFacilitador
        nombre={profile.nombre}
        alertasCount={alertasCount ?? 0}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <NavDashboardMobile
          nombre={profile.nombre}
          alertasCount={alertasCount ?? 0}
        />
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>
    </div>
  )
}
