import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavPaciente from '@/components/patient/NavPaciente'

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('nombre, role, avatar_url, onboarding_clinico_completado')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'facilitador') redirect('/dashboard')

  // Si el cuestionario clínico no fue completado, redirigir al paso clínico
  if (profile && profile.onboarding_clinico_completado === false) {
    redirect('/onboarding-clinico')
  }

  return (
    // DESIGN: Layout móvil paciente con fondo base y nav fija
    <div className="min-h-screen bg-surface-base">
      <main className="max-w-lg mx-auto pb-24">
        {children}
      </main>
      <NavPaciente nombre={profile?.nombre ?? ''} />
    </div>
  )
}
