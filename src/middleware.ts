import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rutas exclusivas por rol (defense-in-depth — la autorización real la aplican
// los layouts con DB query y las políticas RLS de Supabase)
const PATIENT_ONLY_PATHS     = ['/inicio', '/checkin', '/historial', '/logros', '/registro-semanal', '/registro-diario', '/avances', '/perfil', '/gimnasio', '/feedback']
const FACILITADOR_ONLY_PATHS = ['/dashboard']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() valida el JWT contra Supabase Auth — no confiar solo en la cookie sin verificar
  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Rutas públicas (auth)
  const publicRoutes = ['/login', '/register', '/onboarding']
  const isPublicRoute = pathname === '/' || publicRoutes.some(r => pathname.startsWith(r))

  // ── Sin sesión → login ──────────────────────────────────────────────────────
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // ── Con sesión ──────────────────────────────────────────────────────────────
  if (user) {
    // El role en user_metadata viene del JWT firmado por Supabase (establecido en signUp).
    // Se usa aquí para redirects rápidos de UX sin extra DB query.
    // NOTA: no es el control de seguridad final — los layouts y RLS son la barrera real.
    const role = (user.user_metadata?.role as string | undefined) ?? 'paciente'

    const isPatientOnlyPath     = PATIENT_ONLY_PATHS.some(p => pathname.startsWith(p))
    const isFacilitadorOnlyPath = FACILITADOR_ONLY_PATHS.some(p => pathname.startsWith(p))

    // 🚨 SECURITY: bloquear acceso cruzado de roles
    if (isFacilitadorOnlyPath && role !== 'facilitador') {
      const url = request.nextUrl.clone()
      url.pathname = '/inicio'
      return NextResponse.redirect(url)
    }
    if (isPatientOnlyPath && role === 'facilitador') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // Con sesión en rutas de auth → verificar onboarding y redirigir
    if (isPublicRoute && pathname !== '/') {
      const { data: profile } = await supabase
        .from('users')
        .select('role, onboarding_completado')
        .eq('id', user.id)
        .single()

      if (profile) {
        if (!profile.onboarding_completado && !pathname.startsWith('/onboarding')) {
          const url = request.nextUrl.clone()
          url.pathname = '/onboarding'
          return NextResponse.redirect(url)
        }
        if (profile.onboarding_completado) {
          const url = request.nextUrl.clone()
          url.pathname = profile.role === 'facilitador' ? '/dashboard' : '/inicio'
          return NextResponse.redirect(url)
        }
        // Onboarding pendiente y está en /onboarding → dejar pasar
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
