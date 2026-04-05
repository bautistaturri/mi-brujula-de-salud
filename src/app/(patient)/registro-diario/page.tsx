import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RegistroDiarioForm from '@/components/patient/RegistroDiarioForm'

export default async function RegistroDiarioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fecha de hoy en formato YYYY-MM-DD (zona horaria del servidor)
  const fechaHoy = new Date().toISOString().split('T')[0]

  const [profileRes, conductasRes, registroHoyRes] = await Promise.all([
    supabase
      .from('users')
      .select('nombre')
      .eq('id', user.id)
      .single(),

    supabase
      .from('conductas_ancla')
      .select('id, nombre, icono, orden')
      .eq('user_id', user.id)
      .eq('activa', true)
      .order('orden')
      .limit(5),

    supabase
      .from('registros_diarios')
      .select('id')
      .eq('paciente_id', user.id)
      .eq('fecha', fechaHoy)
      .single(),
  ])

  if (profileRes.error) redirect('/login')

  // Si no tiene conductas configuradas, no puede registrar
  if (!conductasRes.data || conductasRes.data.length === 0) {
    redirect('/onboarding')
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#E5E7EB] px-5 py-4 flex items-center gap-3">
        <a href="/inicio" className="text-[#6B7280] hover:text-[#1F2937]">←</a>
        <div>
          <h1 className="text-base font-bold text-[#1A1A2E]">Registro del día</h1>
          <p className="text-xs text-[#9CA3AF]">
            {new Date(fechaHoy + 'T00:00:00').toLocaleDateString('es-AR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>
      </div>

      <RegistroDiarioForm
        userId={user.id}
        nombre={profileRes.data.nombre ?? ''}
        conductas={conductasRes.data}
        fechaHoy={fechaHoy}
        yaRegistrado={!!registroHoyRes.data}
      />
    </div>
  )
}
