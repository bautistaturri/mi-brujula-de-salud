// Esquemas de validación centralizados con Zod.
// Usar en formularios (cliente) Y en Server Actions / API routes (servidor).
// Nunca confiar solo en la validación del cliente.
import { z } from 'zod'

// ── Texto libre sanitizado ──────────────────────────────────────────────────
// Elimina caracteres de control y limita longitud para prevenir inyecciones
const textoOpcional = (maxLen: number) =>
  z
    .string()
    .max(maxLen, `Máximo ${maxLen} caracteres`)
    .transform(s => s.trim())
    .optional()
    .or(z.literal(''))

// ── Auth ────────────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  nombre: z
    .string()
    .min(2, 'Ingresá tu nombre completo')
    .max(100, 'Nombre demasiado largo')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'El nombre solo puede contener letras'),
  email: z
    .string()
    .email('Email inválido')
    .max(255, 'Email demasiado largo')
    .toLowerCase(),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .max(72, 'Contraseña demasiado larga'), // bcrypt limit
  role: z.enum(['paciente', 'facilitador']),
})

export const LoginSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase(),
  password: z.string().min(1, 'Ingresá tu contraseña'),
})

// ── Check-in diario ─────────────────────────────────────────────────────────

export const CheckinSchema = z.object({
  conductas_completadas: z.array(z.string().uuid()).max(20),
  iem: z.number().int().min(1).max(7),
  emocion: z.enum(['😄', '🙂', '😐', '😔', '😰']),
  notas: textoOpcional(300),
  turno: z.enum(['manana', 'noche']),
})

export type CheckinInput = z.infer<typeof CheckinSchema>

// ── Registro semanal ─────────────────────────────────────────────────────────

export const RegistroSemanalSchema = z.object({
  animo:           z.number().int().min(1).max(5),
  sueno:           z.number().int().min(1).max(5),
  energia:         z.number().int().min(1).max(5),
  alimentacion:    z.number().int().min(1).max(5),
  actividad_fisica: z.number().int().min(0).max(7),
  adherencia_medicacion: z.enum(['si', 'no', 'no_aplica']),
  sintomas:         textoOpcional(500),
  logro_personal:   textoOpcional(500),
  dificultad:       textoOpcional(500),
  semana_inicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),
  semana_fin: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),
})

export type RegistroSemanalInput = z.infer<typeof RegistroSemanalSchema>

// ── Perfil / WhatsApp ────────────────────────────────────────────────────────

export const WhatsappSchema = z.object({
  whatsapp: z
    .string()
    .regex(/^\d{7,15}$/, 'Ingresá solo dígitos (7-15 caracteres). Ej: 5491112345678')
    .or(z.literal('')),
})

export type WhatsappInput = z.infer<typeof WhatsappSchema>

// ── Grupos ───────────────────────────────────────────────────────────────────

export const GrupoSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre del grupo es requerido')
    .max(100, 'Nombre demasiado largo'),
  descripcion: textoOpcional(300),
})

export type GrupoInput = z.infer<typeof GrupoSchema>

export const EmailPacienteSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase(),
})

// ── Password reset ───────────────────────────────────────────────────────────

export const UpdatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .max(72, 'Contraseña demasiado larga'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export type UpdatePasswordInput = z.infer<typeof UpdatePasswordSchema>

// ── Registro diario ──────────────────────────────────────────────────────────

export const RegistroDiarioSchema = z.object({
  energia_dia:   z.number().int().min(1).max(5),
  animo_dia:     z.number().int().min(1).max(5),
  // 1 a 5 booleans (según cuántas conductas ancla tenga el paciente)
  conductas_hoy: z.array(z.boolean()).min(1).max(5),
  nota_libre:    textoOpcional(280),
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),
})

export type RegistroDiarioInput = z.infer<typeof RegistroDiarioSchema>

// ── Conducta ancla ───────────────────────────────────────────────────────────

export const ConductaSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre de la conducta es requerido')
    .max(80, 'Nombre demasiado largo'),
  icono: z.string().max(10, 'Icono inválido'),
})
