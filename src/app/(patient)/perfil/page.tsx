import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PerfilPacienteClient from '@/components/patient/PerfilPacienteClient'
import type { User } from '@/types/database'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (!profile) redirect('/login')

  return <PerfilPacienteClient user={profile as User} />
}
