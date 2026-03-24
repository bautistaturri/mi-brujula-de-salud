import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Rutas públicas (auth)
  const publicRoutes = ['/login', '/register', '/onboarding']
  const isPublicRoute = pathname === '/' || publicRoutes.some(r => pathname.startsWith(r))

  // Sin sesión → login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Con sesión en rutas de auth → redirigir según rol
  if (user && isPublicRoute && pathname !== '/') {
    const { data: profile } = await supabase
      .from('users')
      .select('role, onboarding_completado')
      .eq('id', user.id)
      .single()

    if (profile) {
      if (!profile.onboarding_completado && !pathname.startsWith('/onboarding')) {
        // Onboarding pendiente y no está en /onboarding → mandarlo ahí
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding'
        return NextResponse.redirect(url)
      }
      if (profile.onboarding_completado) {
        // Ya completó el onboarding (incluso si intenta volver a /onboarding) → ir a la app
        const url = request.nextUrl.clone()
        url.pathname = profile.role === 'facilitador' ? '/dashboard' : '/inicio'
        return NextResponse.redirect(url)
      }
      // Onboarding pendiente y está en /onboarding → dejar pasar
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
