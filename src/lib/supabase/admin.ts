import { createClient } from '@supabase/supabase-js'

// Cliente con service_role — solo usar en el servidor, nunca en el cliente
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
