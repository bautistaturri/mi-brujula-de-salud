import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { processWeeklyAlerts } from '@/lib/alerts/alert_engine'
import type { PatientData, CheckinData } from '@/lib/alerts/alert_engine'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/cron/weekly-alerts
 *
 * Cron job semanal (lunes 8:00 AM).
 * Procesa alertas ICS para todos los pacientes activos
 * e inserta los resultados en la tabla `alerts`.
 *
 * Protegido con CRON_SECRET en el header Authorization.
 */
export async function GET(request: Request) {
  // ── Autenticación del cron ──────────────────────────────────
  const auth = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // ── 1. Obtener pacientes activos con sus últimos 8 check-ins ──
    const { data: pacientes, error: pacientesError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        nombre,
        checkins_semanales (
          semaphore,
          ini_score,
          alerts,
          scores,
          submitted_at
        )
      `)
      .eq('role', 'paciente')
      .order('submitted_at', { referencedTable: 'checkins_semanales', ascending: false })

    if (pacientesError) throw new Error(pacientesError.message)

    // ── 2. Mapear al formato PatientData del alert_engine ──────
    const patientData: PatientData[] = (pacientes ?? []).map(p => ({
      id:   p.id,
      name: p.nombre,
      checkins: ((p.checkins_semanales as unknown[]) ?? [])
        .slice(0, 8)
        .map((c: unknown) => {
          const row = c as Record<string, unknown>
          return {
            semaphore:    row.semaphore    as CheckinData['semaphore'],
            ini_score:    (row.ini_score   as number) ?? 3,
            alerts:       (row.alerts      as string[]) ?? [],
            scores:       (row.scores      as CheckinData['scores']) ?? {},
            submitted_at: row.submitted_at as string,
          }
        }),
    }))

    // ── 3. Procesar alertas ────────────────────────────────────
    const alertas = processWeeklyAlerts(patientData)

    if (alertas.length === 0) {
      return NextResponse.json({ ok: true, procesados: patientData.length, alertas: 0 })
    }

    // ── 4. Insertar alertas en la tabla `alerts` ───────────────
    const rows = alertas
      .filter(a => a.color !== 'internal') // no persistir notas internas
      .map(a => ({
        patient_id: a.patient_id,
        type:       a.type,
        color:      a.color,
        assign_to:  a.assign_to,
        message:    a.message,
        priority:   a.priority,
        scores:     a.scores ?? null,
        is_read:    false,
        week_start: new Date().toISOString().split('T')[0],
      }))

    const { error: insertError } = await supabaseAdmin
      .from('alerts')
      .insert(rows)

    if (insertError) throw new Error(insertError.message)

    return NextResponse.json({
      ok:         true,
      procesados: patientData.length,
      alertas:    rows.length,
    })

  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }
}
