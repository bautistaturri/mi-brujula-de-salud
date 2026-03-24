import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavPaciente from '@/components/patient/NavPaciente'

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('nombre, role, avatar_url')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'facilitador') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-lg mx-auto px-4 pt-2">
        <div className="text-xs text-slate-400 text-right">
          {user.email}
        </div>
      </div>
      <main className="max-w-lg mx-auto pb-24">
        {children}
      </main>
      <NavPaciente nombre={profile?.nombre ?? ''} />
    </div>
  )
}
