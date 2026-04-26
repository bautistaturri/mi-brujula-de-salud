import { createClient } from '@/lib/supabase/server'
import { RegistroDiarioSchema } from '@/lib/validations'
import { evaluarLogrosDiarios, LOGROS_CONFIG } from '@/lib/logros'
import type { RegistroDiarioParaLogros } from '@/lib/logros'
import { NextResponse } from 'next/server'

// ── Rate limiting en memoria (por user_id) ───────────────────────────────
// Límite: 3 intentos por usuario por ventana de 24 horas
// ⚠️  LIMITACIÓN: En Vercel serverless cada invocación puede arrancar en un proceso
// nuevo, por lo que este Map NO persiste entre requests fríos. El rate limiting
// es efectivo dentro de una misma instancia caliente pero NO entre cold starts.
// Para un límite real en producción con muchos usuarios: @upstash/ratelimit + Redis.
// La protección principal contra duplicados es la constraint UNIQUE(paciente_id, fecha)
// en la tabla registros_diarios (verificada en la query de "existente" más abajo).
const RL_WINDOW_MS = 24 * 60 * 60 * 1000  // 24 horas
const RL_MAX       = 3                      // máx 3 registros diarios

const rateLimitStore = new Map<string, { count: number; windowStart: number }>()

function checkRateLimit(userId: string): { ok: boolean; remaining: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(userId)

  if (!entry || now - entry.windowStart > RL_WINDOW_MS) {
    // Purge entradas expiradas para evitar memory leak en servidores long-lived
    if (rateLimitStore.size > 500) {
      Array.from(rateLimitStore.entries()).forEach(([key, val]) => {
        if (now - val.windowStart > RL_WINDOW_MS) rateLimitStore.delete(key)
      })
    }
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

    // Insertar logros nuevos (upsert para ignorar conflictos por race conditions)
    if (logrosNuevosKeys.length > 0) {
      await supabase
        .from('logros_paciente')
        .upsert(
          logrosNuevosKeys.map(key => ({
            paciente_id: user.id,
            logro_key:   key,
            video_visto: false,
          })),
          { onConflict: 'paciente_id,logro_key', ignoreDuplicates: true }
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
