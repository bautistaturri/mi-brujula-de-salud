import Link from 'next/link'

function DashboardMockup() {
  return (
    <svg
      viewBox="0 0 440 342"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-[440px]"
      role="img"
      aria-label="Vista previa del dashboard"
    >
      <defs>
        <filter id="mock-shadow" x="-8%" y="-8%" width="116%" height="116%">
          <feDropShadow dx="0" dy="10" stdDeviation="18" floodColor="#1E3A5F" floodOpacity="0.14"/>
        </filter>
        <clipPath id="mock-clip">
          <rect width="440" height="342" rx="16"/>
        </clipPath>
        <linearGradient id="ics-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1A6B3C"/>
          <stop offset="100%" stopColor="#2A9B5A"/>
        </linearGradient>
      </defs>

      {/* Card frame */}
      <rect width="440" height="342" rx="16" fill="white" filter="url(#mock-shadow)"/>
      <g clipPath="url(#mock-clip)">

        {/* ── Header ── */}
        <rect width="440" height="54" fill="#1E3A5F"/>
        <text x="20" y="21" fontFamily="ui-sans-serif,system-ui,sans-serif" fontSize="9.5" fill="rgba(255,255,255,0.55)" letterSpacing="0.5">Dashboard · Semana actual</text>
        <text x="20" y="39" fontFamily="ui-sans-serif,system-ui,sans-serif" fontSize="13.5" fontWeight="600" fill="white">Lucas Méndez</text>
        {/* Nav dots */}
        <circle cx="400" cy="20" r="3.5" fill="rgba(255,255,255,0.25)"/>
        <circle cx="413" cy="20" r="3.5" fill="rgba(255,255,255,0.25)"/>
        <circle cx="426" cy="20" r="3.5" fill="rgba(255,255,255,0.55)"/>

        {/* ── ICS Hero card ── */}
        <rect x="16" y="66" width="408" height="72" rx="12" fill="url(#ics-grad)"/>
        {/* decoration circle */}
        <circle cx="440" cy="66" r="52" fill="rgba(255,255,255,0.07)"/>
        <text x="32" y="84" fontFamily="ui-sans-serif,system-ui,sans-serif" fontSize="8.5" fontWeight="700" fill="rgba(255,255,255,0.65)" letterSpacing="2">ÍNDICE COMPASS SEMANAL</text>
        <text x="32" y="108" fontFamily="ui-sans-serif,system-ui,sans-serif" fontSize="21" fontWeight="700" fill="white">Zona Verde</text>
        <text x="32" y="126" fontFamily="ui-sans-serif,system-ui,sans-serif" fontSize="10" fill="rgba(255,255,255,0.7)">¡Tus conductas están construyendo el cambio!</text>
        {/* ICS score */}
        <text x="390" y="112" fontFamily="ui-sans-serif,system-ui,sans-serif" fontSize="38" fontWeight="700" fill="white" textAnchor="middle">78</text>
        <text x="390" y="128" fontFamily="ui-sans-serif,system-ui,sans-serif" fontSize="9" fill="rgba(255,255,255,0.6)" textAnchor="middle" letterSpacing="1.5">ICS</text>

        {/* ── Domain cards ── */}
        {/* ICA */}
        <rect x="16"  y="150" width="129" height="66" rx="10" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="1"/>
        <text x="28"  y="168" fontFamily="ui-sans-serif,system-ui,sans-serif" fontSize="8.5" fontWeight="700" fill="#9CA3AF" letterSpacing="1.5">ICA</text>
        <text x="28"  y="191" fontFamily="ui-sans-serif,system-ui,sans-serif" fontSize="20" fontWeight="700" fill="#2563EB">82</text>
        <text x="58"  y="191" fontFamily="ui-sans-serif,system-ui,sans-serif" fontSize="10"  fill="#9CA3AF">%</text>
        <rect x="28"  y="202" width="98"  height="3.5" rx="2" fill="#E5E7EB"/>
        <rect x="28"  y="202" width="80"  height="3.5" rx="2" fill="#2563EB"/>
        {/* BE */}
        <rect x="156" y="150" width="129" height="66" rx="10" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="1"/>
        <text x="168" y="168" fontFamily="ui-sans-serif,system-ui,sans-serif" fontSize="8.5" fontWeight="700" fill="#9CA3AF" letterSpacing="1.5">BE</text>
        <text x="168" y="191" fontFamily="ui-sans-serif,system-ui,sans-serif" fontSize="20" fontWeight="700" fill="#2A7B6F">71</text>
        <text x="198" y="191" fontFamily="ui-sans-serif,system-ui,sans-serif" fontSize="10"  fill="#9CA3AF">%</text>
        <rect x="168" y="202" width="98"  height="3.5" rx="2" fill="#E5E7EB"/>
        <rect x="168" y="202" width="70"  height="3.5" rx="2" fill="#2A7B6F"/>
        {/* INI */}
        <rect x="296" y="150" width="128" height="66" rx="10" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="1"/>
        <text x="308" y="168" fontFamily="ui-sans-serif,system-ui,sans-serif" fontSize="8.5" fontWeight="700" fill="#9CA3AF" letterSpacing="1.5">INI</text>
        <text x="308" y="191" fontFamily="ui-sans-serif,system-ui,sans-serif" fontSize="20" fontWeight="700" fill="#7C3AED">68</text>
        <text x="338" y="191" fontFamily="ui-sans-serif,system-ui,sans-serif" fontSize="10"  fill="#9CA3AF">%</text>
        <rect x="308" y="202" width="98"  height="3.5" rx="2" fill="#E5E7EB"/>
        <rect x="308" y="202" width="66"  height="3.5" rx="2" fill="#7C3AED"/>

        {/* ── Alert clínica ── */}
        <rect x="16" y="228" width="408" height="48" rx="10" fill="#FEF2F2" stroke="#FECACA" strokeWidth="1"/>
        <rect x="28" y="240" width="4"   height="24" rx="2" fill="#EF4444"/>
        <text x="44" y="249" fontFamily="ui-sans-serif,system-ui,sans-serif" fontSize="10" fontWeight="700" fill="#991B1B">Alerta clínica</text>
        <text x="44" y="265" fontFamily="ui-sans-serif,system-ui,sans-serif" fontSize="9.5"  fill="#6B7280">Analía R. — sin check-in por 2 semanas</text>
        <rect x="376" y="242" width="36" height="18" rx="4" fill="#FEE2E2"/>
        <text x="394" y="254" fontFamily="ui-sans-serif,system-ui,sans-serif" fontSize="8.5" fontWeight="700" fill="#DC2626" textAnchor="middle">urgente</text>

        {/* ── Check-in completado ── */}
        <rect x="16" y="288" width="408" height="38" rx="10" fill="#F0FDF4" stroke="#BBF7D0" strokeWidth="1"/>
        <circle cx="38" cy="307" r="9" fill="#22C55E"/>
        <text x="38" y="311.5" fontFamily="ui-sans-serif,system-ui,sans-serif" fontSize="10" fontWeight="700" fill="white" textAnchor="middle">✓</text>
        <text x="56" y="303" fontFamily="ui-sans-serif,system-ui,sans-serif" fontSize="10" fontWeight="600" fill="#166534">Check-in completado · Lucas M.</text>
        <text x="56" y="318" fontFamily="ui-sans-serif,system-ui,sans-serif" fontSize="9"   fill="#4ADE80">ICS 78 · Zona Verde · hace 2 días</text>

      </g>
    </svg>
  )
}

