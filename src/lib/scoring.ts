export type AdherenciaMedicacion = 'si' | 'no' | 'no_aplica'

export interface ScoreInput {
  animo: number              // 1-5
  sueno: number              // 1-5
  energia: number            // 1-5
  alimentacion: number       // 1-5
  actividad_fisica: number   // 0-7
  adherencia_medicacion: AdherenciaMedicacion
}

export interface ScoreResult {
  score: number
  nivel_bienestar: string
  emoji_nivel: string
  requiere_atencion: boolean
}

function norm15(val: number): number {
  return Math.round(((val - 1) / 4) * 100)
}

function norm07(val: number): number {
  return Math.round((val / 7) * 100)
}

function normAdherencia(val: AdherenciaMedicacion): number {
  if (val === 'si') return 100
  if (val === 'no') return 0
  return 75 // no_aplica: neutral
}

export function calcularScore(input: ScoreInput): ScoreResult {
  const score = Math.round(
    norm15(input.animo)        * 0.25 +
    norm15(input.sueno)        * 0.20 +
    norm15(input.energia)      * 0.20 +
    norm15(input.alimentacion) * 0.15 +
    norm07(input.actividad_fisica) * 0.15 +
    normAdherencia(input.adherencia_medicacion) * 0.05
  )

  let nivel_bienestar: string
  let emoji_nivel: string

  if (score >= 80) {
    nivel_bienestar = 'Excelente semana'
    emoji_nivel = '🌟'
  } else if (score >= 60) {
    nivel_bienestar = 'Buena semana'
    emoji_nivel = '💪'
  } else if (score >= 40) {
    nivel_bienestar = 'Semana regular'
    emoji_nivel = '🌤'
  } else {
    nivel_bienestar = 'Semana difícil'
    emoji_nivel = '💙'
  }

  // Sueño o ánimo muy bajos (1 o 2 en escala 1-5) → requiere atención
  const requiere_atencion = input.sueno <= 2 || input.animo <= 2

  return { score, nivel_bienestar, emoji_nivel, requiere_atencion }
}

export function nivelEstilos(score: number): { color: string; bg: string; border: string } {
  if (score >= 80) return { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' }
  if (score >= 60) return { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' }
  if (score >= 40) return { color: '#a16207', bg: '#fefce8', border: '#fef08a' }
  return { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' }
}
