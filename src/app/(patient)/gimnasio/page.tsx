import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GimnasioClient from '@/components/patient/GimnasioClient'
import type { ContenidoGimnasio, ProgresoGimnasio } from '@/types/database'

export default async function GimnasioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: contenidos }, { data: progreso }] = await Promise.all([
    supabase
      .from('contenidos_gimnasio')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true }),
    supabase
      .from('progreso_gimnasio')
      .select('*')
      .eq('usuario_id', user.id),
  ])

  return (
    <GimnasioClient
      userId={user.id}
      contenidos={(contenidos ?? []) as ContenidoGimnasio[]}
      progreso={(progreso ?? []) as ProgresoGimnasio[]}
    />
  )
}
