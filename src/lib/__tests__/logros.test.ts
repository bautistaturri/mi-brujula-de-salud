import { describe, it, expect } from 'vitest'
import { evaluarLogros } from '../logros'
import type { RegistroParaLogros } from '../logros'

function makeRegistro(semana_inicio: string, score: number, sueno = 3, actividad_fisica = 3): RegistroParaLogros {
  return { semana_inicio, score, sueno, actividad_fisica }
}

// Helper: genera N semanas consecutivas hacia atrás desde una fecha base
function semanasConsecutivas(n: number, desde = '2024-12-02', score = 70, sueno = 3, actividad_fisica = 3): RegistroParaLogros[] {
  return Array.from({ length: n }, (_, i) => {
    const base = new Date(desde)
    base.setDate(base.getDate() - i * 7)
    return makeRegistro(base.toISOString().split('T')[0], score, sueno, actividad_fisica)
  })
}

describe('evaluarLogros — primera_semana', () => {
  it('se otorga cuando hay exactamente 1 registro y no lo tiene aún', () => {
    const registros = [makeRegistro('2024-12-02', 70)]
    expect(evaluarLogros(registros, [])).toContain('primera_semana')
  })

  it('NO se otorga si ya lo tiene', () => {
    const registros = [makeRegistro('2024-12-02', 70)]
    expect(evaluarLogros(registros, ['primera_semana'])).not.toContain('primera_semana')
  })

  it('NO se otorga si hay más de 1 registro (ya no es el primero)', () => {
    const registros = semanasConsecutivas(2)
    expect(evaluarLogros(registros, [])).not.toContain('primera_semana')
  })
})

describe('evaluarLogros — racha_3', () => {
  it('se otorga con 3 semanas consecutivas', () => {
    expect(evaluarLogros(semanasConsecutivas(3), [])).toContain('racha_3')
  })

  it('NO se otorga con solo 2 semanas consecutivas', () => {
    expect(evaluarLogros(semanasConsecutivas(2), [])).not.toContain('racha_3')
  })

  it('NO se otorga si ya lo tiene', () => {
    expect(evaluarLogros(semanasConsecutivas(3), ['racha_3'])).not.toContain('racha_3')
  })

  it('NO se otorga si las semanas no son consecutivas', () => {
    const registros = [
      makeRegistro('2024-12-02', 70),
      makeRegistro('2024-11-18', 70), // gap de 2 semanas
      makeRegistro('2024-11-11', 70),
    ]
    expect(evaluarLogros(registros, [])).not.toContain('racha_3')
  })
})

describe('evaluarLogros — constancia_total', () => {
  it('se otorga con 8 semanas consecutivas', () => {
    expect(evaluarLogros(semanasConsecutivas(8), [])).toContain('constancia_total')
  })

  it('también otorga racha_3 si no la tiene', () => {
    const logros = evaluarLogros(semanasConsecutivas(8), [])
    expect(logros).toContain('constancia_total')
    expect(logros).toContain('racha_3')
  })

  it('NO se otorga con 7 semanas', () => {
    expect(evaluarLogros(semanasConsecutivas(7), [])).not.toContain('constancia_total')
  })
})

describe('evaluarLogros — semana_perfecta', () => {
  it('se otorga con score >= 90 en el último registro', () => {
    const registros = [makeRegistro('2024-12-02', 92)]
    expect(evaluarLogros(registros, [])).toContain('semana_perfecta')
  })

  it('NO se otorga con score < 90', () => {
    const registros = [makeRegistro('2024-12-02', 89)]
    expect(evaluarLogros(registros, [])).not.toContain('semana_perfecta')
  })

  it('exactamente 90 es suficiente', () => {
    const registros = [makeRegistro('2024-12-02', 90)]
    expect(evaluarLogros(registros, [])).toContain('semana_perfecta')
  })

  it('evalúa el último registro (más reciente), no el primero', () => {
    const registros = [
      makeRegistro('2024-12-02', 50),  // más reciente (sorted[0])
      makeRegistro('2024-11-25', 95),  // anterior
    ]
    expect(evaluarLogros(registros, [])).not.toContain('semana_perfecta')
  })
})

