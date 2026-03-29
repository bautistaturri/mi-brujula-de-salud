'use client'

// Client-only: solo usar en Client Components ('use client').
// Variables: NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY son públicas por diseño.
// Las políticas RLS de Supabase protegen los datos — nunca confiar solo en el cliente.
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
