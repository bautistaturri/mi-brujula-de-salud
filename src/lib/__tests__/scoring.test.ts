// ────────────────────────────────────────────────────────────────
// scoring.test.ts — Suite completa de tests para el Motor ICS
// Puente Diario © 2026
// ────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import { calcICA, calcBE, calcICS } from '../scoring/motor_ics'

// ══════════════════════════════════════════════════════════════
// calcICA
// ══════════════════════════════════════════════════════════════

describe('Motor ICS — calcICA()', () => {

  it('Cumplimiento perfecto = 100%', () => {
    const result = calcICA([7, 7, 7, 7, 7], 3)
    expect(result).toBeGreaterThanOrEqual(95)
  })

  it('Cero conductas = ICA 0', () => {
    const result = calcICA([0, 0, 0, 0, 0], 0)
    expect(result).toBe(0)
  })

  it('Mitad de los días ≈ 50%', () => {
    const result = calcICA([3, 4, 4, 3, 4], 1)
    expect(result).toBeGreaterThanOrEqual(45)
    expect(result).toBeLessThanOrEqual(60)
  })

  it('Bonus de barreras incrementa el score', () => {
    const base  = calcICA([3, 3, 3, 3, 3], 0)
    const bonus = calcICA([3, 3, 3, 3, 3], 3)
    expect(bonus).toBeGreaterThan(base)
  })

  it('Nunca supera 100', () => {
    const result = calcICA([7, 7, 7, 7, 7], 3)
    expect(result).toBeLessThanOrEqual(100)
  })

  it('Valida longitud del array (debe ser exactamente 5)', () => {
    expect(() => calcICA([7, 7, 7, 7], 1)).toThrow('exactamente 5')
  })

})

// ══════════════════════════════════════════════════════════════
// calcBE
// ══════════════════════════════════════════════════════════════

describe('Motor ICS — calcBE()', () => {

  it('Energía máxima + regulación máxima = 5', () => {
    expect(calcBE(5, 5)).toBe(5)
  })

  it('Energía mínima + regulación mínima = 1', () => {
    expect(calcBE(1, 1)).toBe(1)
  })

  it('Regulación tiene más peso que energía (0.6 vs 0.4)', () => {
    const highRegulation = calcBE(1, 5) // regulación alta, energía baja
    const highEnergy     = calcBE(5, 1) // energía alta, regulación baja
    expect(highRegulation).toBeGreaterThan(highEnergy)
  })

  it('Valores mixtos en rango esperado [1-5]', () => {
    const result = calcBE(3, 3)
    expect(result).toBeGreaterThanOrEqual(1)
    expect(result).toBeLessThanOrEqual(5)
  })

})

// ══════════════════════════════════════════════════════════════
// calcICS — Semáforos
// ══════════════════════════════════════════════════════════════

const VERDE = {
  ica_days: [7, 6, 7, 5, 6],
  ica_barriers: 3,
  be_energy: 4,
  be_regulation: 5,
  ini_score: 5,
}

const AMARILLO = {
  ica_days: [4, 3, 2, 3, 4],
  ica_barriers: 1,
  be_energy: 3,
  be_regulation: 3,
  ini_score: 3,
}

const ROJO = {
  ica_days: [1, 0, 1, 0, 0],
  ica_barriers: 0,
  be_energy: 1,
  be_regulation: 1,
  ini_score: 1,
}

describe('Motor ICS — calcICS() — Semáforos', () => {

  it('Paciente modelo → zona verde (ICS ≥ 70)', () => {
    const { semaphore, scores } = calcICS(VERDE)
    expect(semaphore).toBe('green')
    expect(scores.ics).toBeGreaterThanOrEqual(70)
  })

  it('Paciente con dificultad moderada → zona amarilla (ICS 45-69)', () => {
    const { semaphore, scores } = calcICS(AMARILLO)
    expect(semaphore).toBe('amber')
    expect(scores.ics).toBeGreaterThanOrEqual(45)
    expect(scores.ics).toBeLessThan(70)
  })

  it('Paciente desconectado → zona roja (ICS < 45)', () => {
    const { semaphore, scores } = calcICS(ROJO)
    expect(semaphore).toBe('red')
    expect(scores.ics).toBeLessThan(45)
  })

  it('ICS verde cerca del umbral (70)', () => {
    const input = {
      ica_days: [4, 4, 4, 4, 4],
      ica_barriers: 2,
      be_energy: 4,
      be_regulation: 3,
      ini_score: 5,
    }
    const { scores } = calcICS(input)
    expect(scores.ics).toBeGreaterThanOrEqual(60)
    expect(scores.ics).toBeLessThanOrEqual(85)
  })

  it('Estructura del resultado tiene todas las claves requeridas', () => {
    const result = calcICS(VERDE)
    expect(result).toHaveProperty('scores')
    expect(result).toHaveProperty('semaphore')
    expect(result).toHaveProperty('alerts')
    expect(result).toHaveProperty('dominant_domain')
    expect(result).toHaveProperty('input_summary')
  })

  it('Pesos correctos: conductual 50% tiene más impacto que cognitivo 20%', () => {
    const highICA = calcICS({ ...ROJO, ica_days: [7, 7, 7, 7, 7], ica_barriers: 3 })
    const highINI = calcICS({ ...ROJO, ica_days: [0, 0, 0, 0, 0], ini_score: 5 })
    expect(highICA.scores.ics).toBeGreaterThan(highINI.scores.ics)
  })

})

