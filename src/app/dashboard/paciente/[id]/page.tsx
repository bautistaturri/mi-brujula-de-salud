import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import FichaPaciente from '@/components/facilitator/FichaPaciente'
import type { CheckinSemanal, User, Alert } from '@/types/database'

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

  const [pacienteRes, checkinsRes, alertasRes, rachaRes] = await Promise.all([
    supabase
      .from('users')
      .select('*')
      .eq('id', pacienteId)
      .single(),

    supabase
      .from('checkins_semanales')
      .select('*')
      .eq('user_id', pacienteId)
      .order('week_start', { ascending: false })
      .limit(12),

    supabase
      .from('alerts')
      .select('*')
      .eq('patient_id', pacienteId)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(20),

    supabase
      .from('rachas')
      .select('semanas_consecutivas')
      .eq('paciente_id', pacienteId)
      .eq('tipo', 'green_streak')
      .single(),
  ])

  if (!pacienteRes.data) notFound()

  // Score de riesgo: inverso del ICS del último check-in
  const ultimoCheckin = (checkinsRes.data ?? [])[0]
  const lastIcs = ultimoCheckin?.scores?.ics ?? null
  const scoreRiesgo = lastIcs !== null ? Math.max(0, Math.round(100 - lastIcs)) : 50

  return (
    <div className="p-8 space-y-6">
      <FichaPaciente
        paciente={pacienteRes.data as User}
        checkins={(checkinsRes.data ?? []) as CheckinSemanal[]}
        alertas={(alertasRes.data ?? []) as Alert[]}
        rachaVerde={rachaRes.data?.semanas_consecutivas ?? 0}
        scoreRiesgo={scoreRiesgo}
        facilitadorId={user.id}
      />
    </div>
  )
}
