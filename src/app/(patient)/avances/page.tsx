import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogrosPageClient from '@/components/logros/LogrosPageClient'
import HistorialICS from '@/components/patient/HistorialICS'
import type { LogroPaciente, CheckinSemanal } from '@/types/database'

export default async function AvancesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: logrosData },
    { data: checkinsData },
    { count: totalRegistros },
  ] = await Promise.all([
    supabase
      .from('logros_paciente')
      .select('*')
      .eq('paciente_id', user.id)
      .order('desbloqueado_at', { ascending: false }),
    supabase
      .from('checkins_semanales')
      .select('*')
      .eq('user_id', user.id)
      .order('week_start', { ascending: false })
      .limit(20),
    supabase
      .from('checkins_semanales')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ])

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="font-serif text-[28px] text-[#1A1A2E] leading-tight">Avances</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          {totalRegistros ?? 0} semana(s) completada(s)
        </p>
      </div>

      {/* Logros */}
      <div className="px-5 mb-6">
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-3">Logros</h2>
        <LogrosPageClient logros={(logrosData ?? []) as LogroPaciente[]} />
      </div>

      {/* Historial ICS */}
      <div className="px-5">
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-3">Historial de semáforos</h2>
        <HistorialICS checkins={(checkinsData ?? []) as CheckinSemanal[]} />
      </div>
    </div>
  )
}