export default function Hero() {
  return (
    <section className="pt-16 bg-white" id="producto">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-[58fr_42fr] gap-14 lg:gap-20 items-center">

          {/* ── Columna izquierda ── */}
          <div className="space-y-7">

            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 border border-[#BFDBFE] bg-[#EFF6FF] text-[#1E40AF] text-xs font-semibold px-3.5 py-1.5 rounded-full tracking-wide uppercase">
              Acceso anticipado · Primeros equipos
            </div>

            {/* H1 */}
            <h1 className="text-[2.4rem] sm:text-5xl font-extrabold text-[#0F1C2E] leading-[1.12] tracking-tight max-w-[560px]">
              Seguimiento conductual semanal para equipos de salud
            </h1>

            {/* Descripción */}
            <p className="text-[17px] text-[#4B5563] leading-relaxed max-w-[500px]">
              Herramienta de monitoreo para facilitadores y médicos que trabajan con pacientes en programas de salud conductual.
              Sin dashboards vacíos, sin datos que no se usan.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#acceso"
                className="inline-flex items-center gap-2 bg-[#1E3A5F] hover:bg-[#162d4a] text-white font-semibold px-6 py-3.5 rounded-xl transition-colors text-[15px]"
              >
                Solicitar acceso anticipado
              </a>
              <a
                href="#como-funciona"
                className="inline-flex items-center gap-2 border border-[#D1D5DB] hover:border-[#9CA3AF] text-[#374151] font-semibold px-6 py-3.5 rounded-xl transition-colors text-[15px]"
              >
                Ver cómo funciona →
              </a>
            </div>

            {/* Credenciales */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 border-t border-[#F3F4F6]">
              <span className="text-xs text-[#6B7280]">🔒 Datos cifrados</span>
              <span className="text-xs text-[#6B7280]">🇦🇷 Desarrollado en Argentina</span>
              <span className="text-xs text-[#6B7280]">📋 Pensado con profesionales de salud</span>
            </div>
          </div>

          {/* ── Columna derecha — mockup ── */}
          <div className="flex justify-center lg:justify-end">
            <DashboardMockup />
          </div>

        </div>
      </div>
    </section>
  )
}
