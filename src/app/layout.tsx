import type { Metadata, Viewport } from 'next'
import { Inter, Plus_Jakarta_Sans, DM_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/ThemeProvider'
import './globals.css'

// DESIGN: Tipografía del sistema de diseño
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-metric',
  weight: ['400', '500'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Mi Brújula de Salud',
  description: 'Tu compañero diario de bienestar y salud',
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico' },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Brújula Salud',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2563EB',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${plusJakarta.variable} ${dmMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
