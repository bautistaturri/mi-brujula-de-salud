import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardPacienteView from '@/components/patient/DashboardPacienteView'

function getWeekStart(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  return monday.toISOString().split('T')[0]
}

export default async function DashboardPacientePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const weekStart = getWeekStart()

  // Checkin de esta semana
  const { data: checkinActual } = await supabase
    .from('checkins_semanales')
    .select('*')
    .eq('user_id', user.id)
    .eq('week_start', weekStart)
    .single()

  // Historial últimas 8 semanas
  const { data: historial } = await supabase
    .from('checkins_semanales')
    .select('week_start, semaphore, scores, dominant_domain')
    .eq('user_id', user.id)
    .order('week_start', { ascending: false })
    .limit(8)

  // Conductas ancla
  const { data: conductas } = await supabase
    .from('conductas_ancla')
    .select('id, nombre, icono, orden')
    .eq('user_id', user.id)
    .eq('activa', true)
    .order('orden')
    .limit(5)

  // Racha verde
  const { data: racha } = await supabase
    .from('rachas')
    .select('semanas_consecutivas')
    .eq('paciente_id', user.id)
    .eq('tipo', 'green_streak')
    .single()

  // Nombre del usuario
  const { data: profile } = await supabase
    .from('users')
    .select('nombre')
    .eq('id', user.id)
    .single()

  return (
    <DashboardPacienteView
      nombre={profile?.nombre ?? 'Paciente'}
      checkinActual={checkinActual ?? null}
      historial={historial ?? []}
      conductas={conductas ?? []}
      rachaVerde={racha?.semanas_consecutivas ?? 0}
      weekStart={weekStart}
    />
  )
}
