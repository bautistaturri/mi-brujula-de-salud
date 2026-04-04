import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import RegistrosPacienteView from '@/components/registro-semanal/RegistrosPacienteView'
import type { RegistroSemanal, LogroPaciente } from '@/types/database'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface Props {
  params: { id: string }
}

export default async function RegistrosPacientePage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const pacienteId = params.id
  if (!UUID_RE.test(pacienteId)) notFound()

  // Verificar que el facilitador tiene acceso a este paciente
  const { data: grupos } = await supabase
    .from('grupos')
    .select('id')
    .eq('facilitador_id', user.id)

  const grupoIds = (grupos ?? []).map(g => g.id)

  const { data: acceso } = await supabase
    .from('grupo_miembros')
    .select('grupo_id')
    .eq('user_id', pacienteId)
    .in('grupo_id', grupoIds.length > 0 ? grupoIds : [''])
    .maybeSingle()

  if (!acceso) notFound()

  const [pacienteRes, registrosRes, logrosRes] = await Promise.all([
    supabase.from('users').select('nombre, email, whatsapp').eq('id', pacienteId).single(),
    supabase
      .from('registros_semanales')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('semana_inicio', { ascending: false }),
    supabase
      .from('logros_paciente')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('desbloqueado_at', { ascending: false }),
  ])

  if (!pacienteRes.data) notFound()

  return (
    <div className="p-6 max-w-4xl">
      <RegistrosPacienteView
        paciente={pacienteRes.data}
        registros={(registrosRes.data ?? []) as RegistroSemanal[]}
        logros={(logrosRes.data ?? []) as LogroPaciente[]}
        pacienteId={pacienteId}
      />
    </div>
  )
}
