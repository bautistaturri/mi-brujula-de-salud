// Server-only: usa cookies() de Next.js — no importar en Client Components.
// Variables: NEXT_PUBLIC_SUPABASE_URL (pública), NEXT_PUBLIC_SUPABASE_ANON_KEY (pública).
// Las políticas RLS de Supabase protegen los datos según el usuario autenticado.
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — las cookies se manejan en middleware
          }
        },
      },
    }
  )
}
