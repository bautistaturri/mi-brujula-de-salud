import { describe, it, expect } from 'vitest'
import {
  RegisterSchema,
  LoginSchema,
  RegistroDiarioSchema,
  RegistroSemanalSchema,
  CheckinSchema,
  UpdatePasswordSchema,
  WhatsappSchema,
  GrupoSchema,
} from '../validations'

// ── RegisterSchema ────────────────────────────────────────────────

describe('RegisterSchema', () => {
  const valid = { nombre: 'Ana García', email: 'Ana@Test.COM', password: 'secreto123', role: 'paciente' as const }

  it('acepta datos válidos de paciente', () => {
    expect(RegisterSchema.safeParse(valid).success).toBe(true)
  })

  it('acepta datos válidos de facilitador', () => {
    expect(RegisterSchema.safeParse({ ...valid, role: 'facilitador' }).success).toBe(true)
  })

  it('normaliza email a minúsculas', () => {
    const result = RegisterSchema.safeParse(valid)
    expect(result.success && result.data.email).toBe('ana@test.com')
  })

  it('rechaza nombre con menos de 2 caracteres', () => {
    expect(RegisterSchema.safeParse({ ...valid, nombre: 'A' }).success).toBe(false)
  })

  it('rechaza nombre con números', () => {
    expect(RegisterSchema.safeParse({ ...valid, nombre: 'Ana123' }).success).toBe(false)
  })

  it('rechaza email inválido', () => {
    expect(RegisterSchema.safeParse({ ...valid, email: 'no-es-email' }).success).toBe(false)
  })

  it('rechaza password menor a 8 caracteres', () => {
    expect(RegisterSchema.safeParse({ ...valid, password: 'corta' }).success).toBe(false)
  })

  it('rechaza role no permitido', () => {
    expect(RegisterSchema.safeParse({ ...valid, role: 'admin' }).success).toBe(false)
  })
})

// ── LoginSchema ───────────────────────────────────────────────────

describe('LoginSchema', () => {
  it('acepta credenciales válidas', () => {
    expect(LoginSchema.safeParse({ email: 'user@test.com', password: 'cualquiera' }).success).toBe(true)
  })

  it('normaliza email a minúsculas', () => {
    const result = LoginSchema.safeParse({ email: 'USER@TEST.COM', password: 'x' })
    expect(result.success && result.data.email).toBe('user@test.com')
  })

  it('rechaza password vacío', () => {
    expect(LoginSchema.safeParse({ email: 'user@test.com', password: '' }).success).toBe(false)
  })

  it('rechaza email inválido', () => {
    expect(LoginSchema.safeParse({ email: 'mal', password: 'abc' }).success).toBe(false)
  })
})

// ── RegistroDiarioSchema ──────────────────────────────────────────

describe('RegistroDiarioSchema', () => {
  const valid = {
    energia_dia: 4,
    animo_dia: 3,
    conductas_hoy: [true, false, true, false, true],
    fecha: '2025-01-20',
  }

  it('acepta un registro diario válido', () => {
    expect(RegistroDiarioSchema.safeParse(valid).success).toBe(true)
  })

  it('acepta nota_libre opcional', () => {
    expect(RegistroDiarioSchema.safeParse({ ...valid, nota_libre: 'Fue un buen día' }).success).toBe(true)
  })

  it('rechaza energia_dia fuera de rango (0)', () => {
    expect(RegistroDiarioSchema.safeParse({ ...valid, energia_dia: 0 }).success).toBe(false)
  })

  it('rechaza energia_dia fuera de rango (6)', () => {
    expect(RegistroDiarioSchema.safeParse({ ...valid, energia_dia: 6 }).success).toBe(false)
  })

  it('rechaza animo_dia fuera de rango', () => {
    expect(RegistroDiarioSchema.safeParse({ ...valid, animo_dia: 6 }).success).toBe(false)
  })

  it('rechaza conductas_hoy vacío', () => {
    expect(RegistroDiarioSchema.safeParse({ ...valid, conductas_hoy: [] }).success).toBe(false)
  })

  it('rechaza conductas_hoy con más de 5 elementos', () => {
    expect(RegistroDiarioSchema.safeParse({ ...valid, conductas_hoy: [true, true, true, true, true, true] }).success).toBe(false)
  })

  it('rechaza fecha con formato inválido', () => {
    expect(RegistroDiarioSchema.safeParse({ ...valid, fecha: '20-01-2025' }).success).toBe(false)
    expect(RegistroDiarioSchema.safeParse({ ...valid, fecha: 'hoy' }).success).toBe(false)
  })

  it('acepta fecha en formato YYYY-MM-DD', () => {
    expect(RegistroDiarioSchema.safeParse({ ...valid, fecha: '2025-12-31' }).success).toBe(true)
  })
})

// ── RegistroSemanalSchema ─────────────────────────────────────────

