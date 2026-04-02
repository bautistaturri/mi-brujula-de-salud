// ────────────────────────────────────────────────────────────────
// alert_engine.ts — Motor de alertas del Health Compass
// Ejecutado via cron cada lunes a las 8:00 AM
// Puente Diario © 2026
// ────────────────────────────────────────────────────────────────

export interface CheckinData {
  semaphore: 'green' | 'amber' | 'red'
  ini_score: number
  alerts: string[]
  scores: {
    ics?: number
    ica?: number
    be?: number
    [key: string]: number | undefined
  }
  submitted_at: string
}

export interface PatientData {
  id: string
  name: string
  checkins: CheckinData[]
}

export interface AlertData {
  patient_id: string
  patient_name: string
  type: string
  color: 'red' | 'amber' | 'celebration' | 'internal'
  assign_to: string
  message: string
  scores?: CheckinData['scores']
  priority: number
  consecutive_weeks?: number
}

/**
 * Determina si una fecha corresponde a la semana en curso
 * (desde el lunes pasado a las 00:00)
 */
export function isThisWeek(date: string | Date): boolean {
  const now   = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - now.getDay() + 1) // Lunes
  start.setHours(0, 0, 0, 0)
  return new Date(date) >= start
}

/**
 * Cuenta cuántos check-ins consecutivos tienen un determinado semáforo
 * empezando desde el más reciente
 */
function countConsecutive(checkins: CheckinData[], semaphore: 'green' | 'amber' | 'red'): number {
  let count = 0
  for (const c of checkins) {
    if (c.semaphore === semaphore) count++
    else break
  }
  return count
}

/**
 * Cuenta cuántos check-ins consecutivos cumplen un predicado
 * empezando desde el más reciente
 */
function countConsecutiveWhere(checkins: CheckinData[], predicate: (c: CheckinData) => boolean): number {
  let count = 0
  for (const c of checkins) {
    if (predicate(c)) count++
    else break
  }
  return count
}

/**
 * Genera el mensaje de alerta según el tipo
 */
export function getAlertMessage(type: string, patientName: string, context: Record<string, unknown> = {}): string {
  const messages: Record<string, string> = {
    missing_checkin:
      `${patientName} no completó su check-in esta semana.`,
    red_semaphore:
      `${patientName} en zona ROJA. ICS: ${context.ics}. Contacto en 24hs.`,
    amber_circumstantial:
      `${patientName} en amarillo esta semana. Posible semana difícil puntual.`,
    amber_systemic:
      `${patientName} lleva ${context.consecutive} semanas en amarillo. Microencuentro recomendado.`,
    be_critical:
      `${patientName}: energía emocional crítica (BE < 1.5). Contacto urgente.`,
    ini_saboteador_streak:
      `${patientName}: Saboteador dominante ${context.streakWeeks} semanas seguidas.`,
    ica_zero:
      `${patientName}: ninguna conducta ancla cumplida esta semana.`,
    combined_risk:
      `${patientName}: riesgo combinado alto (ICA bajo + BE bajo). Evaluar intervención.`,
    green_streak_milestone:
      `${patientName}: ¡${context.streak} semanas seguidas en verde! Considerar mensaje de celebración.`,
  }
  return messages[type] ?? `Nueva alerta para ${patientName}`
}

/**
 * Lógica central de procesamiento de alertas para un paciente
 *
 * 7 casos clínicos intocables:
 *   1. missing_checkin
 *   2. red_semaphore → assign_to: medica
 *   3. amber_circumstantial vs amber_systemic (≥2 semanas)
 *   4. be_critical → assign_to: medica
 *   5. ica_zero → assign_to: coach
 *   6. ini_saboteador_streak (≥3 semanas) → assign_to: coach
 *   7. green_streak_milestone (hitos 3, 6, 12 semanas)
 *   + verde enmascarado (ICS verde pero ICA < 55%)
 */
