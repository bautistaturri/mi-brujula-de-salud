export default function ProblemSolution() {
  return (
    <section className="bg-[#F8FAFC] py-20 sm:py-24">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Columna izquierda — stat grande */}
          <div>
            <p
              className="font-extrabold leading-none tracking-tight text-[#1E3A5F]"
              style={{ fontSize: 'clamp(4rem, 10vw, 6.5rem)' }}
            >
              1 de cada 3
            </p>
            <p className="mt-4 text-[17px] text-[#4B5563] leading-relaxed max-w-[380px]">
              pacientes en riesgo conductual no es detectado a tiempo porque los equipos
              no tienen visibilidad entre sesión y sesión.
            </p>
          </div>

          {/* Columna derecha — párrafos clínicos */}
          <div className="space-y-6">
            <p className="text-[16px] text-[#374151] leading-relaxed">
              Los facilitadores de salud manejan grupos de pacientes con información dispersa,
              sin señales tempranas claras. La distancia entre una consulta y la siguiente puede
              ser la diferencia entre intervenir a tiempo o no.
            </p>
            <p className="text-[16px] text-[#374151] leading-relaxed">
              Mi Brújula de Salud centraliza el seguimiento semanal en un semáforo de tres
              dominios: conductual, emocional y cognitivo. Un número claro, una señal de alerta
              accionable, sin ruido.
            </p>
          </div>

        </div>
      </div>
    </section>
  )
}
