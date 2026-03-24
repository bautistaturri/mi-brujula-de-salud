import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HistorialPaciente from '@/components/patient/HistorialPaciente'
import type { Checkin } from '@/types/database'

export default async function HistorialPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: checkins, error: checkinsError } = await supabase
    .from('checkins')
    .select('*')
    .eq('user_id', user.id)
    .order('fecha', { ascending: false })
    .limit(30)

  const { data: racha, error: rachaError } = await supabase.rpc('calcular_racha', { p_user_id: user.id })

  if (checkinsError) {
    return (
      <div className="px-4 pt-6 text-center py-12">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-slate-500">No se pudo cargar el historial. Intentá de nuevo.</p>
      </div>
    )
  }

  return (
    <HistorialPaciente
      checkins={(checkins ?? []) as Checkin[]}
      racha={rachaError ? 0 : ((racha as number) ?? 0)}
    />
  )
}
