// ────────────────────────────────────────────────────────────────
// motor_ics.ts — Motor de cálculo del Índice Compass Semanal
// Puente Diario © 2026
// ────────────────────────────────────────────────────────────────

export interface ICSInput {
  ica_days: number[]      // Array de 5 números [0-7], días cumplidos por conducta
  ica_barriers: number   // Barreras superadas [0-3]
  be_energy: number      // Energía vital [1-5]
  be_regulation: number  // Regulación emocional [1|3|5]
  ini_score: number      // Narrativa interna [1|3|5]
}

export interface ICSResult {
  scores: {
    ica: number
    be: number
    be_norm: number
    ini: number
    ini_norm: number
    ics: number
  }
  semaphore: 'green' | 'amber' | 'red'
  alerts: string[]
  dominant_domain: string
  input_summary: {
    total_days: number
    max_days: number
    adherence_pct: number
  }
}

const round = (n: number): number => Math.round(n * 100) / 100

/**
 * Calcula el ICA (Índice de Conductas Ancla)
 * @param days     - Array de 5 números [0-7], días cumplidos por conducta
 * @param barriers - Barreras superadas [0-3]
 * @returns ICA normalizado 0-100
 */
export function calcICA(days: number[], barriers: number): number {
  if (!Array.isArray(days) || days.length !== 5)
    throw new Error('days debe ser un array de exactamente 5 elementos')

  const totalDays  = days.reduce((a, b) => a + b, 0)
  const maxDays    = 35 // 5 conductas × 7 días
  const baseScore  = (totalDays / maxDays) * 100
  const bonusScore = (barriers / 3) * 10

  return Math.min(100, baseScore + bonusScore * (1 - baseScore / 100))
}

/**
 * Calcula la Brújula Emocional (BE)
 * @param energy     - Energía vital [1-5]
 * @param regulation - Regulación emocional [1|3|5]
 * @returns BE en escala 1-5
 */
export function calcBE(energy: number, regulation: number): number {
  return energy * 0.4 + regulation * 0.6
}

/**
 * Normaliza un valor de escala [min,max] a [0,100]
 */
function normalize(value: number, min: number, max: number): number {
  return ((value - min) / (max - min)) * 100
}

/**
 * Determina el dominio más fuerte (para personalizar mensaje verde)
 */
function getDominantDomain(ica: number, beNorm: number, iniNorm: number): string {
  const scores: Record<string, number> = { ica, be: beNorm, ini: iniNorm }
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0]
}

/**
 * Calcula el ICS completo y determina el semáforo
 *
 * Fórmula sagrada: ICS = (ICA×50%) + (BE×30%) + (INI×20%)
 * Semáforos: green ≥ 70 / amber 45-69 / red < 45
 *
 * Alertas especiales intocables:
 *   - be_critical    → BE < 1.5
 *   - ini_saboteador → ini_score === 1
 *   - ica_zero       → todos los días en 0
 *   - combined_risk  → ICA < 40 y BE < 2
 */
export function calcICS(input: ICSInput): ICSResult {
  const { ica_days, ica_barriers, be_energy, be_regulation, ini_score } = input

  // Validaciones
  if (!Array.isArray(ica_days) || ica_days.length !== 5)
    throw new Error('ica_days debe tener exactamente 5 valores')
  if (![1, 3, 5].includes(ini_score))
    throw new Error('ini_score debe ser 1, 3 o 5')
  if (be_energy < 1 || be_energy > 5)
    throw new Error('be_energy debe estar entre 1 y 5')

  // Cálculo por dominios
  const ica     = calcICA(ica_days, ica_barriers)
  const be      = calcBE(be_energy, be_regulation)
  const beNorm  = normalize(be, 1, 5)
  const iniNorm = normalize(ini_score, 1, 5)

  // ICS ponderado: Conductual 50% + Emocional 30% + Cognitivo 20%
  const ics = ica * 0.50 + beNorm * 0.30 + iniNorm * 0.20

  // Clasificación semáforo
  let semaphore: 'green' | 'amber' | 'red'
  if      (ics >= 70) semaphore = 'green'
  else if (ics >= 45) semaphore = 'amber'
  else                semaphore = 'red'

  // Alertas especiales (pueden activar protocolos adicionales
  // independientemente del ICS global)
  const alerts: string[] = []

  if (be < 1.5)
    alerts.push('be_critical')        // Energía/regulación crítica → rojo inmediato

  if (ini_score === 1)
    alerts.push('ini_saboteador')     // Acumular semanas → microencuentro motivacional

  if (ica_days.every(d => d === 0))
    alerts.push('ica_zero')           // Cero conductas → señal de abandono temprano

  if (ica < 40 && be < 2)
    alerts.push('combined_risk')      // Riesgo combinado alto

  return {
    scores: {
      ica:      round(ica),
      be:       round(be),
      be_norm:  round(beNorm),
      ini:      ini_score,
      ini_norm: round(iniNorm),
      ics:      round(ics),
    },
    semaphore,
    alerts,
    dominant_domain: getDominantDomain(ica, beNorm, iniNorm),
    input_summary: {
      total_days:    ica_days.reduce((a, b) => a + b, 0),
      max_days:      35,
      adherence_pct: round((ica_days.reduce((a, b) => a + b, 0) / 35) * 100),
    },
  }
}
