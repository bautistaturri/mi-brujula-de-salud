import Link from 'next/link'

function AppMockup() {
  return (
    <div className="relative flex justify-center items-center">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-blue-400/20 rounded-3xl blur-3xl" />

      {/* Phone frame */}
      <div className="relative w-64 sm:w-72 bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl border border-gray-700">
        {/* Screen */}
        <div className="bg-gray-50 rounded-[2rem] overflow-hidden">
          {/* Status bar */}
          <div className="bg-blue-600 px-4 py-2 flex items-center justify-between">
            <span className="text-white text-xs font-semibold">Mi Brújula</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-white/30" />
              <div className="w-3 h-3 rounded-full bg-white/30" />
              <div className="w-3 h-3 rounded-full bg-white" />
            </div>
          </div>

          {/* App content */}
          <div className="p-4 space-y-3">
            {/* Greeting */}
            <div>
              <p className="text-xs text-gray-500">Buenos días, Marcos 👋</p>
              <p className="text-sm font-bold text-gray-900">¿Cómo estás hoy?</p>
            </div>

            {/* Semáforo */}
            <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Estado hoy</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-700">Semáforo verde</p>
                  <p className="text-xs text-gray-500">Todo en orden</p>
                </div>
              </div>
            </div>

            {/* IEM score */}
            <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs text-gray-500">IEM hoy</p>
                <span className="text-xs font-bold text-blue-600">6/7</span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div
                    key={i}
                    className={`flex-1 h-2 rounded-full ${i <= 6 ? 'bg-blue-500' : 'bg-gray-200'}`}
                  />
                ))}
              </div>
            </div>

            {/* Conductas */}
            <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs text-gray-500">Conductas ancla</p>
                <span className="text-xs font-bold text-emerald-600">4/5</span>
              </div>
              <div className="space-y-1.5">
                {['Ejercicio', 'Meditación', 'Hidratación', 'Descanso'].map((c, i) => (
                  <div key={c} className="flex items-center gap-2">
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${i < 4 ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                      {i < 4 && (
                        <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </div>
                    <span className="text-xs text-gray-600">{c}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Streak */}
            <div className="bg-blue-50 rounded-2xl p-3 border border-blue-100">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔥</span>
                <div>
                  <p className="text-xs font-bold text-blue-800">12 días de racha</p>
                  <p className="text-xs text-blue-600">¡Seguí así!</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Home indicator */}
        <div className="flex justify-center py-1.5">
          <div className="w-24 h-1 bg-gray-600 rounded-full" />
        </div>
      </div>

      {/* Floating notification card */}
      <div className="absolute -right-4 top-12 bg-white rounded-xl shadow-lg border border-gray-100 p-3 w-44">
        <div className="flex items-start gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <span className="text-sm">📊</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-800">Análisis listo</p>
            <p className="text-xs text-gray-500 mt-0.5">3 pacientes con alerta</p>
          </div>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -left-4 bottom-16 bg-emerald-500 rounded-xl shadow-lg p-3 w-36">
        <div className="flex items-center gap-2">
          <span className="text-lg">✅</span>
          <div>
            <p className="text-xs font-bold text-white">95% adherencia</p>
            <p className="text-xs text-emerald-100">esta semana</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden bg-white">
      {/* Background gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-blue-50 via-blue-50/50 to-transparent" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-emerald-100/40 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Text content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full">
              <span>🏥</span>
              <span>Plataforma de salud digital</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight">
              Tu salud conductual,{' '}
              <span className="text-blue-600">siempre en el rumbo correcto</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-xl">
              Monitoreo diario inteligente para pacientes y equipos de salud. Detecta señales de
              alerta, fortalece hábitos y mejora resultados clínicos.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-blue-200 text-base"
              >
                Comenzar gratis
                <span>→</span>
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex items-center gap-2 border-2 border-gray-200 hover:border-blue-300 text-gray-700 font-semibold px-6 py-3 rounded-xl transition-colors text-base"
              >
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Ver demo
              </a>
            </div>

            {/* Propuesta de valor */}
            <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-green-500">✓</span>
                <span>Check-in diario en menos de 2 minutos</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-green-500">✓</span>
                <span>Alertas automáticas en tiempo real</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-green-500">✓</span>
                <span>Sin instalación — funciona desde el celular</span>
              </div>
            </div>
          </div>

          {/* Right: App mockup */}
          <div className="flex justify-center lg:justify-end">
            <AppMockup />
          </div>
        </div>
      </div>
    </section>
  )
}
