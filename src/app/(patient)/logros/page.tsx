import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogrosGrid from '@/components/logros/LogrosGrid'
import type { LogroPaciente } from '@/types/database'

export default async function LogrosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: logrosData } = await supabase
    .from('logros_paciente')
    .select('*')
    .eq('paciente_id', user.id)
    .order('desbloqueado_at', { ascending: false })

  const { count: totalRegistros } = await supabase
    .from('registros_semanales')
    .select('*', { count: 'exact', head: true })
    .eq('paciente_id', user.id)

  return (
    <div className="px-4 pt-6 pb-8">
      <div className="mb-4 text-sm text-[#78716C]">
        {totalRegistros ?? 0} semana(s) registrada(s) en total
      </div>
      <LogrosGrid logros={(logrosData ?? []) as LogroPaciente[]} />
    </div>
  )
}
