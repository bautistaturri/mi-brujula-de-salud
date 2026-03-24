import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import FichaPaciente from '@/components/facilitator/FichaPaciente'
import type { Checkin, User, Alerta } from '@/types/database'

interface Props {
  params: { id: string }
}

export default async function FichaPacientePage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const pacienteId = params.id

  // Verificar que el facilitador tiene acceso a este paciente
  const { data: acceso } = await supabase
    .from('grupo_miembros')
    .select('grupo_id')
    .eq('user_id', pacienteId)
    .in('grupo_id',
      (await supabase.from('grupos').select('id').eq('facilitador_id', user.id)).data?.map(g => g.id) ?? []
    )
    .maybeSingle()

  if (!acceso) notFound()

  const [pacienteRes, checkinsRes, alertasRes, rachaRes, scoreRes] = await Promise.all([
    supabase.from('users').select('*').eq('id', pacienteId).single(),
    supabase.from('checkins').select('*').eq('user_id', pacienteId).order('fecha', { ascending: false }).limit(30),
    supabase.from('alertas').select('*').eq('user_id', pacienteId).order('fecha', { ascending: false }).limit(20),
    supabase.rpc('calcular_racha', { p_user_id: pacienteId }),
    supabase.rpc('calcular_score_riesgo', { p_user_id: pacienteId }),
  ])

  if (!pacienteRes.data) notFound()

  return (
    <div className="p-8 space-y-6">
      <FichaPaciente
        paciente={pacienteRes.data as User}
        checkins={(checkinsRes.data ?? []) as Checkin[]}
        alertas={(alertasRes.data ?? []) as Alerta[]}
        racha={(rachaRes.data as number) ?? 0}
        scoreRiesgo={(scoreRes.data as number) ?? 0}
        facilitadorId={user.id}
      />
    </div>
  )
}
