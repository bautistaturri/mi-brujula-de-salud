import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FeedbackClient from '@/components/patient/FeedbackClient'

export default async function FeedbackPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <FeedbackClient userId={user.id} />
}
