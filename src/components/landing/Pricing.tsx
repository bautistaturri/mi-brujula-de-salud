'use client'

import { useState } from 'react'
import Link from 'next/link'

const plans = [
  {
    name: 'Gratuito',
    price: { monthly: '$0', annual: '$0' },
    period: '/mes',
    description: 'Para profesionales independientes',
    highlight: false,
    badge: null,
    features: [
      'Hasta 5 pacientes',
      'Check-in diario',
      'Semáforo básico',
      'Dashboard simple',
      'Soporte por email',
    ],
    cta: 'Comenzar gratis',
    ctaHref: '/register',
    ctaVariant: 'outline' as const,
  },
  {
    name: 'Pro',
    price: { monthly: '$29 USD', annual: '$23 USD' },
    period: '/mes',
    description: 'Para equipos de salud',
    highlight: true,
    badge: 'Más popular',
    features: [
      'Pacientes ilimitados',
      'Todo lo del plan Gratuito',
      'Alertas automáticas',
      'Score de riesgo',
      'Historial completo',
      'Grupos de pacientes',
      'Reportes exportables',
      'Soporte prioritario',
    ],
    cta: 'Comenzar prueba de 14 días',
    ctaHref: '/register',
    ctaVariant: 'primary' as const,
  },
  {
    name: 'Organización',
    price: { monthly: 'A consultar', annual: 'A consultar' },
    period: '',
    description: 'Para instituciones de salud',
    highlight: false,
    badge: null,
    features: [
      'Todo lo del plan Pro',
      'Múltiples facilitadores',
      'Integración con HIS',
      'API access',
      'Capacitación del equipo',
      'SLA garantizado',
      'Facturación institucional',
    ],
    cta: 'Contactar ventas',
    ctaHref: '/contacto',
    ctaVariant: 'outline' as const,
  },
]

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

export default function Pricing() {
  const [annual, setAnnual] = useState(false)

  return (
    <section id="precios" className="py-20 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">
            Precios
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Planes para cada equipo
          </h2>
          <p className="text-lg text-gray-500 mb-8">
            Empezá gratis y escalá cuando lo necesites. Sin sorpresas.
          </p>

          {/* Toggle mensual/anual */}
          <div className="inline-flex items-center gap-3 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                !annual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                annual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Anual
              <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-1.5 py-0.5 rounded-md">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-3xl p-7 lg:p-8 ${
                plan.highlight
                  ? 'bg-blue-600 text-white border-2 border-blue-600 shadow-2xl shadow-blue-200 scale-[1.02]'
                  : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-shadow'
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-amber-400 text-amber-900 text-xs font-extrabold px-4 py-1.5 rounded-full shadow-md whitespace-nowrap">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan name & description */}
              <div className="mb-6">
                <h3 className={`text-xl font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm ${plan.highlight ? 'text-blue-200' : 'text-gray-500'}`}>
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-8">
                <div className="flex items-end gap-1">
                  <span className={`text-4xl font-extrabold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                    {annual ? plan.price.annual : plan.price.monthly}
                  </span>
                  {plan.period && (
                    <span className={`text-sm mb-1 ${plan.highlight ? 'text-blue-200' : 'text-gray-500'}`}>
                      {plan.period}
                    </span>
                  )}
                </div>
                {annual && plan.name === 'Pro' && (
                  <p className={`text-xs mt-1 ${plan.highlight ? 'text-blue-200' : 'text-gray-400'}`}>
                    Facturado anualmente
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    {plan.highlight ? (
                      <svg className="w-4 h-4 text-emerald-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      <CheckIcon />
                    )}
                    <span className={`text-sm ${plan.highlight ? 'text-blue-100' : 'text-gray-600'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={plan.ctaHref}
                className={`block text-center font-semibold py-3 px-6 rounded-xl transition-all text-sm ${
                  plan.highlight
                    ? 'bg-white text-blue-600 hover:bg-blue-50 shadow-lg'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Footnote */}
        <p className="text-center text-sm text-gray-400 mt-10">
          Todos los planes incluyen SSL, backups diarios y cumplimiento de normativas de privacidad de datos de salud.
        </p>
      </div>
    </section>
  )
}
