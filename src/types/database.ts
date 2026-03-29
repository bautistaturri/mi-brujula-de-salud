export type Role = 'paciente' | 'facilitador'
export type Semaforo = 'verde' | 'amarillo' | 'rojo'
export type Emocion = '😄' | '🙂' | '😐' | '😔' | '😰'
export type Turno = 'manana' | 'noche'
export type TipoAlerta = 'ausencia' | 'iem_bajo' | 'semaforo_rojo' | 'racha_rota' | 'riesgo_alto'
export type PrioridadAlerta = 'urgente' | 'observacion'

export interface User {
  id: string
  email: string
  nombre: string
  role: Role
  avatar_url: string | null
  whatsapp: string | null
  onboarding_completado: boolean
  created_at: string
  updated_at: string
}

export interface ConductaAncla {
  id: string
  user_id: string
  nombre: string
  icono: string
  orden: number
  activa: boolean
  created_at: string
}

export interface Checkin {
  id: string
  user_id: string
  fecha: string
  turno: Turno
  conductas_completadas: string[]
  iem: number
  emocion: Emocion
  semaforo: Semaforo
  notas: string | null
  created_at: string
  updated_at: string
}

export interface Grupo {
  id: string
  nombre: string
  descripcion: string | null
  facilitador_id: string
  activo: boolean
  created_at: string
}

export interface GrupoMiembro {
  grupo_id: string
  user_id: string
  fecha_ingreso: string
  activo: boolean
}

export interface Alerta {
  id: string
  user_id: string
  tipo: TipoAlerta
  descripcion: string
  fecha: string
  resuelta: boolean
  resuelta_at: string | null
  resuelta_por: string | null
  prioridad: PrioridadAlerta
  created_at: string
}

export interface EstadoPaciente {
  id: string
  nombre: string
  email: string
  avatar_url: string | null
  ultimo_checkin: string | null
  iem: number | null
  emocion: Emocion | null
  semaforo: Semaforo | null
  conductas_completadas: number | null
  racha_actual: number
  score_riesgo: number
  alertas_pendientes: number
  grupo_id: string
}

// Tipos para inserción
export type InsertCheckin = Omit<Checkin, 'id' | 'created_at' | 'updated_at'>
export type InsertAlerta = Omit<Alerta, 'id' | 'created_at' | 'resuelta_at' | 'resuelta_por'>

// calcularSemaforo vive en utils.ts — re-exportada para compatibilidad
export { calcularSemaforo } from '@/lib/utils'

// Registro semanal
export type AdherenciaMedicacion = 'si' | 'no' | 'no_aplica'

export interface RegistroSemanal {
  id: string
  paciente_id: string
  semana_inicio: string
  semana_fin: string
  animo: number
  sueno: number
  energia: number
  alimentacion: number
  actividad_fisica: number
  adherencia_medicacion: AdherenciaMedicacion
  sintomas: string | null
  logro_personal: string | null
  dificultad: string | null
  score: number | null
  nivel_bienestar: string | null
  requiere_atencion: boolean
  created_at: string
}

export type InsertRegistroSemanal = Omit<RegistroSemanal, 'id' | 'created_at'>

// Logros
export interface LogroPaciente {
  id: string
  paciente_id: string
  logro_key: string
  desbloqueado_at: string
}

// Tipos para el formulario de check-in
export interface CheckinFormData {
  conductas_completadas: string[]
  iem: number
  emocion: Emocion
  notas?: string
}

export const EMOCIONES: { emoji: Emocion; label: string }[] = [
  { emoji: '😄', label: 'Muy bien' },
  { emoji: '🙂', label: 'Bien' },
  { emoji: '😐', label: 'Regular' },
  { emoji: '😔', label: 'Mal' },
  { emoji: '😰', label: 'Muy mal' },
]

export const SEMAFORO_CONFIG = {
  verde: {
    label: 'Bien',
    color: '#3D6B4F',
    bg: 'bg-semaforo-verde-bg',
    text: 'text-semaforo-verde',
    border: 'border-semaforo-verde-border',
  },
  amarillo: {
    label: 'Atención',
    color: '#92671A',
    bg: 'bg-semaforo-amarillo-bg',
    text: 'text-semaforo-amarillo',
    border: 'border-semaforo-amarillo-border',
  },
  rojo: {
    label: 'Alerta',
    color: '#8B2635',
    bg: 'bg-semaforo-rojo-bg',
    text: 'text-semaforo-rojo',
    border: 'border-semaforo-rojo-border',
  },
} as const
