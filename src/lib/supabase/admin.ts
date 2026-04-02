// 🚨 SECURITY: server-only — este módulo NUNCA debe importarse en Client Components.
// El import de 'server-only' lanza un error de build si se intenta usar en el cliente.
import 'server-only'

import { createClient } from '@supabase/supabase-js'

// Lazy initialization: el cliente se crea en el primer uso (request time),
// no al importar el módulo (build time). Evita errores de build cuando
// SUPABASE_SERVICE_ROLE_KEY no está disponible en el contexto de análisis estático.
let _client: ReturnType<typeof createClient> | null = null

export function getSupabaseAdmin() {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Missing Supabase admin credentials')
    _client = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return _client
}
