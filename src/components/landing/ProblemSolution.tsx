const problems = [
  'Los profesionales no saben el estado real de sus pacientes entre consultas',
  'Las crisis no se detectan a tiempo',
  'El paciente pierde motivación sin seguimiento continuo',
]

const solutions = [
  'Check-in diario en 2 minutos con semáforo de estado',
  'Alertas automáticas cuando un paciente necesita atención',
  'Racha de días y conductas ancla para sostener hábitos',
]

export default function ProblemSolution() {
  return (
    <section className="py-20 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section label */}
        <p className="text-center text-sm font-semibold text-gray-400 uppercase tracking-widest mb-12">
          Por qué existe Mi Brújula de Salud
        </p>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Problem */}
          <div className="bg-red-50 border border-red-100 rounded-3xl p-8 lg:p-10">
            <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 text-xs font-bold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wide">
              <span>⚠️</span>
              <span>El problema</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 leading-snug">
              El seguimiento de pacientes es manual, tardío y fragmentado
            </h3>
            <ul className="space-y-4">
              {problems.map((problem) => (
                <li key={problem} className="flex items-start gap-3">
                  <span className="text-lg shrink-0 mt-0.5">❌</span>
                  <p className="text-gray-700 leading-relaxed">{problem}</p>
                </li>
              ))}
            </ul>

            {/* Decorative element */}
            <div className="mt-8 pt-6 border-t border-red-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-red-700">
                  Sin herramientas, los equipos pierden visibilidad crítica
                </p>
              </div>
            </div>
          </div>

          {/* Solution */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 lg:p-10">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wide">
              <span>💡</span>
              <span>La solución</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 leading-snug">
              Mi Brújula de Salud: seguimiento continuo, automático e inteligente
            </h3>
            <ul className="space-y-4">
              {solutions.map((solution) => (
                <li key={solution} className="flex items-start gap-3">
                  <span className="text-lg shrink-0 mt-0.5">✅</span>
                  <p className="text-gray-700 leading-relaxed">{solution}</p>
                </li>
              ))}
            </ul>

            {/* Decorative element */}
            <div className="mt-8 pt-6 border-t border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-emerald-700">
                  Mejores resultados con menos esfuerzo del equipo
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