export function processPatientAlerts(patient: PatientData): AlertData[] {
  const alerts: AlertData[] = []
  const lastCheckin  = patient.checkins[0]
  const prevCheckins = patient.checkins.slice(1)

  // ── CASO 1: Sin check-in esta semana ──────────────────────────
  if (!lastCheckin || !isThisWeek(lastCheckin.submitted_at)) {
    alerts.push({
      patient_id:   patient.id,
      patient_name: patient.name,
      type:         'missing_checkin',
      color:        'amber',
      assign_to:    'coach',
      message:      getAlertMessage('missing_checkin', patient.name),
      priority:     2,
    })
    return alerts // No procesar más si no hay check-in
  }

  const { semaphore, alerts: specialAlerts, scores } = lastCheckin

  // ── CASO 2: Semáforo rojo directo ─────────────────────────────
  if (semaphore === 'red') {
    alerts.push({
      patient_id:   patient.id,
      patient_name: patient.name,
      type:         'red_semaphore',
      color:        'red',
      assign_to:    'medica',
      message:      getAlertMessage('red_semaphore', patient.name, { ics: scores?.ics }),
      scores,
      priority:     1, // Máxima prioridad
    })
  }

  // ── CASO 3: Semáforo amarillo — distinguir tipo ───────────────
  if (semaphore === 'amber') {
    const consecutiveAmber = countConsecutive(prevCheckins, 'amber')
    const isSystemic       = consecutiveAmber >= 1

    alerts.push({
      patient_id:       patient.id,
      patient_name:     patient.name,
      type:             isSystemic ? 'amber_systemic' : 'amber_circumstantial',
      color:            'amber',
      assign_to:        isSystemic ? 'coach_urgent' : 'coach',
      message:          getAlertMessage(
        isSystemic ? 'amber_systemic' : 'amber_circumstantial',
        patient.name,
        { consecutive: consecutiveAmber + 1 }
      ),
      scores,
      consecutive_weeks: consecutiveAmber + 1,
      priority:         isSystemic ? 1.5 : 2,
    })
  }

  // ── CASO 4: Alertas especiales (pueden solaparse con verde) ───
  if (specialAlerts?.includes('be_critical')) {
    alerts.push({
      patient_id:   patient.id,
      patient_name: patient.name,
      type:         'be_critical',
      color:        'red',
      assign_to:    'medica',
      message:      getAlertMessage('be_critical', patient.name),
      scores,
      priority:     1,
    })
  }

  if (specialAlerts?.includes('ica_zero')) {
    alerts.push({
      patient_id:   patient.id,
      patient_name: patient.name,
      type:         'ica_zero',
      color:        'amber',
      assign_to:    'coach',
      message:      getAlertMessage('ica_zero', patient.name),
      scores,
      priority:     1.8,
    })
  }

  // ── CASO 5: INI Saboteador acumulado ──────────────────────────
  const allCheckins      = [lastCheckin, ...prevCheckins]
  const saboteadorStreak = countConsecutiveWhere(allCheckins, c => c.ini_score === 1)

  if (saboteadorStreak >= 3) {
    alerts.push({
      patient_id:   patient.id,
      patient_name: patient.name,
      type:         'ini_saboteador_streak',
      color:        'amber',
      assign_to:    'coach',
      message:      getAlertMessage('ini_saboteador_streak', patient.name, { streakWeeks: saboteadorStreak }),
      scores,
      priority:     1.8,
    })
  }

  // ── CASO 6: Verde oculto (ICS verde pero dominio individual bajo) ──
  if (semaphore === 'green' && scores) {
    if ((scores.ica ?? 100) < 55) {
      alerts.push({
        patient_id:   patient.id,
        patient_name: patient.name,
        type:         'green_with_low_ica',
        color:        'internal', // Solo nota interna del equipo
        assign_to:    'coach_note',
        message:      `${patient.name}: ICS verde pero ICA < 55% (${scores.ica}%). Monitorear.`,
        scores,
        priority:     3, // Baja prioridad
      })
    }
  }

  // ── CASO 7: Hito de racha verde ───────────────────────────────
  if (semaphore === 'green') {
    const greenStreak = countConsecutiveWhere(
      [lastCheckin, ...prevCheckins],
      c => c.semaphore === 'green'
    )
    if ([3, 6, 12].includes(greenStreak)) {
      alerts.push({
        patient_id:   patient.id,
        patient_name: patient.name,
        type:         'green_streak_milestone',
        color:        'celebration',
        assign_to:    'auto', // Mensaje automático
        message:      getAlertMessage('green_streak_milestone', patient.name, { streak: greenStreak }),
        scores,
        priority:     4,
      })
    }
  }

  // Ordenar por prioridad
  return alerts.sort((a, b) => a.priority - b.priority)
}

/**
 * Función principal del cron job semanal
 *
 * @param patients - Lista de pacientes activos con sus checkins
 * @returns Lista de todas las alertas generadas
 */
export function processWeeklyAlerts(patients: PatientData[]): AlertData[] {
  const allAlerts: AlertData[] = []

  for (const patient of patients) {
    try {
      const patientAlerts = processPatientAlerts(patient)
      allAlerts.push(...patientAlerts)
    } catch (err) {
      console.error(`[AlertEngine] Error procesando ${patient.name}:`, (err as Error).message)
    }
  }

  return allAlerts
}
