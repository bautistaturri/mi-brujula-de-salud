import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Ruta que Supabase usa como redirectTo tras el magic link de recovery.
// Intercambia el `code` PKCE por una sesión y redirige al `next` param.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Validar que `next` sea una ruta relativa (previene open redirect)
  const rawNext = searchParams.get('next') ?? '/login'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/login'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Código inválido o expirado → login con mensaje de error
  return NextResponse.redirect(`${origin}/login?error=link_invalido`)
}
