import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AlertasList from '@/components/facilitator/AlertasList'
import type { Alerta, User } from '@/types/database'

export default async function AlertasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Obtener IDs de pacientes de los grupos del facilitador
  const { data: grupos, error: gruposError } = await supabase
    .from('grupos')
    .select('id')
    .eq('facilitador_id', user.id)

  if (gruposError) {
    return (
      <div className="p-8 text-center py-16">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-slate-500">No se pudieron cargar los grupos. Intentá de nuevo.</p>
      </div>
    )
  }

  const grupoIds = (grupos ?? []).map(g => g.id)

  const { data: miembros } = await supabase
    .from('grupo_miembros')
    .select('user_id')
    .in('grupo_id', grupoIds)

  const pacienteIds = (miembros ?? []).map(m => m.user_id)

  // Alertas no resueltas, ordenadas por prioridad y fecha
  const { data: alertas, error: alertasError } = await supabase
    .from('alertas')
    .select('*')
    .in('user_id', pacienteIds.length > 0 ? pacienteIds : ['00000000-0000-0000-0000-000000000000'])
    .eq('resuelta', false)
    .order('prioridad', { ascending: false })
    .order('fecha', { ascending: false })

  if (alertasError) {
    return (
      <div className="p-8 text-center py-16">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-slate-500">No se pudieron cargar las alertas. Intentá de nuevo.</p>
      </div>
    )
  }

  // Perfiles de los pacientes con alertas
  const alertaUserIds = Array.from(new Set((alertas ?? []).map(a => a.user_id)))
  const { data: pacientes } = await supabase
    .from('users')
    .select('id, nombre, email, avatar_url')
    .in('id', alertaUserIds.length > 0 ? alertaUserIds : ['00000000-0000-0000-0000-000000000000'])

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-1">Centro de alertas</p>
        <h1 className="font-heading text-h1 font-bold text-text-primary">Alertas</h1>
        <p className="text-text-secondary mt-1">
          {(alertas ?? []).length} alertas pendientes de revisión
        </p>
      </div>

      <AlertasList
        alertas={(alertas ?? []) as Alerta[]}
        pacientes={(pacientes ?? []) as Pick<User, 'id' | 'nombre' | 'email' | 'avatar_url'>[]}
      />
    </div>
  )
}