describe('evaluarLogros — atleta', () => {
  it('se otorga con actividad_fisica >= 6', () => {
    const registros = [makeRegistro('2024-12-02', 70, 3, 6)]
    expect(evaluarLogros(registros, [])).toContain('atleta')
  })

  it('se otorga con actividad_fisica = 7', () => {
    const registros = [makeRegistro('2024-12-02', 70, 3, 7)]
    expect(evaluarLogros(registros, [])).toContain('atleta')
  })

  it('NO se otorga con actividad_fisica = 5', () => {
    const registros = [makeRegistro('2024-12-02', 70, 3, 5)]
    expect(evaluarLogros(registros, [])).not.toContain('atleta')
  })
})

describe('evaluarLogros — descanso_maestro', () => {
  it('se otorga con sueño=5 en las últimas 3 semanas consecutivas', () => {
    const registros = semanasConsecutivas(3, '2024-12-02', 70, 5)
    expect(evaluarLogros(registros, [])).toContain('descanso_maestro')
  })

  it('NO se otorga si alguna de las 3 últimas semanas tiene sueño < 5', () => {
    const registros = [
      makeRegistro('2024-12-02', 70, 5),
      makeRegistro('2024-11-25', 70, 4),  // sueño=4 rompe la racha
      makeRegistro('2024-11-18', 70, 5),
    ]
    expect(evaluarLogros(registros, [])).not.toContain('descanso_maestro')
  })

  it('NO se otorga con menos de 3 registros', () => {
    const registros = semanasConsecutivas(2, '2024-12-02', 70, 5)
    expect(evaluarLogros(registros, [])).not.toContain('descanso_maestro')
  })
})

describe('evaluarLogros — en_ascenso', () => {
  it('se otorga cuando score sube 3 semanas seguidas', () => {
    const registros = [
      makeRegistro('2024-12-02', 80),  // sorted[0] - más reciente
      makeRegistro('2024-11-25', 70),  // sorted[1]
      makeRegistro('2024-11-18', 60),  // sorted[2]
    ]
    expect(evaluarLogros(registros, [])).toContain('en_ascenso')
  })

  it('NO se otorga si el score baja entre alguna semana', () => {
    const registros = [
      makeRegistro('2024-12-02', 80),
      makeRegistro('2024-11-25', 70),
      makeRegistro('2024-11-18', 75),  // mayor que sorted[1] — no hay ascenso continuo
    ]
    expect(evaluarLogros(registros, [])).not.toContain('en_ascenso')
  })

  it('NO se otorga con menos de 3 registros', () => {
    const registros = [
      makeRegistro('2024-12-02', 80),
      makeRegistro('2024-11-25', 60),
    ]
    expect(evaluarLogros(registros, [])).not.toContain('en_ascenso')
  })

  it('NO se otorga si ya lo tiene', () => {
    const registros = [
      makeRegistro('2024-12-02', 80),
      makeRegistro('2024-11-25', 70),
      makeRegistro('2024-11-18', 60),
    ]
    expect(evaluarLogros(registros, ['en_ascenso'])).not.toContain('en_ascenso')
  })
})

describe('evaluarLogros — edge cases', () => {
  it('lista vacía no lanza error y devuelve []', () => {
    expect(() => evaluarLogros([], [])).not.toThrow()
    expect(evaluarLogros([], [])).toEqual([])
  })

  it('no otorga logros que ya se tienen', () => {
    const todos = ['primera_semana', 'racha_3', 'constancia_total', 'semana_perfecta', 'atleta', 'descanso_maestro', 'en_ascenso']
    const registros = semanasConsecutivas(8, '2024-12-02', 95, 5, 7)
    expect(evaluarLogros(registros, todos)).toEqual([])
  })

  it('puede otorgar múltiples logros en una misma evaluación', () => {
    // primer registro con score >= 90 y actividad_fisica >= 6
    const registros = [makeRegistro('2024-12-02', 92, 3, 7)]
    const logros = evaluarLogros(registros, [])
    expect(logros).toContain('primera_semana')
    expect(logros).toContain('semana_perfecta')
    expect(logros).toContain('atleta')
  })
})
