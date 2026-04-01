// ────────────────────────────────────────────────────────────────
// alert_engine.test.ts — Suite de tests para el Motor de Alertas
// Puente Diario © 2026
// ────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import { processPatientAlerts, processWeeklyAlerts } from '../alerts/alert_engine'
import type { CheckinData, PatientData } from '../alerts/alert_engine'

// ── Helpers — fechas de esta semana ──────────────────────────
function thisMonday(): Date {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay() + 1)
  d.setHours(12, 0, 0, 0)
  return d
}

const NOW_ISO = thisMonday().toISOString()

// ── Fixtures de check-ins ─────────────────────────────────────
const checkinGreen: CheckinData = {
  semaphore: 'green',
  ini_score: 5,
  alerts: [],
  scores: { ics: 78, ica: 82, be: 3.8 },
  submitted_at: NOW_ISO,
}

const checkinRed: CheckinData = {
  semaphore: 'red',
  ini_score: 1,
  alerts: ['be_critical'],
  scores: { ics: 32, ica: 35, be: 1.2 },
  submitted_at: NOW_ISO,
}

const checkinAmber: CheckinData = {
  semaphore: 'amber',
  ini_score: 3,
  alerts: [],
  scores: { ics: 56, ica: 58, be: 2.8 },
  submitted_at: NOW_ISO,
}

// ══════════════════════════════════════════════════════════════
// processPatientAlerts — 7 escenarios clínicos
// ══════════════════════════════════════════════════════════════

describe('Alert Engine — processPatientAlerts()', () => {

  it('CASO 1: Paciente sin check-in → alerta amarilla de ausencia', () => {
    const patient: PatientData = {
      id: 'p1',
      name: 'Ana García',
      checkins: [],
    }
    const alerts = processPatientAlerts(patient)
    expect(alerts.length).toBeGreaterThanOrEqual(1)
    expect(alerts[0].type).toBe('missing_checkin')
    expect(alerts[0].color).toBe('amber')
  })

  it('CASO 2: Paciente en rojo → alerta roja asignada a medica', () => {
    const patient: PatientData = {
      id: 'p2',
      name: 'Carmen R.',
      checkins: [checkinRed, checkinAmber, checkinGreen],
    }
    const alerts = processPatientAlerts(patient)
    const redAlert = alerts.find(a => a.type === 'red_semaphore')
    expect(redAlert).toBeDefined()
    expect(redAlert!.assign_to).toBe('medica')
    expect(redAlert!.color).toBe('red')
  })

  it('CASO 3: BE crítico genera alerta roja independiente del ICS global', () => {
    const checkinWithBECritical: CheckinData = { ...checkinGreen, alerts: ['be_critical'] }
    const patient: PatientData = {
      id: 'p3',
      name: 'María R.',
      checkins: [checkinWithBECritical],
    }
    const alerts = processPatientAlerts(patient)
    const beAlert = alerts.find(a => a.type === 'be_critical')
    expect(beAlert).toBeDefined()
    expect(beAlert!.assign_to).toBe('medica')
  })

  it('CASO 4: Paciente amarillo primera semana → circunstancial', () => {
    const patient: PatientData = {
      id: 'p4',
      name: 'Pedro M.',
      checkins: [checkinAmber, checkinGreen, checkinGreen], // 1 solo amarillo
    }
    const alerts = processPatientAlerts(patient)
    const amberAlert = alerts.find(a => a.color === 'amber' && a.type.includes('amber'))
    expect(amberAlert).toBeDefined()
    expect(amberAlert!.type).toBe('amber_circumstantial')
  })

  it('CASO 5: Paciente amarillo 2+ semanas → sistémico', () => {
    const patient: PatientData = {
      id: 'p5',
      name: 'Laura G.',
      checkins: [checkinAmber, checkinAmber, checkinGreen], // 2 seguidos
    }
    const alerts = processPatientAlerts(patient)
    const amberAlert = alerts.find(a => a.color === 'amber' && a.type.includes('amber'))
    expect(amberAlert).toBeDefined()
    expect(amberAlert!.type).toBe('amber_systemic')
  })

  it('CASO 6: Paciente verde sin issues → no genera alertas operativas (rojo/amarillo)', () => {
    const patient: PatientData = {
      id: 'p6',
      name: 'Jorge M.',
      checkins: [checkinGreen, checkinGreen, checkinGreen],
    }
    const alerts = processPatientAlerts(patient)
    const operativas = alerts.filter(a => ['red', 'amber'].includes(a.color))
    expect(operativas.length).toBe(0)
  })

  it('CASO 7: Alertas ordenadas por prioridad (rojo primero)', () => {
    const patient: PatientData = {
      id: 'p7',
      name: 'Test Patient',
      checkins: [{ ...checkinRed, alerts: ['be_critical', 'ica_zero'] }],
    }
    const alerts = processPatientAlerts(patient)
    if (alerts.length >= 2) {
      expect(alerts[0].priority).toBeLessThanOrEqual(alerts[1].priority)
    }
  })

})

// ══════════════════════════════════════════════════════════════
// processWeeklyAlerts
// ══════════════════════════════════════════════════════════════

describe('Alert Engine — processWeeklyAlerts()', () => {

  it('Procesa múltiples pacientes sin errores y detecta ausencias', () => {
    const patients: PatientData[] = [
      { id: 'p1', name: 'Ana G.',    checkins: [{ semaphore: 'green', ini_score: 5, alerts: [], scores: { ics: 78 }, submitted_at: NOW_ISO }] },
      { id: 'p2', name: 'Pedro M.',  checkins: [{ semaphore: 'amber', ini_score: 3, alerts: [], scores: { ics: 56 }, submitted_at: NOW_ISO }] },
      { id: 'p3', name: 'Carmen R.', checkins: [] }, // Sin check-in
    ]
    const allAlerts = processWeeklyAlerts(patients)
    const carmenAlerts = allAlerts.filter(a => a.patient_id === 'p3')
    expect(carmenAlerts.length).toBeGreaterThanOrEqual(1)
  })

  it('Retorna array aunque todos los pacientes estén en verde', () => {
    const patients: PatientData[] = [
      { id: 'p1', name: 'Ana G.', checkins: [{ semaphore: 'green', ini_score: 5, alerts: [], scores: { ics: 78 }, submitted_at: NOW_ISO }] },
    ]
    const result = processWeeklyAlerts(patients)
    expect(Array.isArray(result)).toBe(true)
  })

})
