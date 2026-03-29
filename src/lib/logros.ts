export interface LogroConfig {
  key: string
  emoji: string
  nombre: string
  descripcion: string
}

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
}

export interface RegistroParaLogros {
  semana_inicio: string
  score: number | null
  sueno: number | null
  actividad_fisica: number | null
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