// ══════════════════════════════════════════════════════════════
// calcICS — Alertas especiales
// ══════════════════════════════════════════════════════════════

describe('Motor ICS — calcICS() — Alertas especiales', () => {

  it('BE crítico (< 1.5) genera alerta be_critical', () => {
    const { alerts } = calcICS({
      ica_days: [7, 7, 7, 7, 7],
      ica_barriers: 3,
      be_energy: 1,
      be_regulation: 1,
      ini_score: 5,
    })
    expect(alerts).toContain('be_critical')
  })

  it('INI Saboteador (score=1) genera alerta ini_saboteador', () => {
    const { alerts } = calcICS({
      ica_days: [5, 5, 5, 5, 5],
      ica_barriers: 2,
      be_energy: 3,
      be_regulation: 3,
      ini_score: 1,
    })
    expect(alerts).toContain('ini_saboteador')
  })

  it('Cero conductas genera alerta ica_zero', () => {
    const { alerts } = calcICS({
      ica_days: [0, 0, 0, 0, 0],
      ica_barriers: 0,
      be_energy: 3,
      be_regulation: 3,
      ini_score: 3,
    })
    expect(alerts).toContain('ica_zero')
  })

  it('Paciente verde sin alertas especiales', () => {
    const { alerts } = calcICS({
      ica_days: [6, 7, 6, 7, 6],
      ica_barriers: 3,
      be_energy: 4,
      be_regulation: 5,
      ini_score: 5,
    })
    expect(alerts).not.toContain('be_critical')
    expect(alerts).not.toContain('ini_saboteador')
    expect(alerts).not.toContain('ica_zero')
  })

})

// ══════════════════════════════════════════════════════════════
// calcICS — Validaciones de input
// ══════════════════════════════════════════════════════════════

describe('Motor ICS — Validaciones de input', () => {

  it('Rechaza ica_days con longitud incorrecta (4 elementos)', () => {
    expect(() => calcICS({
      ica_days: [7, 7, 7, 7],
      ica_barriers: 1,
      be_energy: 3,
      be_regulation: 3,
      ini_score: 3,
    })).toThrow()
  })

  it('Rechaza ini_score inválido (valor 2 — debe ser 1, 3 o 5)', () => {
    expect(() => calcICS({
      ica_days: [5, 5, 5, 5, 5],
      ica_barriers: 1,
      be_energy: 3,
      be_regulation: 3,
      ini_score: 2,
    })).toThrow()
  })

  it('Rechaza be_energy fuera de rango (valor 8 — debe ser 1-5)', () => {
    expect(() => calcICS({
      ica_days: [5, 5, 5, 5, 5],
      ica_barriers: 1,
      be_energy: 8,
      be_regulation: 3,
      ini_score: 3,
    })).toThrow()
  })

})

// ══════════════════════════════════════════════════════════════
// Tests de integración — Flujo completo check-in → semáforo
// ══════════════════════════════════════════════════════════════

describe('Test de integración — Flujo completo', () => {

  it('Semana perfecta: verde sin alertas críticas', () => {
    const result = calcICS({
      ica_days: [7, 7, 7, 7, 7],
      ica_barriers: 3,
      be_energy: 5,
      be_regulation: 5,
      ini_score: 5,
    })
    expect(result.semaphore).toBe('green')
    const criticalAlerts = result.alerts.filter(a =>
      ['be_critical', 'ica_zero', 'combined_risk'].includes(a)
    )
    expect(criticalAlerts.length).toBe(0)
  })

  it('Semana de abandono: rojo + múltiples alertas', () => {
    const result = calcICS({
      ica_days: [0, 0, 0, 0, 0],
      ica_barriers: 0,
      be_energy: 1,
      be_regulation: 1,
      ini_score: 1,
    })
    expect(result.semaphore).toBe('red')
    expect(result.alerts).toContain('be_critical')
    expect(result.alerts).toContain('ini_saboteador')
    expect(result.alerts).toContain('ica_zero')
  })

  it('Semana de transición: amarillo sin alertas críticas', () => {
    const result = calcICS({
      ica_days: [3, 4, 3, 4, 3],
      ica_barriers: 1,
      be_energy: 3,
      be_regulation: 3,
      ini_score: 3,
    })
    expect(result.semaphore).toBe('amber')
    expect(result.alerts).not.toContain('be_critical')
  })

})
