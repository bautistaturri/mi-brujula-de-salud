import Link from 'next/link'

function CompassLogoSmall() {
  return (
    <svg width="22" height="22" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="19" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
      <circle cx="20" cy="20" r="2.5" fill="white"/>
      <path d="M20 10L22 18L20 20L18 18Z" fill="white"/>
      <path d="M20 30L18 22L20 20L22 22Z" fill="rgba(255,255,255,0.4)"/>
      <path d="M10 20L18 18L20 20L18 22Z" fill="rgba(255,255,255,0.4)"/>
      <path d="M30 20L22 22L20 20L22 18Z" fill="rgba(255,255,255,0.6)"/>
    </svg>
  )
}

export default function Footer() {
  return (
    <footer className="bg-[#0F1C2E] py-8">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">

        <Link href="/" className="flex items-center gap-2 text-white font-semibold text-sm">
          <CompassLogoSmall />
          Mi Brújula de Salud © 2026
        </Link>

        <nav className="flex items-center gap-5 text-xs text-[#64748B]">
          <Link href="/privacidad" className="hover:text-[#94A3B8] transition-colors">Privacidad</Link>
          <Link href="/terminos"   className="hover:text-[#94A3B8] transition-colors">Términos</Link>
          <a
            href="mailto:hola@mibrujulasalud.com"
            className="hover:text-[#94A3B8] transition-colors"
          >
            hola@mibrujulasalud.com
          </a>
        </nav>

      </div>
    </footer>
  )
}
