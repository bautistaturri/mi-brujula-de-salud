import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CheckinWizard from '@/components/patient/CheckinWizard'
import type { ConductaAncla, Turno } from '@/types/database'

function detectarTurno(): Turno {
  const hora = new Date().getHours()
  return hora < 15 ? 'manana' : 'noche'
}

export default async function CheckinPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const hoy = new Date().toISOString().split('T')[0]
  const turno = detectarTurno()

  const [conductasRes, checkinTurnoRes, waTelefonoRes] = await Promise.all([
    supabase
      .from('conductas_ancla')
      .select('*')
      .eq('user_id', user.id)
      .eq('activa', true)
      .order('orden'),

    supabase
      .from('checkins')
      .select('id')
      .eq('user_id', user.id)
      .eq('fecha', hoy)
      .eq('turno', turno)
      .maybeSingle(),

    // Buscar el WA de la médica usando función SECURITY DEFINER (evita recursión RLS)
    supabase.rpc('get_facilitador_whatsapp', { p_user_id: user.id }),
  ])

  // Si ya hizo el check-in de este turno, redirigir
  if (checkinTurnoRes.data) {
    redirect('/inicio')
  }

  const waTelefono: string | null = waTelefonoRes.data ?? null

  return (
    <CheckinWizard
      userId={user.id}
      conductas={(conductasRes.data ?? []) as ConductaAncla[]}
      turno={turno}
      waTelefono={waTelefono}
    />
  )
}
