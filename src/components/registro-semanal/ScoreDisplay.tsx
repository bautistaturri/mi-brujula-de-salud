'use client'

import { nivelEstilos } from '@/lib/scoring'
import type { AdherenciaMedicacion } from '@/lib/scoring'
import { LOGROS_CONFIG } from '@/lib/logros'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  score: number
  nivel_bienestar: string
  emoji_nivel: string
  requiere_atencion: boolean
  semana_inicio: string
  semana_fin: string
  facilitadorWhatsapp: string | null
  pacienteNombre: string
  animo: number
  sueno: number
  energia: number
  alimentacion: number
  actividad_fisica: number
  adherencia_medicacion: AdherenciaMedicacion
  logro_personal: string
  dificultad: string
  logrosNuevos: string[]
  onVerLogros: () => void
}

function formatFechaSemana(iso: string) {
  return format(parseISO(iso), "d 'de' MMMM", { locale: es })
}

export default function ScoreDisplay({
  score,
  nivel_bienestar,
  emoji_nivel,
  requiere_atencion,
  semana_inicio,
  semana_fin,
  facilitadorWhatsapp,
  pacienteNombre,
  animo,
  sueno,
  energia,
  alimentacion,
  actividad_fisica,
  adherencia_medicacion,
  logro_personal,
  dificultad,
  logrosNuevos,
  onVerLogros,
}: Props) {
  const estilos = nivelEstilos(score)
  const adherenciaLabel =
    adherencia_medicacion === 'si' ? 'Sí ✓' :
    adherencia_medicacion === 'no' ? 'No ✗' : 'No aplica'

  function construirMensajeWA(): string {
    const logrosStr = logrosNuevos.length > 0
      ? logrosNuevos.map(k => `${LOGROS_CONFIG[k]?.emoji} ${LOGROS_CONFIG[k]?.nombre}`).join(', ')
      : 'Ninguno esta semana'
    const alertaStr = requiere_atencion
      ? '\n🚨 *ATENCIÓN: Este paciente requiere seguimiento prioritario*'
      : ''
    return `📋 *Registro Semanal - Mi Brújula de Salud*

👤 Paciente: ${pacienteNombre}
📅 Semana: ${formatFechaSemana(semana_inicio)} al ${formatFechaSemana(semana_fin)}

📊 *Resumen de la semana:*
- Estado de ánimo: ${animo}/5
- Calidad de sueño: ${sueno}/5
- Energía: ${energia}/5
- Alimentación: ${alimentacion}/5
- Actividad física: ${actividad_fisica} días
- Medicación: ${adherenciaLabel}

🎯 *Score general: ${score}/100 — ${nivel_bienestar} ${emoji_nivel}*

✍️ Logro personal: ${logro_personal.trim() || 'No especificado'}
⚠️ Dificultad: ${dificultad.trim() || 'No especificada'}${alertaStr}

🏅 Logros nuevos: ${logrosStr}`
  }

  return (
    <div className="space-y-4">
      {/* Score */}
      <div
        className="rounded-2xl p-6 text-center border"
        style={{ background: estilos.bg, borderColor: estilos.border }}
      >
        <div className="text-6xl mb-2">{emoji_nivel}</div>
        <div className="text-5xl font-bold mb-1" style={{ color: estilos.color }}>
          {score}<span className="text-2xl font-normal text-[#78716C]">/100</span>
        </div>
        <p className="font-semibold text-lg" style={{ color: estilos.color }}>{nivel_bienestar}</p>
        <p className="text-xs text-[#78716C] mt-1">
          {formatFechaSemana(semana_inicio)} — {formatFechaSemana(semana_fin)}
        </p>
      </div>

      {/* Alerta */}
      {requiere_atencion && (
        <div className="bg-semaforo-rojo-bg border border-semaforo-rojo-border rounded-xl p-4 flex gap-3">
          <span className="text-2xl">🚨</span>
          <div>
            <p className="font-semibold text-sm text-semaforo-rojo">Atención recomendada</p>
            <p className="text-xs text-semaforo-rojo mt-0.5 opacity-80">
              Tu sueño o ánimo estuvieron muy bajos. Tu facilitador será notificado.
            </p>
          </div>
        </div>
      )}

      {/* Logros nuevos */}
      {logrosNuevos.length > 0 && (
        <div className="bg-[#FBF4E8] border border-[#E8D4A8] rounded-xl p-4">
          <p className="font-semibold text-sm text-[#92671A] mb-2">🏅 ¡Nuevos logros desbloqueados!</p>
          <div className="flex flex-wrap gap-2">
            {logrosNuevos.map(k => (
              <span key={k} className="bg-white border border-[#E8D4A8] text-sm px-3 py-1 rounded-full font-medium text-[#92671A]">
                {LOGROS_CONFIG[k]?.emoji} {LOGROS_CONFIG[k]?.nombre}
              </span>
            ))}
          </div>
          <button onClick={onVerLogros} className="text-xs text-[#92671A] font-medium mt-2 hover:underline">
            Ver todos mis logros →
          </button>
        </div>
      )}

      {/* Botón WhatsApp */}
      {facilitadorWhatsapp ? (
        <a
          href={`https://wa.me/${facilitadorWhatsapp}?text=${encodeURIComponent(construirMensajeWA())}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-[#2C6B3E] hover:bg-[#1E5030] text-white font-semibold py-3.5 rounded-xl transition-colors text-sm"
        >
          📲 Enviar reporte al facilitador por WhatsApp
        </a>
      ) : (
        <div className="bg-[#F7F6F3] border border-[#E2DDD6] rounded-xl p-4 text-center text-sm text-[#78716C]">
          Tu reporte fue guardado. Tu facilitador podrá verlo en tu ficha.
        </div>
      )}

      <a
        href="/inicio"
        className="block w-full text-center bg-[#F7F6F3] hover:bg-[#EEEAE4] border border-[#E2DDD6] text-[#78716C] font-medium py-3 rounded-xl transition-colors text-sm"
      >
        Volver al inicio
      </a>
    </div>
  )
}
