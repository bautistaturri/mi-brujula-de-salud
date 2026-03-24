export default function Testimonials() {
  return (
    <section className="py-20 sm:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">
            Testimonios
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Lo que dicen los profesionales de salud
          </h2>
          <p className="text-lg text-gray-500">
            Próximamente compartiremos experiencias de los equipos que usan Mi Brújula de Salud.
          </p>
        </div>

        {/* Placeholder */}
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
          <div className="text-4xl mb-4">💬</div>
          <p className="text-gray-400 font-medium">
            Las historias de nuestros usuarios aparecerán aquí.
          </p>
          <p className="text-gray-400 text-sm mt-1">
            ¿Sos profesional de salud y querés compartir tu experiencia?{' '}
            <a href="mailto:hola@mibrujuladesalud.com" className="text-blue-600 hover:underline">
              Contactanos
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}
