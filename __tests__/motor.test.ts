// ────────────────────────────────────────────────────────────────
// motor.test.ts — Suite de 35 tests para el Health Compass
// Puente Diario © 2026
// Runner: Vitest
// ────────────────────────────────────────────────────────────────

import { describe, test, expect } from 'vitest'
import { calcICS, calcICA, calcBE } from '../src/lib/scoring/motor_ics'
import { processPatientAlerts, processWeeklyAlerts } from '../src/lib/alerts/alert_engine'

// Helper: toBeBetween (no existe en Vitest nativo)
function expectBetween(actual: number, min: number, max: number) {
  if (actual < min || actual > max)
    throw new Error(`${actual} debería estar entre ${min} y ${max}`)
}

// ══════════════════════════════════════════════════════════════
// TESTS: MOTOR ICS
// ══════════════════════════════════════════════════════════════

describe('Motor ICS — calcICA()', () => {

  test('Cumplimiento perfecto = 100%', () => {
    const result = calcICA([7, 7, 7, 7, 7], 3)
    expect(result).toBeGreaterThanOrEqual(95)
  })

  test('Cero conductas = ICA bajo', () => {
    const result = calcICA([0, 0, 0, 0, 0], 0)
    expect(result).toBe(0)
  })

  test('Mitad de los días ≈ 50%', () => {
    const result = calcICA([3, 4, 4, 3, 4], 1)
    expectBetween(result, 45, 60)
  })

  test('Bonus de barreras incrementa el score', () => {
    const base  = calcICA([3, 3, 3, 3, 3], 0)
    const bonus = calcICA([3, 3, 3, 3, 3], 3)
    expect(bonus).toBeGreaterThan(base)
  })

  test('Nunca supera 100', () => {
    const result = calcICA([7, 7, 7, 7, 7], 3)
    expect(result).toBeLessThan(101)
  })

  test('Valida longitud del array', () => {
    expect(() => calcICA([7, 7, 7, 7], 1)).toThrow('exactamente 5')
  })

})

describe('Motor ICS — calcBE()', () => {

  test('Energía máxima + regulación máxima = 5', () => {
    const result = calcBE(5, 5)
    expect(result).toBe(5)
  })

  test('Energía mínima + regulación mínima = 1', () => {
    const result = calcBE(1, 1)
    expect(result).toBe(1)
  })

  test('Regulación tiene más peso que energía', () => {
    const highRegulation = calcBE(1, 5) // regulación alta, energía baja
    const highEnergy     = calcBE(5, 1) // energía alta, regulación baja
    expect(highRegulation).toBeGreaterThan(highEnergy)
  })

  test('Valores mixtos en rango esperado', () => {
    const result = calcBE(3, 3)
    expectBetween(result, 1, 5)
  })

})

describe('Motor ICS — calcICS() — Semáforos', () => {

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

  test('Paciente modelo → zona verde', () => {
    const { semaphore, scores } = calcICS(VERDE)
    expect(semaphore).toBe('green')
    expect(scores.ics).toBeGreaterThanOrEqual(70)
  })

  test('Paciente con dificultad moderada → zona amarilla', () => {
    const { semaphore, scores } = calcICS(AMARILLO)
    expect(semaphore).toBe('amber')
    expectBetween(scores.ics, 45, 69)
  })

  test('Paciente desconectado → zona roja', () => {
    const { semaphore, scores } = calcICS(ROJO)
    expect(semaphore).toBe('red')
    expect(scores.ics).toBeLessThan(45)
  })

  test('ICS verde cerca del umbral (70)', () => {
    const input = {
      ica_days: [4, 4, 4, 4, 4],
      ica_barriers: 2,
      be_energy: 4,
      be_regulation: 3,
      ini_score: 5,
    }
    const { scores } = calcICS(input)
    expectBetween(scores.ics, 60, 85)
  })

  test('Estructura del resultado es correcta', () => {
    const result = calcICS(VERDE)
    const keys = Object.keys(result)
    for (const k of ['scores', 'semaphore', 'alerts', 'dominant_domain', 'input_summary']) {
      expect(keys).toContain(k)
    }
  })

  test('Pesos correctos: conductual 50% tiene más impacto', () => {
    const highICA = calcICS({ ...ROJO, ica_days: [7, 7, 7, 7, 7], ica_barriers: 3 })
    const highINI = calcICS({ ...ROJO, ica_days: [0, 0, 0, 0, 0], ini_score: 5 })
    expect(highICA.scores.ics).toBeGreaterThan(highINI.scores.ics)
  })

})

