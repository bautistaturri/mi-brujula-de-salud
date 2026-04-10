import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getWeekStart } from '@/lib/utils'
import CheckinICS from '@/components/patient/CheckinICS'

// Calcula ica_days pre-poblados a partir de los registros diarios de la semana.
// ica_days[i] = cuántos días cumplió la conducta i esta semana (escala: 0-7).
// Si registró solo 4 días, se escala proporcionalmente al total de días del usuario.
function calcIcaDaysDesdeRegistrosDiarios(
  registros: Array<{ conductas_hoy: boolean[]; fecha: string }>,
  cantidadConductas: number
): { icaDays: number[]; energiaPromedio: number | null; diasRegistrados: number } {
  if (registros.length === 0) {
    return { icaDays: new Array(cantidadConductas).fill(0), energiaPromedio: null, diasRegistrados: 0 }
  }

  // Sumar conductas cumplidas por posición
  const sumas = new Array(cantidadConductas).fill(0)
  let diasRegistrados = 0

  for (const r of registros) {
    if (!r.conductas_hoy || r.conductas_hoy.length === 0) continue
    diasRegistrados++
    for (let i = 0; i < cantidadConductas; i++) {
      if (r.conductas_hoy[i]) sumas[i]++
    }
  }

  // Clampear a 7 (máximo posible por semana)
  const icaDays = sumas.map(s => Math.min(7, s))

  return { icaDays, energiaPromedio: null, diasRegistrados }
}

export default async function CheckinPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const weekStart = getWeekStart()

  const [conductasRes, checkinExistenteRes, registrosDiariosRes] = await Promise.all([
    supabase
      .from('conductas_ancla')
      .select('id, nombre, icono, orden')
      .eq('user_id', user.id)
      .eq('activa', true)
      .order('orden')
      .limit(5),

    supabase
      .from('checkins_semanales')
      .select('id')
      .eq('user_id', user.id)
      .eq('week_start', weekStart)
      .single(),

    // Registros diarios de esta semana para pre-poblar ICA
    supabase
      .from('registros_diarios')
      .select('fecha, conductas_hoy, energia_dia')
      .eq('paciente_id', user.id)
      .gte('fecha', weekStart)
      .order('fecha', { ascending: true })
      .limit(7),
  ])

  if (!conductasRes.data || conductasRes.data.length === 0) {
    redirect('/onboarding')
  }

  const conductas = conductasRes.data
  const registrosDiarios = registrosDiariosRes.data ?? []

  // Pre-poblar ICA desde registros diarios
  const prepoblado = calcIcaDaysDesdeRegistrosDiarios(registrosDiarios, conductas.length)

  // Energía promedio de la semana (sugerencia para be_energy)
  const energias = registrosDiarios
    .filter(r => r.energia_dia != null)
    .map(r => r.energia_dia as number)
  const energiaPromedio = energias.length > 0
    ? Math.round(energias.reduce((a, b) => a + b, 0) / energias.length)
    : null

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

      {/* Aviso de pre-población si hay datos diarios */}
      {prepoblado.diasRegistrados > 0 && !checkinExistenteRes.data && (
        <div className="mx-5 mt-4 p-3 bg-[#D4EDEA] border border-[#A8D5B5] rounded-xl text-sm text-[#1A6B3C]">
          <p className="font-semibold mb-0.5">
            📅 Basado en tus registros diarios de esta semana:
          </p>
          <p className="text-xs text-[#4A9E6B]">
            {prepoblado.diasRegistrados} día{prepoblado.diasRegistrados !== 1 ? 's' : ''} registrado{prepoblado.diasRegistrados !== 1 ? 's' : ''} ·
            {energiaPromedio ? ` Energía promedio: ${energiaPromedio}/5` : ''}
            {' · '}Podés ajustar los valores antes de enviar.
          </p>
        </div>
      )}

      <CheckinICS
        userId={user.id}
        conductas={conductas}
        weekStart={weekStart}
        yaCompletado={!!checkinExistenteRes.data}
        redirectTo="/inicio"
        icaDaysIniciales={prepoblado.icaDays}
        beEnergyInicial={energiaPromedio ?? undefined}
      />
    </div>
  )
}
