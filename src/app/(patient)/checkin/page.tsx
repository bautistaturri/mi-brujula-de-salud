import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getWeekStart } from '@/lib/utils'
import CheckinICS from '@/components/patient/CheckinICS'

export default async function CheckinPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const weekStart = getWeekStart()

  // Conductas ancla del paciente (exactamente 5, activas, ordenadas)
  const { data: conductas } = await supabase
    .from('conductas_ancla')
    .select('id, nombre, icono, orden')
    .eq('user_id', user.id)
    .eq('activa', true)
    .order('orden')
    .limit(5)

  if (!conductas || conductas.length === 0) {
    redirect('/onboarding')
  }

  // ¿Ya completó el check-in esta semana?
  const { data: checkinExistente } = await supabase
    .from('checkins_semanales')
    .select('id')
    .eq('user_id', user.id)
    .eq('week_start', weekStart)
    .single()

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#E5E7EB] px-5 py-4 flex items-center gap-3">
        <a href="/inicio" className="text-[#6B7280] hover:text-[#1F2937]">←</a>
        <div>
          <h1 className="text-base font-bold text-[#1A1A2E]">Check-in semanal</h1>
          <p className="text-xs text-[#9CA3AF]">
            Semana del {new Date(weekStart + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      <CheckinICS
        userId={user.id}
        conductas={conductas}
        weekStart={weekStart}
        yaCompletado={!!checkinExistente}
        redirectTo="/inicio"
      />
    </div>
  )
}
