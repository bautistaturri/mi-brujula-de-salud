const STEPS = [
  {
    num: '01',
    title: 'Check-in semanal',
    body: 'El paciente completa 3 dominios en 2 minutos: conductas ancla, brújula emocional y narrativa interna. Una vez por semana, sin presión.',
  },
  {
    num: '02',
    title: 'Motor ICS',
    body: 'El sistema calcula automáticamente el Índice Compass Semanal: ICS = conductas (50 %) + emocional (30 %) + cognitivo (20 %), y detecta 7 escenarios clínicos de alerta.',
  },
  {
    num: '03',
    title: 'El equipo actúa',
    body: 'El facilitador ve el semáforo de cada paciente, recibe alertas priorizadas y registra intervenciones. Todo en un solo lugar, sin cambiar de herramienta.',
  },
]

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-white py-20 sm:py-24">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">

        <h2 className="text-[1.75rem] sm:text-3xl font-extrabold text-[#0F1C2E] mb-14">
          El flujo es simple
        </h2>

        <div className="grid sm:grid-cols-3 gap-10 sm:gap-8">
          {STEPS.map((step) => (
            <div key={step.num} className="flex flex-col gap-4">
              <span className="font-mono text-4xl font-extrabold text-[#BFDBFE] leading-none select-none">
                {step.num}
              </span>
              <h3 className="text-[17px] font-bold text-[#0F1C2E]">{step.title}</h3>
              <p className="text-[15px] text-[#4B5563] leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
