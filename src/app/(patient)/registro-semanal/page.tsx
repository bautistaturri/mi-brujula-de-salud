import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StepperForm from '@/components/registro-semanal/StepperForm'
import type { RegistroParaLogros } from '@/lib/logros'
import { getWeekStart } from '@/lib/utils'

function getSemanaFin(inicio: string): string {
  const d = new Date(inicio + 'T00:00:00')
  d.setDate(d.getDate() + 6)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export default async function RegistroSemanalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const inicio = getWeekStart()
  const fin    = getSemanaFin(inicio)

  // Verificar si ya existe registro para esta semana
  const { data: registroExistente } = await supabase
    .from('registros_semanales')
    .select('id')
    .eq('paciente_id', user.id)
    .eq('semana_inicio', inicio)
    .maybeSingle()

  // Obtener nombre del paciente
  const { data: profile } = await supabase
    .from('users')
    .select('nombre')
    .eq('id', user.id)
    .single()

  // WhatsApp del facilitador
  const { data: waData } = await supabase.rpc('get_facilitador_whatsapp', { p_user_id: user.id })
  const facilitadorWa: string | null = waData ?? null

  // Registros anteriores para evaluar logros
  const { data: registrosData } = await supabase
    .from('registros_semanales')
    .select('semana_inicio, score, sueno, actividad_fisica')
    .eq('paciente_id', user.id)
    .order('semana_inicio', { ascending: false })

  const registrosAnteriores: RegistroParaLogros[] = (registrosData ?? []).map(r => ({
    semana_inicio: r.semana_inicio,
    score: r.score,
    sueno: r.sueno,
    actividad_fisica: r.actividad_fisica,
  }))

  // Logros ya obtenidos
  const { data: logrosData } = await supabase
    .from('logros_paciente')
    .select('logro_key')
    .eq('paciente_id', user.id)

  const logrosObtenidos = (logrosData ?? []).map(l => l.logro_key)

  return (
    <div className="px-4 pt-6 pb-8">
      <div className="mb-6">
        <p className="text-xs text-[#78716C] mb-1">Semana del {inicio} al {fin}</p>
        <h1 className="text-2xl font-bold text-[#1C1917]">Registro semanal</h1>
      </div>

      {registroExistente ? (
        <div className="bg-white rounded-2xl border border-[#E2DDD6] shadow-sm p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-lg font-bold text-[#1C1917] mb-2">Ya completaste esta semana</h2>
          <p className="text-sm text-[#78716C] mb-6">
            Ya enviaste tu registro para esta semana. ¡Volvé la semana que viene!
          </p>
          <a
            href="/inicio"
            className="inline-block bg-[#2C4A6E] hover:bg-[#1E3550] text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            Volver al inicio
          </a>
        </div>
      ) : (
        <StepperForm
          pacienteId={user.id}
          pacienteNombre={profile?.nombre ?? 'Paciente'}
          semanaInicio={inicio}
          semanaFin={fin}
          facilitadorWhatsapp={facilitadorWa}
          registrosAnteriores={registrosAnteriores}
          logrosObtenidos={logrosObtenidos}
        />
      )}
    </div>
  )
}
