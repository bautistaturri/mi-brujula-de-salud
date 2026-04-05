export interface LogroConfig {
  key: string
  emoji: string
  nombre: string
  descripcion: string
}

// ── Logros semanales (basados en registros_semanales) ─────────────────────
export const LOGROS_CONFIG: Record<string, LogroConfig> = {
  primera_semana: {
    key: 'primera_semana',
    emoji: '🥇',
    nombre: 'Primera semana',
    descripcion: 'Completaste tu primer registro semanal',
  },
  racha_3: {
    key: 'racha_3',
    emoji: '🔥',
    nombre: 'Racha de 3',
    descripcion: '3 semanas consecutivas completadas',
  },
  constancia_total: {
    key: 'constancia_total',
    emoji: '🏆',
    nombre: 'Constancia total',
    descripcion: '8 semanas consecutivas completadas',
  },
  semana_perfecta: {
    key: 'semana_perfecta',
    emoji: '⭐',
    nombre: 'Semana perfecta',
    descripcion: 'Score de 90 o más en una semana',
  },
  atleta: {
    key: 'atleta',
    emoji: '💪',
    nombre: 'Atleta',
    descripcion: 'Actividad física 6 o 7 días en una semana',
  },
  descanso_maestro: {
    key: 'descanso_maestro',
    emoji: '😴',
    nombre: 'Descanso maestro',
    descripcion: 'Calidad de sueño perfecta (5/5) tres semanas seguidas',
  },
  en_ascenso: {
    key: 'en_ascenso',
    emoji: '📈',
    nombre: 'En ascenso',
    descripcion: 'Score mayor que la semana anterior 3 veces seguidas',
  },
  // ── Logros diarios ──────────────────────────────────────────────────────
  primer_dia: {
    key: 'primer_dia',
    emoji: '🌱',
    nombre: 'Primer día',
    descripcion: 'Completaste tu primer registro diario',
  },
  semana_completa: {
    key: 'semana_completa',
    emoji: '📅',
    nombre: 'Semana completa',
    descripcion: '7 registros diarios en una semana calendario',
  },
  constancia_diaria: {
    key: 'constancia_diaria',
    emoji: '🔗',
    nombre: 'Constancia diaria',
    descripcion: '14 días consecutivos con registro diario',
  },
  madrugador: {
    key: 'madrugador',
    emoji: '🌅',
    nombre: 'Madrugador',
    descripcion: '3 registros diarios completados antes de las 9am',
  },
  reflexivo: {
    key: 'reflexivo',
    emoji: '✍️',
    nombre: 'Reflexivo',
    descripcion: '10 notas libres escritas en registros diarios',
  },
}

// ── Tipo de registro para evaluación de logros semanales ─────────────────
export interface RegistroParaLogros {
  semana_inicio: string
  score: number | null
  sueno: number | null
  actividad_fisica: number | null
}

// ── Tipo de registro para evaluación de logros diarios ───────────────────
export interface RegistroDiarioParaLogros {
  fecha: string         // YYYY-MM-DD
  nota_libre: string | null
  created_at: string    // para detectar hora del registro (madrugador)
}

function semanasConsecutivas(registros: RegistroParaLogros[]): number {
  if (registros.length === 0) return 0
  const sorted = [...registros].sort(
    (a, b) => new Date(b.semana_inicio).getTime() - new Date(a.semana_inicio).getTime()
  )
  let count = 1
  for (let i = 1; i < sorted.length; i++) {
    const diffDias =
      (new Date(sorted[i - 1].semana_inicio).getTime() -
        new Date(sorted[i].semana_inicio).getTime()) /
      86400000
    if (Math.round(diffDias) === 7) count++
    else break
  }
  return count
}

