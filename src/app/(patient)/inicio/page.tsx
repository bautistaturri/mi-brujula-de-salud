import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getWeekStart } from '@/lib/utils'
import DashboardPacienteView from '@/components/patient/DashboardPacienteView'

export default async function InicioPacientePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const weekStart  = getWeekStart()
  const fechaHoy   = new Date().toISOString().split('T')[0]

  // Lunes de la semana actual (para filtrar registros diarios de la semana)
  const lunesSemana = weekStart  // getWeekStart() ya retorna el lunes ISO

  const [
    profileRes,
    checkinActualRes,
    historialRes,
    conductasRes,
    rachaRes,
    registroHoyRes,
    registrosSemanaRes,
  ] = await Promise.all([
    supabase
      .from('users')
      .select('nombre')
      .eq('id', user.id)
      .single(),

    supabase
      .from('checkins_semanales')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start', weekStart)
      .single(),

    supabase
      .from('checkins_semanales')
      .select('week_start, semaphore, scores, dominant_domain, ica_days')
      .eq('user_id', user.id)
      .order('week_start', { ascending: false })
      .limit(8),

    supabase
      .from('conductas_ancla')
      .select('id, nombre, icono, orden')
      .eq('user_id', user.id)
      .eq('activa', true)
      .order('orden')
      .limit(5),

    supabase
      .from('rachas')
      .select('semanas_consecutivas')
      .eq('paciente_id', user.id)
      .eq('tipo', 'green_streak')
      .single(),

    // ¿Ya registró hoy?
    supabase
      .from('registros_diarios')
      .select('id')
      .eq('paciente_id', user.id)
      .eq('fecha', fechaHoy)
      .single(),

    // Registros diarios de esta semana (lunes a domingo)
    supabase
      .from('registros_diarios')
      .select('id, paciente_id, fecha, energia_dia, animo_dia, conductas_hoy, nota_libre, created_at')
      .eq('paciente_id', user.id)
      .gte('fecha', lunesSemana)
      .order('fecha', { ascending: true })
      .limit(7),
  ])

  if (profileRes.error) redirect('/login')

  return (
    <DashboardPacienteView
      nombre={profileRes.data?.nombre ?? ''}
      checkinActual={checkinActualRes.data ?? null}
      historial={historialRes.data ?? []}
      conductas={conductasRes.data ?? []}
      rachaVerde={rachaRes.data?.semanas_consecutivas ?? 0}
      weekStart={weekStart}
      checkinHref="/checkin"
      fechaHoy={fechaHoy}
      yaRegistroHoy={!!registroHoyRes.data}
      registrosSemana={registrosSemanaRes.data ?? []}
    />
  )
}
