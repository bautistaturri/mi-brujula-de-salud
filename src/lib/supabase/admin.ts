// 🚨 SECURITY: server-only — este módulo NUNCA debe importarse en Client Components.
// El import de 'server-only' lanza un error de build si se intenta usar en el cliente.
import 'server-only'

import { createClient } from '@supabase/supabase-js'

// SUPABASE_SERVICE_ROLE_KEY: variable server-only (sin prefijo NEXT_PUBLIC_).
// Nunca se expone al cliente. Bypasa RLS — usar con extremo cuidado.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
