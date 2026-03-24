import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LandingPage from '@/components/landing/LandingPage'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <LandingPage />
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, onboarding_completado')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'facilitador') redirect('/dashboard')
  if (profile && !profile.onboarding_completado) redirect('/onboarding')

  redirect('/inicio')
}
