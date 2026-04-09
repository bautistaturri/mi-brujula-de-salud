'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface DatosClinicosForm {
  peso_inicial: string
  altura: string
  toma_medicacion: boolean | null
  detalle_medicacion: string
  antec_tabaquismo: boolean
  antec_alcohol: boolean
  antec_otras_sustancias: boolean
  antec_cirugia: boolean
  antec_cancer: boolean
  antec_tiroides: boolean
  antec_otros: string
}

function ToggleSiNo({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean | null
  onChange: (v: boolean | null) => void
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#E5E7EB] last:border-0">
      <span className="text-sm text-[#1F2937]">{label}</span>
      <div className="flex gap-1.5">
        {([true, false] as const).map(v => (
          <button
            key={String(v)}
            type="button"
            onClick={() => onChange(value === v ? null : v)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
              value === v
                ? v
                  ? 'bg-[#2C4A6E] text-white border-[#2C4A6E]'
                  : 'bg-[#F3F4F6] text-[#6B7280] border-[#D1D5DB]'
                : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#2A7B6F]'
            }`}
          >
            {v ? 'Sí' : 'No'}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function OnboardingClinicoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [clinico, setClin] = useState<DatosClinicosForm>({
    peso_inicial: '',
    altura: '',
    toma_medicacion: null,
    detalle_medicacion: '',
    antec_tabaquismo: false,
    antec_alcohol: false,
    antec_otras_sustancias: false,
    antec_cirugia: false,
    antec_cancer: false,
    antec_tiroides: false,
    antec_otros: '',
  })

  async function guardar(skip = false) {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    if (!skip) {
      const updates: Record<string, unknown> = {
        onboarding_clinico_completado: true,
      }
      if (clinico.peso_inicial)    updates.peso_inicial = parseFloat(clinico.peso_inicial)
      if (clinico.altura)          updates.altura = parseInt(clinico.altura)
      if (clinico.toma_medicacion !== null) {
        updates.toma_medicacion = clinico.toma_medicacion
        if (clinico.toma_medicacion && clinico.detalle_medicacion.trim()) {
          updates.detalle_medicacion = clinico.detalle_medicacion.trim()
        }
      }
      updates.antec_tabaquismo       = clinico.antec_tabaquismo
      updates.antec_alcohol          = clinico.antec_alcohol
      updates.antec_otras_sustancias = clinico.antec_otras_sustancias
      updates.antec_cirugia          = clinico.antec_cirugia
      updates.antec_cancer           = clinico.antec_cancer
      updates.antec_tiroides         = clinico.antec_tiroides
      if (clinico.antec_otros.trim()) updates.antec_otros = clinico.antec_otros.trim()

      await supabase.from('users').update(updates).eq('id', user.id)

      if (clinico.toma_medicacion === false) {
        await supabase
          .from('conductas_ancla')
          .update({ activa: false })
          .eq('user_id', user.id)
          .ilike('nombre', '%medicac%')
      }
    } else {
      await supabase
        .from('users')
        .update({ onboarding_clinico_completado: true })
        .eq('id', user.id)
    }

    router.push('/inicio')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-start justify-center p-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2">
            <span className="text-2xl">🧭</span>
            <span className="font-bold text-[#1A1A2E] text-lg">Mi Brújula de Salud</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="font-bold text-[#1A1A2E] text-lg mb-1">Un poco sobre vos 📋</h2>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Esta información nos ayuda a personalizar tu experiencia. Todos los campos son opcionales.
            </p>
          </div>

          {/* Datos físicos */}
          <div className="mb-5">
            <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-3">Datos físicos</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#6B7280] mb-1 block">Peso (kg)</label>
                <input
                  type="number"
                  min="30" max="300" step="0.1"
                  value={clinico.peso_inicial}
                  onChange={e => setClin(c => ({ ...c, peso_inicial: e.target.value }))}
                  placeholder="Ej: 70"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#2A7B6F]/30 focus:border-[#2A7B6F]"
                />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] mb-1 block">Altura (cm)</label>
                <input
                  type="number"
                  min="100" max="250"
                  value={clinico.altura}
                  onChange={e => setClin(c => ({ ...c, altura: e.target.value }))}
                  placeholder="Ej: 168"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#2A7B6F]/30 focus:border-[#2A7B6F]"
                />
              </div>
            </div>
          </div>

          {/* Medicación */}
          <div className="mb-5">
            <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-3">Medicación</p>
            <div className="bg-[#F9FAFB] rounded-xl p-3">
              <p className="text-sm text-[#1F2937] mb-3">¿Tomás medicación actualmente?</p>
              <div className="flex gap-2 mb-3">
                {([true, false] as const).map(v => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => setClin(c => ({ ...c, toma_medicacion: c.toma_medicacion === v ? null : v }))}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                      clinico.toma_medicacion === v
                        ? v ? 'bg-[#2C4A6E] text-white border-[#2C4A6E]' : 'bg-[#F3F4F6] text-[#4B5563] border-[#D1D5DB]'
                        : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#2A7B6F]'
                    }`}
                  >
                    {v ? 'Sí' : 'No'}
                  </button>
                ))}
              </div>
              {clinico.toma_medicacion === true && (
                <div>
                  <label className="text-xs text-[#6B7280] mb-1 block">¿Cuál/es? (opcional)</label>
                  <textarea
                    value={clinico.detalle_medicacion}
                    onChange={e => setClin(c => ({ ...c, detalle_medicacion: e.target.value }))}
                    placeholder="Ej: Metformina, Levotiroxina..."
                    rows={2}
                    maxLength={300}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#2A7B6F]/30 resize-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Antecedentes */}
          <div className="mb-6">
            <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-3">Antecedentes relevantes</p>
            <div className="bg-[#F9FAFB] rounded-xl px-3 py-1">
              <ToggleSiNo label="Tabaquismo"           value={clinico.antec_tabaquismo ? true : null}        onChange={v => setClin(c => ({ ...c, antec_tabaquismo: v === true }))} />
              <ToggleSiNo label="Alcohol"              value={clinico.antec_alcohol ? true : null}           onChange={v => setClin(c => ({ ...c, antec_alcohol: v === true }))} />
              <ToggleSiNo label="Otras sustancias"     value={clinico.antec_otras_sustancias ? true : null}  onChange={v => setClin(c => ({ ...c, antec_otras_sustancias: v === true }))} />
              <ToggleSiNo label="Cirugías previas"     value={clinico.antec_cirugia ? true : null}           onChange={v => setClin(c => ({ ...c, antec_cirugia: v === true }))} />
              <ToggleSiNo label="Antecedente de cáncer" value={clinico.antec_cancer ? true : null}          onChange={v => setClin(c => ({ ...c, antec_cancer: v === true }))} />
              <ToggleSiNo label="Tiroides"             value={clinico.antec_tiroides ? true : null}          onChange={v => setClin(c => ({ ...c, antec_tiroides: v === true }))} />
            </div>
            <div className="mt-3">
              <input
                type="text"
                value={clinico.antec_otros}
                onChange={e => setClin(c => ({ ...c, antec_otros: e.target.value }))}
                placeholder="Otro antecedente relevante (opcional)"
                maxLength={200}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#2A7B6F]/30 focus:border-[#2A7B6F]"
              />
            </div>
          </div>

          <button
            onClick={() => guardar(false)}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#2A7B6F] to-[#1B3A5C] text-white font-semibold shadow-md hover:opacity-90 disabled:opacity-50 transition"
          >
            {loading ? 'Guardando...' : '¡Empezar! 🚀'}
          </button>

          <button
            type="button"
            onClick={() => guardar(true)}
            disabled={loading}
            className="w-full mt-2 text-xs text-[#9CA3AF] hover:text-[#6B7280] py-1.5 transition-colors"
          >
            Saltar por ahora
          </button>
        </div>
      </div>
    </div>
  )
}
