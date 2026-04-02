import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { processWeeklyAlerts } from '@/lib/alerts/alert_engine'
import type { PatientData } from '@/lib/alerts/alert_engine'

// Schema para validar cada fila de checkin_semanales antes de procesar
const CheckinRowSchema = z.object({
  semaphore:    z.enum(['green', 'amber', 'red']),
  ini_score:    z.number().int().min(1).max(5).default(3),
  alerts:       z.array(z.string()).default([]),
  scores:       z.record(z.string(), z.unknown()).default({}),
  submitted_at: z.string(),
})

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pacientes, error: pacientesError } = await (getSupabaseAdmin() as any)
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const patientData: PatientData[] = ((pacientes ?? []) as any[]).map((p: any) => ({
      id:   p.id,
      name: p.nombre,
      checkins: ((p.checkins_semanales as unknown[]) ?? [])
        .slice(0, 8)
        .flatMap((c: unknown) => {
          const parsed = CheckinRowSchema.safeParse(c)
          if (!parsed.success) return []   // descarta filas con datos inválidos
          return [{
            semaphore:    parsed.data.semaphore,
            ini_score:    parsed.data.ini_score,
            alerts:       parsed.data.alerts,
            scores:       parsed.data.scores as PatientData['checkins'][number]['scores'],
            submitted_at: parsed.data.submitted_at,
          }]
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (getSupabaseAdmin() as any)
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