// ── Evalúa logros SEMANALES — fuente de verdad: tests en __tests__/logros.test.ts ──
// Retorna array de keys de logros NUEVOS (no incluye los ya obtenidos)
export function evaluarLogros(
  todosRegistros: RegistroParaLogros[],
  logrosYaObtenidos: string[]
): string[] {
  const nuevos: string[] = []
  function falta(key: string) {
    return !logrosYaObtenidos.includes(key)
  }

  const sorted = [...todosRegistros].sort(
    (a, b) => new Date(b.semana_inicio).getTime() - new Date(a.semana_inicio).getTime()
  )
  const ultimo = sorted[0]

  // 🥇 Primera semana
  if (falta('primera_semana') && todosRegistros.length === 1) {
    nuevos.push('primera_semana')
  }

  // 🔥 Racha de 3
  if (falta('racha_3') && semanasConsecutivas(todosRegistros) >= 3) {
    nuevos.push('racha_3')
  }

  // 🏆 Constancia total
  if (falta('constancia_total') && semanasConsecutivas(todosRegistros) >= 8) {
    nuevos.push('constancia_total')
  }

  // ⭐ Semana perfecta
  if (falta('semana_perfecta') && (ultimo?.score ?? 0) >= 90) {
    nuevos.push('semana_perfecta')
  }

  // 💪 Atleta
  if (falta('atleta') && (ultimo?.actividad_fisica ?? 0) >= 6) {
    nuevos.push('atleta')
  }

  // 😴 Descanso maestro — sueño = 5 tres semanas seguidas
  if (falta('descanso_maestro') && sorted.length >= 3) {
    const recientes = sorted.slice(0, 3)
    if (recientes.every(r => r.sueno === 5)) {
      nuevos.push('descanso_maestro')
    }
  }

  // 📈 En ascenso — score mayor 3 veces seguidas
  if (falta('en_ascenso') && sorted.length >= 3) {
    const [r1, r2, r3] = sorted
    if ((r1.score ?? 0) > (r2.score ?? 0) && (r2.score ?? 0) > (r3.score ?? 0)) {
      nuevos.push('en_ascenso')
    }
  }

  return nuevos
}

// ── Evalúa logros DIARIOS ──────────────────────────────────────────────────
// Retorna array de keys de logros diarios NUEVOS
export function evaluarLogrosDiarios(
  todosRegistrosDiarios: RegistroDiarioParaLogros[],
  logrosYaObtenidos: string[]
): string[] {
  const nuevos: string[] = []
  function falta(key: string) {
    return !logrosYaObtenidos.includes(key)
  }

  const total = todosRegistrosDiarios.length
  if (total === 0) return nuevos

  // 🌱 Primer día
  if (falta('primer_dia') && total === 1) {
    nuevos.push('primer_dia')
  }

  // 📅 Semana completa — 7 registros en una misma semana calendario
  // Una semana va de lunes a domingo (ISO)
  if (falta('semana_completa') && total >= 7) {
    const porSemana = new Map<string, number>()
    for (const r of todosRegistrosDiarios) {
      const semana = getISOWeekKey(r.fecha)
      porSemana.set(semana, (porSemana.get(semana) ?? 0) + 1)
    }
    if (Array.from(porSemana.values()).some(count => count >= 7)) {
      nuevos.push('semana_completa')
    }
  }

  // 🔗 Constancia diaria — 14 días consecutivos
  if (falta('constancia_diaria') && total >= 14) {
    const sorted = [...todosRegistrosDiarios].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    )
    if (diasConsecutivos(sorted) >= 14) {
      nuevos.push('constancia_diaria')
    }
  }

  // 🌅 Madrugador — 3 registros antes de las 9am
  // Detecta por el campo created_at (hora local del servidor, UTC)
  if (falta('madrugador') && total >= 3) {
    const antesDeNueve = todosRegistrosDiarios.filter(r => {
      const hora = new Date(r.created_at).getHours()
      return hora < 9  // hora UTC; ajustar si el servidor está en zona horaria local
    })
    if (antesDeNueve.length >= 3) {
      nuevos.push('madrugador')
    }
  }

  // ✍️ Reflexivo — 10 notas libres escritas
  if (falta('reflexivo')) {
    const conNota = todosRegistrosDiarios.filter(
      r => r.nota_libre && r.nota_libre.trim().length > 0
    ).length
    if (conNota >= 10) {
      nuevos.push('reflexivo')
    }
  }

  return nuevos
}

// ── Helpers ───────────────────────────────────────────────────────────────

// Retorna clave ISO semana "YYYY-Www" para agrupar registros por semana
function getISOWeekKey(fechaStr: string): string {
  const d = new Date(fechaStr + 'T00:00:00')
  const jan4 = new Date(d.getFullYear(), 0, 4)
  const startOfWeek1 = new Date(jan4)
  startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7))
  const weekNum = Math.floor(
    (d.getTime() - startOfWeek1.getTime()) / (7 * 86400000) + 1
  )
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

// Cuenta días consecutivos desde el más reciente hacia atrás
function diasConsecutivos(sorted: RegistroDiarioParaLogros[]): number {
  if (sorted.length === 0) return 0
  let count = 1
  for (let i = 1; i < sorted.length; i++) {
    const diffMs =
      new Date(sorted[i - 1].fecha + 'T00:00:00').getTime() -
      new Date(sorted[i].fecha + 'T00:00:00').getTime()
    if (Math.round(diffMs / 86400000) === 1) count++
    else break
  }
  return count
}
