const features = [
  {
    icon: '📊',
    color: 'bg-blue-100',
    title: 'Monitoreo diario',
    description:
      'Registro de bienestar en menos de 2 minutos con IEM, emoción y conductas ancla.',
  },
  {
    icon: '🚨',
    color: 'bg-red-100',
    title: 'Alertas inteligentes',
    description:
      'Detección automática de señales de riesgo con notificaciones al equipo tratante.',
  },
  {
    icon: '🗂️',
    color: 'bg-purple-100',
    title: 'Dashboard clínico',
    description:
      'Vista unificada de todos tus pacientes ordenados por nivel de riesgo.',
  },
  {
    icon: '📈',
    color: 'bg-emerald-100',
    title: 'Historial conductual',
    description:
      'Gráficos de evolución y tendencias para informar decisiones clínicas.',
  },
  {
    icon: '🔢',
    color: 'bg-amber-100',
    title: 'Score de riesgo',
    description:
      'Algoritmo de scoring automático que prioriza qué pacientes requieren atención urgente.',
  },
  {
    icon: '📋',
    color: 'bg-indigo-100',
    title: 'Reportes',
    description:
      'Exportación de datos para historias clínicas y auditorías.',
  },
]

export default function Features() {
  return (
    <section id="funcionalidades" className="py-20 sm:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">
            Funcionalidades
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Todo lo que necesitás para un seguimiento clínico efectivo
          </h2>
          <p className="text-lg text-gray-500">
            Herramientas diseñadas junto a profesionales de salud para potenciar el trabajo clínico.
          </p>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-blue-100 hover:-translate-y-0.5 transition-all duration-200 group"
            >
              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}
              >
                <span className="text-2xl">{feature.icon}</span>
              </div>
              {/* Content */}
              <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-500 leading-relaxed text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
