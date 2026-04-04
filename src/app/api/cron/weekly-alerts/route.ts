import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { processWeeklyAlerts } from '@/lib/alerts/alert_engine'
import type { PatientData } from '@/lib/alerts/alert_engine'

const CheckinRowSchema = z.object({
  semaphore:    z.enum(['green', 'amber', 'red']),
  ini_score:    z.number().int().min(1).max(5).default(3),
  alerts:       z.array(z.string()).default([]),
  scores:       z.record(z.string(), z.unknown()).default({}),
  submitted_at: z.string(),
})

interface RawPatient {
  id: string
  nombre: string
  checkins_semanales: unknown[]
}

interface AdminQueryResult<T> {
  data: T | null
  error: { message: string } | null
}

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
 * En Vercel, el cron incluye el secret automáticamente (vercel.json → crons).
 */
export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // El admin client no tiene tipos generados de Supabase: se usa `as unknown as`
    // para tipar manualmente las queries sin recurrir a `any` explícito.
    // `getSupabaseAdmin()` usa service_role key — sin restricciones de RLS.
    const adminClient = getSupabaseAdmin() as unknown as {
      from(table: 'users'): {
        select(q: string): {
          eq(col: string, val: string): {
            order(col: string, opts: { referencedTable: string; ascending: boolean }): Promise<AdminQueryResult<RawPatient[]>>
          }
        }
      }
      from(table: 'alerts'): {
        insert(rows: object[]): Promise<AdminQueryResult<null>>
      }
    }

    // 1. Obtener pacientes activos con sus últimos 8 check-ins
    const pacientesRes = await adminClient
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

    if (pacientesRes.error) throw new Error(pacientesRes.error.message)

    // 2. Mapear al formato PatientData del alert_engine
    const patientData: PatientData[] = ((pacientesRes.data ?? []) as RawPatient[]).map(p => ({
      id:   p.id,
      name: p.nombre,
      checkins: ((p.checkins_semanales) ?? [])
        .slice(0, 8)
        .flatMap((c: unknown) => {
          const parsed = CheckinRowSchema.safeParse(c)
          if (!parsed.success) return []
          return [{
            semaphore:    parsed.data.semaphore,
            ini_score:    parsed.data.ini_score,
            alerts:       parsed.data.alerts,
            scores:       parsed.data.scores as PatientData['checkins'][number]['scores'],
            submitted_at: parsed.data.submitted_at,
          }]
        }),
    }))

    // 3. Procesar alertas
    const alertas = processWeeklyAlerts(patientData)

    if (alertas.length === 0) {
      return NextResponse.json({ ok: true, procesados: patientData.length, alertas: 0 })
    }

    // 4. Insertar alertas (excluir notas internas)
    const weekStart = new Date().toISOString().split('T')[0]
    const rows = alertas
      .filter(a => a.color !== 'internal')
      .map(a => ({
        patient_id: a.patient_id,
        type:       a.type,
        color:      a.color,
        assign_to:  a.assign_to,
        message:    a.message,
        priority:   a.priority,
        scores:     a.scores ?? null,
        is_read:    false,
        week_start: weekStart,
      }))

    const insertRes = await adminClient
      .from('alerts')
      .insert(rows)

    if (insertRes.error) throw new Error(insertRes.error.message)

    return NextResponse.json({
      ok:         true,
      procesados: patientData.length,
      alertas:    rows.length,
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error'
    console.error('[cron/weekly-alerts]', message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