describe('Motor ICS — calcICS() — Alertas especiales', () => {

  test('BE crítico (< 1.5) genera alerta be_critical', () => {
    const { alerts } = calcICS({
      ica_days: [7, 7, 7, 7, 7],
      ica_barriers: 3,
      be_energy: 1,
      be_regulation: 1,
      ini_score: 5,
    })
    expect(alerts).toContain('be_critical')
  })

  test('INI Saboteador genera alerta ini_saboteador', () => {
    const { alerts } = calcICS({
      ica_days: [5, 5, 5, 5, 5],
      ica_barriers: 2,
      be_energy: 3,
      be_regulation: 3,
      ini_score: 1,
    })
    expect(alerts).toContain('ini_saboteador')
  })

  test('Cero conductas genera alerta ica_zero', () => {
    const { alerts } = calcICS({
      ica_days: [0, 0, 0, 0, 0],
      ica_barriers: 0,
      be_energy: 3,
      be_regulation: 3,
      ini_score: 3,
    })
    expect(alerts).toContain('ica_zero')
  })

  test('Paciente verde sin alertas especiales', () => {
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

describe('Motor ICS — Validaciones de input', () => {

  test('Rechaza ica_days con longitud incorrecta', () => {
    expect(() => calcICS({
      ica_days: [7, 7, 7, 7],
      ica_barriers: 1,
      be_energy: 3,
      be_regulation: 3,
      ini_score: 3,
    })).toThrow()
  })

  test('Rechaza ini_score inválido (valor 2)', () => {
    expect(() => calcICS({
      ica_days: [5, 5, 5, 5, 5],
      ica_barriers: 1,
      be_energy: 3,
      be_regulation: 3,
      ini_score: 2,
    })).toThrow()
  })

  test('Rechaza be_energy fuera de rango', () => {
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
// TESTS: MOTOR DE ALERTAS
// ══════════════════════════════════════════════════════════════

describe('Alert Engine — processPatientAlerts()', () => {

  // El cron corre los lunes y evalúa check-ins de LA SEMANA PASADA
  const lastMonday = new Date()
  const dow = lastMonday.getDay()
  lastMonday.setDate(lastMonday.getDate() - (dow === 0 ? 6 : dow - 1) - 7)
  lastMonday.setHours(12, 0, 0, 0)

  const checkinGreen = {
    semaphore: 'green' as const,
    ini_score: 5,
    alerts: [],
    scores: { ics: 78, ica: 82, be: 3.8 },
    submitted_at: lastMonday.toISOString(),
  }

  const checkinRed = {
    semaphore: 'red' as const,
    ini_score: 1,
    alerts: ['be_critical'],
    scores: { ics: 32, ica: 35, be: 1.2 },
    submitted_at: lastMonday.toISOString(),
  }

  const checkinAmber = {
    semaphore: 'amber' as const,
    ini_score: 3,
    alerts: [],
    scores: { ics: 56, ica: 58, be: 2.8 },
    submitted_at: lastMonday.toISOString(),
  }

  test('Paciente sin check-in → alerta amarilla de ausencia', () => {
    const patient = {
      id: 'p1', name: 'Ana García',
      checkins: [],
    }
    const alerts = processPatientAlerts(patient)
    expect(alerts.length).toBeGreaterThanOrEqual(1)
    expect(alerts[0].type).toBe('missing_checkin')
    expect(alerts[0].color).toBe('amber')
  })

  test('Paciente en rojo → alerta roja asignada a medica', () => {
    const patient = {
      id: 'p2', name: 'Carmen R.',
      checkins: [checkinRed, checkinAmber, checkinGreen],
    }
    const alerts = processPatientAlerts(patient)
    const redAlert = alerts.find(a => a.type === 'red_semaphore')
    expect(redAlert).toBeDefined()
    expect(redAlert!.assign_to).toBe('medica')
    expect(redAlert!.color).toBe('red')
  })

  test('BE crítico genera alerta roja independiente del ICS', () => {
    const checkinWithBECritical = { ...checkinGreen, alerts: ['be_critical'] }
    const patient = {
      id: 'p3', name: 'María R.',
      checkins: [checkinWithBECritical],
    }
    const alerts = processPatientAlerts(patient)
    const beAlert = alerts.find(a => a.type === 'be_critical')
    expect(beAlert).toBeDefined()
    expect(beAlert!.assign_to).toBe('medica')
  })

  test('Paciente amarillo primera semana → circunstancial', () => {
    const patient = {
      id: 'p4', name: 'Pedro M.',
      checkins: [checkinAmber, checkinGreen, checkinGreen],
    }
    const alerts = processPatientAlerts(patient)
    const amberAlert = alerts.find(a => a.color === 'amber' && a.type.includes('amber'))
    expect(amberAlert).toBeDefined()
    expect(amberAlert!.type).toBe('amber_circumstantial')
  })

  test('Paciente amarillo 2+ semanas → sistémico', () => {
    const patient = {
      id: 'p5', name: 'Laura G.',
      checkins: [checkinAmber, checkinAmber, checkinGreen],
    }
    const alerts = processPatientAlerts(patient)
    const amberAlert = alerts.find(a => a.color === 'amber' && a.type.includes('amber'))
    expect(amberAlert).toBeDefined()
    expect(amberAlert!.type).toBe('amber_systemic')
  })

  test('Paciente verde sin issues → no genera alertas operativas', () => {
    const patient = {
      id: 'p6', name: 'Jorge M.',
      checkins: [checkinGreen, checkinGreen, checkinGreen],
    }
    const alerts = processPatientAlerts(patient)
    const operativeAlerts = alerts.filter(a => ['red', 'amber'].includes(a.color))
    expect(operativeAlerts.length).toBe(0)
  })

  test('Alertas ordenadas por prioridad (rojo primero)', () => {
    const patient = {
      id: 'p7', name: 'Test Patient',
      checkins: [{ ...checkinRed, alerts: ['be_critical', 'ica_zero'] }],
    }
    const alerts = processPatientAlerts(patient)
    if (alerts.length >= 2) {
      expect(alerts[0].priority).toBeLessThanOrEqual(alerts[1].priority)
    }
  })

})

describe('Alert Engine — processWeeklyAlerts()', () => {

  test('Procesa múltiples pacientes sin errores', () => {
    const lm = new Date()
    const d = lm.getDay()
    lm.setDate(lm.getDate() - (d === 0 ? 6 : d - 1) - 7)
    lm.setHours(12, 0, 0, 0)

    const patients = [
      { id: 'p1', name: 'Ana G.',    checkins: [{ semaphore: 'green' as const, ini_score: 5, alerts: [], scores: { ics: 78 }, submitted_at: lm.toISOString() }] },
      { id: 'p2', name: 'Pedro M.',  checkins: [{ semaphore: 'amber' as const, ini_score: 3, alerts: [], scores: { ics: 56 }, submitted_at: lm.toISOString() }] },
      { id: 'p3', name: 'Carmen R.', checkins: [] },
    ]

    const allAlerts = processWeeklyAlerts(patients)

    const carmenAlerts = allAlerts.filter(a => a.patient_id === 'p3')
    expect(carmenAlerts.length).toBeGreaterThanOrEqual(1)
  })

  test('Retorna array aunque todos estén en verde', () => {
    const lm = new Date()
    const d = lm.getDay()
    lm.setDate(lm.getDate() - (d === 0 ? 6 : d - 1) - 7)
    lm.setHours(12, 0, 0, 0)

    const patients = [
      { id: 'p1', name: 'Ana G.', checkins: [{ semaphore: 'green' as const, ini_score: 5, alerts: [], scores: { ics: 78 }, submitted_at: lm.toISOString() }] },
    ]
    const result = processWeeklyAlerts(patients)
    expect(Array.isArray(result)).toBe(true)
  })

})

// ══════════════════════════════════════════════════════════════
// INTEGRATION TEST: Flujo completo check-in → semáforo → alerta
// ══════════════════════════════════════════════════════════════

describe('Test de integración — Flujo completo', () => {

  test('Semana perfecta: verde sin alertas operativas', () => {
    const input = {
      ica_days: [7, 7, 7, 7, 7],
      ica_barriers: 3,
      be_energy: 5,
      be_regulation: 5,
      ini_score: 5,
    }
    const result = calcICS(input)
    expect(result.semaphore).toBe('green')
    const criticalAlerts = result.alerts.filter(a =>
      ['be_critical', 'ica_zero', 'combined_risk'].includes(a)
    )
    expect(criticalAlerts.length).toBe(0)
  })

  test('Semana de abandono: rojo + múltiples alertas', () => {
    const input = {
      ica_days: [0, 0, 0, 0, 0],
      ica_barriers: 0,
      be_energy: 1,
      be_regulation: 1,
      ini_score: 1,
    }
    const result = calcICS(input)
    expect(result.semaphore).toBe('red')
    expect(result.alerts).toContain('be_critical')
    expect(result.alerts).toContain('ini_saboteador')
    expect(result.alerts).toContain('ica_zero')
  })

  test('Semana de transición: amarillo, sin alertas críticas', () => {
    const input = {
      ica_days: [3, 4, 3, 4, 3],
      ica_barriers: 1,
      be_energy: 3,
      be_regulation: 3,
      ini_score: 3,
    }
    const result = calcICS(input)
    expect(result.semaphore).toBe('amber')
    expect(result.alerts).not.toContain('be_critical')
  })

})
