import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardDiario from '@/components/patient/DashboardDiario'
import type { Checkin, ConductaAncla } from '@/types/database'

export default async function InicioPacientePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const hoy = new Date().toISOString().split('T')[0]

  const [profileRes, checkinsHoyRes, conductasRes, rachaRes, historialRes] = await Promise.all([
    supabase.from('users').select('nombre, avatar_url').eq('id', user.id).single(),
    supabase.from('checkins').select('*').eq('user_id', user.id).eq('fecha', hoy),
    supabase.from('conductas_ancla').select('*').eq('user_id', user.id).eq('activa', true).order('orden'),
    supabase.rpc('calcular_racha', { p_user_id: user.id }),
    supabase
      .from('checkins')
      .select('fecha, semaforo, iem, turno')
      .eq('user_id', user.id)
      .order('fecha', { ascending: false })
      .limit(14),
  ])

  if (profileRes.error) {
    redirect('/login')
  }

  const checkinsHoy = (checkinsHoyRes.data ?? []) as Checkin[]
  const checkinManana = checkinsHoy.find(c => c.turno === 'manana') ?? null
  const checkinNoche = checkinsHoy.find(c => c.turno === 'noche') ?? null

  return (
    <DashboardDiario
      userId={user.id}
      nombre={profileRes.data?.nombre ?? ''}
      checkinManana={checkinManana}
      checkinNoche={checkinNoche}
      conductas={(conductasRes.data ?? []) as ConductaAncla[]}
      racha={(rachaRes.data as number) ?? 0}
      historial={historialRes.data ?? []}
    />
  )
}
