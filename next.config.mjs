/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === 'development'

// Server Actions: solo orígenes conocidos pueden disparar actions
const allowedOrigins = [
  'localhost:3000',
  process.env.NEXT_PUBLIC_APP_URL,
].filter(Boolean)

// Security headers aplicados a todas las respuestas
const securityHeaders = [
  // Evita que el navegador cambie el Content-Type declarado
  { key: 'X-Content-Type-Options',   value: 'nosniff' },
  // Bloquea clickjacking — la app nunca debe cargarse en un iframe externo
  { key: 'X-Frame-Options',          value: 'DENY' },
  // Fuerza HTTPS por 1 año (solo producción; en dev rompe localhost)
  ...(!isDev
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]
    : []),
  // Política de Referrer: no filtra path en cross-origin
  { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
  // Deshabilita APIs de hardware que la app no usa
  { key: 'Permissions-Policy',       value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // CSP: permisiva pero cubre los vectores más críticos.
  // 'unsafe-inline' es requerido por Next.js (hydration) y los estilos inline del código.
  // 'unsafe-eval' solo en dev (next-dev usa eval internamente).
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.supabase.co",
      `connect-src 'self' https://*.supabase.co wss://*.supabase.co${isDev ? ' ws://localhost:*' : ''}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
]

const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins,
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
