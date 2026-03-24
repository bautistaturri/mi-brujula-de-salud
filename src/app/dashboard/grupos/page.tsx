import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GruposManager from '@/components/facilitator/GruposManager'
import type { Grupo, User } from '@/types/database'

export default async function GruposPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: grupos, error: gruposError } = await supabase
    .from('grupos')
    .select('*')
    .eq('facilitador_id', user.id)
    .order('created_at', { ascending: false })

  if (gruposError) {
    return (
      <div className="p-8 text-center py-16">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-slate-500">No se pudieron cargar los grupos. Intentá de nuevo.</p>
      </div>
    )
  }

  // Miembros de cada grupo
  const { data: miembros } = await supabase
    .from('grupo_miembros')
    .select('grupo_id, user_id')
    .in('grupo_id', (grupos ?? []).map(g => g.id))

  const userIds = Array.from(new Set((miembros ?? []).map(m => m.user_id)))
  const { data: pacientes } = await supabase
    .from('users')
    .select('id, nombre, email')
    .in('id', userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000'])

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Grupos</h1>
          <p className="text-slate-500 mt-1">{(grupos ?? []).length} grupos activos</p>
        </div>
      </div>

      <GruposManager
        grupos={(grupos ?? []) as Grupo[]}
        miembros={miembros ?? []}
        pacientes={(pacientes ?? []) as Pick<User, 'id' | 'nombre' | 'email'>[]}
        facilitadorId={user.id}
      />
    </div>
  )
}