describe('RegistroSemanalSchema', () => {
  const valid = {
    animo: 4, sueno: 3, energia: 4, alimentacion: 3, actividad_fisica: 5,
    adherencia_medicacion: 'no_aplica' as const,
    semana_inicio: '2025-01-20',
    semana_fin: '2025-01-26',
  }

  it('acepta un registro semanal válido', () => {
    expect(RegistroSemanalSchema.safeParse(valid).success).toBe(true)
  })

  it('acepta adherencia_medicacion: si / no / no_aplica', () => {
    expect(RegistroSemanalSchema.safeParse({ ...valid, adherencia_medicacion: 'si' }).success).toBe(true)
    expect(RegistroSemanalSchema.safeParse({ ...valid, adherencia_medicacion: 'no' }).success).toBe(true)
  })

  it('rechaza adherencia_medicacion inválida', () => {
    expect(RegistroSemanalSchema.safeParse({ ...valid, adherencia_medicacion: 'tal_vez' }).success).toBe(false)
  })

  it('rechaza animo fuera de rango [1-5]', () => {
    expect(RegistroSemanalSchema.safeParse({ ...valid, animo: 0 }).success).toBe(false)
    expect(RegistroSemanalSchema.safeParse({ ...valid, animo: 6 }).success).toBe(false)
  })

  it('acepta actividad_fisica = 0 (ningún día)', () => {
    expect(RegistroSemanalSchema.safeParse({ ...valid, actividad_fisica: 0 }).success).toBe(true)
  })

  it('rechaza actividad_fisica > 7', () => {
    expect(RegistroSemanalSchema.safeParse({ ...valid, actividad_fisica: 8 }).success).toBe(false)
  })

  it('rechaza fechas con formato inválido', () => {
    expect(RegistroSemanalSchema.safeParse({ ...valid, semana_inicio: '01/20/2025' }).success).toBe(false)
  })
})

// ── CheckinSchema ─────────────────────────────────────────────────

describe('CheckinSchema', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000'
  const valid = {
    conductas_completadas: [validUUID],
    iem: 5,
    emocion: '😄' as const,
    turno: 'manana' as const,
  }

  it('acepta check-in válido', () => {
    expect(CheckinSchema.safeParse(valid).success).toBe(true)
  })

  it('acepta iem en rango [1-7]', () => {
    for (let i = 1; i <= 7; i++) {
      expect(CheckinSchema.safeParse({ ...valid, iem: i }).success).toBe(true)
    }
  })

  it('rechaza iem fuera de rango', () => {
    expect(CheckinSchema.safeParse({ ...valid, iem: 0 }).success).toBe(false)
    expect(CheckinSchema.safeParse({ ...valid, iem: 8 }).success).toBe(false)
  })

  it('rechaza emocion no permitida', () => {
    expect(CheckinSchema.safeParse({ ...valid, emocion: '😤' }).success).toBe(false)
  })

  it('acepta todas las emociones permitidas', () => {
    for (const emocion of ['😄', '🙂', '😐', '😔', '😰']) {
      expect(CheckinSchema.safeParse({ ...valid, emocion }).success).toBe(true)
    }
  })

  it('rechaza turno inválido', () => {
    expect(CheckinSchema.safeParse({ ...valid, turno: 'tarde' }).success).toBe(false)
  })

  it('rechaza conductas con IDs no UUID', () => {
    expect(CheckinSchema.safeParse({ ...valid, conductas_completadas: ['no-uuid'] }).success).toBe(false)
  })
})

// ── UpdatePasswordSchema ──────────────────────────────────────────

describe('UpdatePasswordSchema', () => {
  it('acepta contraseñas iguales de 8+ caracteres', () => {
    expect(UpdatePasswordSchema.safeParse({ password: 'nuevaClave123', confirmPassword: 'nuevaClave123' }).success).toBe(true)
  })

  it('rechaza contraseñas que no coinciden', () => {
    const result = UpdatePasswordSchema.safeParse({ password: 'clave1234', confirmPassword: 'clave9999' })
    expect(result.success).toBe(false)
  })

  it('rechaza contraseña menor a 8 caracteres', () => {
    expect(UpdatePasswordSchema.safeParse({ password: 'corta', confirmPassword: 'corta' }).success).toBe(false)
  })
})

// ── WhatsappSchema ────────────────────────────────────────────────

describe('WhatsappSchema', () => {
  it('acepta número argentino válido', () => {
    expect(WhatsappSchema.safeParse({ whatsapp: '5491112345678' }).success).toBe(true)
  })

  it('acepta string vacío (opcional)', () => {
    expect(WhatsappSchema.safeParse({ whatsapp: '' }).success).toBe(true)
  })

  it('rechaza letras', () => {
    expect(WhatsappSchema.safeParse({ whatsapp: '549abc123' }).success).toBe(false)
  })

  it('rechaza número muy corto (< 7 dígitos)', () => {
    expect(WhatsappSchema.safeParse({ whatsapp: '12345' }).success).toBe(false)
  })
})

// ── GrupoSchema ───────────────────────────────────────────────────

describe('GrupoSchema', () => {
  it('acepta nombre válido', () => {
    expect(GrupoSchema.safeParse({ nombre: 'Grupo A' }).success).toBe(true)
  })

  it('rechaza nombre menor a 2 caracteres', () => {
    expect(GrupoSchema.safeParse({ nombre: 'A' }).success).toBe(false)
  })

  it('acepta descripción opcional', () => {
    expect(GrupoSchema.safeParse({ nombre: 'Grupo B', descripcion: 'Una descripción' }).success).toBe(true)
  })
})
