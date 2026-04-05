import { createClient } from '@/lib/supabase/server'
import { RegistroDiarioSchema } from '@/lib/validations'
import { evaluarLogrosDiarios, LOGROS_CONFIG } from '@/lib/logros'
import type { RegistroDiarioParaLogros } from '@/lib/logros'
import { NextResponse } from 'next/server'

// ── Rate limiting en memoria (por user_id) ───────────────────────────────
// Límite: 3 intentos por usuario por ventana de 24 horas
// Nota: se resetea al reiniciar el servidor. Para producción de alta escala
// usar @upstash/ratelimit + Redis. En una app de salud personal con pocos
// usuarios activos simultáneos, este límite es suficiente.
const RL_WINDOW_MS = 24 * 60 * 60 * 1000  // 24 horas
const RL_MAX       = 3                      // máx 3 registros diarios

const rateLimitStore = new Map<string, { count: number; windowStart: number }>()

function checkRateLimit(userId: string): { ok: boolean; remaining: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(userId)

  if (!entry || now - entry.windowStart > RL_WINDOW_MS) {
    // Nueva ventana
    rateLimitStore.set(userId, { count: 1, windowStart: now })
    return { ok: true, remaining: RL_MAX - 1 }
  }

  if (entry.count >= RL_MAX) {
    return { ok: false, remaining: 0 }
  }

  entry.count++
  return { ok: true, remaining: RL_MAX - entry.count }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // ── Autenticación ────────────────────────────────────────────
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // ── Rate limiting: máx 3 intentos por usuario por día ────────
    const rl = checkRateLimit(user.id)
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Intentá de nuevo mañana.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(RL_WINDOW_MS / 1000)) },
        }
      )
    }

    // ── Validación de input ──────────────────────────────────────
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const parsed = RegistroDiarioSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', detalles: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { fecha, energia_dia, animo_dia, conductas_hoy, nota_libre } = parsed.data

    // ── Autorización: solo puede registrar para sí mismo ────────
    // (La RLS también lo garantiza, esto es defensa en profundidad)

    // ── Verificar duplicado ──────────────────────────────────────
    const { data: existente } = await supabase
      .from('registros_diarios')
      .select('id')
      .eq('paciente_id', user.id)
      .eq('fecha', fecha)
      .single()

    if (existente) {
      return NextResponse.json(
        { error: 'Ya registraste el día de hoy', codigo: 'DUPLICATE' },
        { status: 409 }
      )
    }

    // ── Insertar registro ────────────────────────────────────────
    const { data: registro, error: insertError } = await supabase
      .from('registros_diarios')
      .insert({
        paciente_id:   user.id,
        fecha,
        energia_dia,
        animo_dia,
        conductas_hoy,
        nota_libre:    nota_libre || null,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('[POST /api/checkin/diario] insert error:', insertError.message)
      return NextResponse.json({ error: 'Error al guardar el registro' }, { status: 500 })
    }

    // ── Evaluar logros diarios ───────────────────────────────────
    const [todosRegistrosRes, logrosYaRes] = await Promise.all([
      supabase
        .from('registros_diarios')
        .select('fecha, nota_libre, created_at')
        .eq('paciente_id', user.id)
        .order('fecha', { ascending: false }),
      supabase
        .from('logros_paciente')
        .select('logro_key')
        .eq('paciente_id', user.id),
    ])

    const logrosNuevosKeys = evaluarLogrosDiarios(
      (todosRegistrosRes.data ?? []) as RegistroDiarioParaLogros[],
      (logrosYaRes.data ?? []).map(l => l.logro_key)
    )

    // Insertar logros nuevos (ignorar conflictos por si la race condition da duplicados)
    if (logrosNuevosKeys.length > 0) {
      await supabase
        .from('logros_paciente')
        .insert(
          logrosNuevosKeys.map(key => ({
            paciente_id: user.id,
            logro_key:   key,
            video_visto: false,
          }))
        )
    }

    // Mapear keys a config completa para el cliente
    const logrosNuevos = logrosNuevosKeys
      .map(key => LOGROS_CONFIG[key])
      .filter(Boolean)

    return NextResponse.json({
      ok: true,
      registro_id: registro.id,
      logros_nuevos: logrosNuevos,
    })
  } catch (err) {
    console.error('[POST /api/checkin/diario] unexpected error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
