const steps = [
  {
    number: '01',
    icon: '🧭',
    title: 'Registrate',
    description:
      'Creá tu cuenta en minutos. Los pacientes completan su perfil guiado por un onboarding simple.',
  },
  {
    number: '02',
    icon: '✅',
    title: 'Seguimiento diario',
    description:
      'Cada día, el paciente registra su estado en 2 minutos. El sistema calcula su semáforo automáticamente.',
  },
  {
    number: '03',
    icon: '⚡',
    title: 'Acción inmediata',
    description:
      'El facilitador recibe alertas cuando un paciente necesita atención. Intervención a tiempo, mejores resultados.',
  },
]

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="py-20 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">
            Cómo funciona
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Empezar es simple
          </h2>
          <p className="text-lg text-gray-500">
            Tres pasos para transformar cómo seguís la salud de tus pacientes.
          </p>
        </div>

        {/* Steps — desktop: horizontal with line, mobile: vertical */}
        <div className="relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden lg:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-100 via-blue-300 to-blue-100 mx-40" />

          <div className="grid lg:grid-cols-3 gap-10 lg:gap-8">
            {steps.map((step, idx) => (
              <div key={step.number} className="flex lg:flex-col items-start lg:items-center gap-6 lg:gap-0 lg:text-center relative">
                {/* Vertical connector line (mobile only) */}
                {idx < steps.length - 1 && (
                  <div className="lg:hidden absolute left-6 top-16 w-0.5 h-[calc(100%+2.5rem)] bg-blue-100" />
                )}

                {/* Number circle */}
                <div className="shrink-0 lg:mb-6 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold text-sm shadow-lg shadow-blue-200">
                    {step.number}
                  </div>
                </div>

                {/* Content */}
                <div className="lg:px-4">
                  {/* Icon */}
                  <div className="text-3xl mb-2 hidden lg:block">{step.icon}</div>
                  <div className="flex lg:justify-center items-center gap-2 mb-2">
                    <span className="lg:hidden text-2xl">{step.icon}</span>
                    <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                  </div>
                  <p className="text-gray-500 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA hint */}
        <div className="text-center mt-16">
          <a
            href="/register"
            className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
          >
            Empezá gratis en menos de 10 minutos
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}
