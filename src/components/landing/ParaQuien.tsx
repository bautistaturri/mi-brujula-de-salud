export default function ParaQuien() {
  return (
    <section id="para-equipos" className="bg-[#F8FAFC] py-20 sm:py-24">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">

        <h2 className="text-[1.75rem] sm:text-3xl font-extrabold text-[#0F1C2E] mb-12">
          Pensado para dos roles
        </h2>

        <div className="grid sm:grid-cols-2 gap-6">

          {/* Card paciente */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#6B7280] mb-2">Paciente</p>
              <h3 className="text-[19px] font-bold text-[#0F1C2E] leading-snug">
                Tu seguimiento, en 2 minutos por semana
              </h3>
            </div>
            <p className="text-[15px] text-[#4B5563] leading-relaxed flex-1">
              Completás tu check-in una vez por semana. Ves tu evolución, tus rachas y tu progreso
              por dominio. Sin juicios, sin presión. El semáforo te muestra dónde estás y hacia
              dónde vas.
            </p>
            <div className="pt-4 border-t border-[#F3F4F6] flex flex-wrap gap-x-5 gap-y-1.5">
              <span className="text-xs text-[#6B7280]">Check-in semanal · 2 min</span>
              <span className="text-xs text-[#6B7280]">Historial visual</span>
              <span className="text-xs text-[#6B7280]">Rachas y logros</span>
            </div>
          </div>

          {/* Card facilitador */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#6B7280] mb-2">Facilitador / Médico</p>
              <h3 className="text-[19px] font-bold text-[#0F1C2E] leading-snug">
                Visibilidad de todo tu grupo en tiempo real
              </h3>
            </div>
            <p className="text-[15px] text-[#4B5563] leading-relaxed flex-1">
              Tenés visibilidad de todo tu grupo en tiempo real. Alertas automáticas cuando un
              paciente necesita atención. Reportes listos para la próxima sesión. Sin tener que
              preguntar cómo estuvo la semana.
            </p>
            <div className="pt-4 border-t border-[#F3F4F6] flex flex-wrap gap-x-5 gap-y-1.5">
              <span className="text-xs text-[#6B7280]">Dashboard grupal</span>
              <span className="text-xs text-[#6B7280]">7 tipos de alerta clínica</span>
              <span className="text-xs text-[#6B7280]">Historial por paciente</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
