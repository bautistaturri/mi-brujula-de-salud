export type Role = 'paciente' | 'facilitador'
export type Semaforo = 'verde' | 'amarillo' | 'rojo'
export type Emocion = '😄' | '🙂' | '😐' | '😔' | '😰'
export type Turno = 'manana' | 'noche'

// ── Sistema ICS (databrujula) ──────────────────────────────────
// Semáforo ICS — inglés (motor_ics.ts), distinto al español de display
export type SemaforoICS = 'green' | 'amber' | 'red'

// Tipos de alertas del motor ICS (alert_engine.ts)
export type AlertType =
  | 'missing_checkin'
  | 'red_semaphore'
  | 'amber_circumstantial'
  | 'amber_systemic'
  | 'be_critical'
  | 'ica_zero'
  | 'ini_saboteador_streak'
  | 'green_with_low_ica'
  | 'green_streak_milestone'
  | 'combined_risk'

export type AlertColor = 'red' | 'amber' | 'celebration' | 'internal'

// TipoAlerta legacy (tabla alertas antigua — conservada por compatibilidad)
export type TipoAlerta = 'ausencia' | 'iem_bajo' | 'semaforo_rojo' | 'racha_rota' | 'riesgo_alto'
export type PrioridadAlerta = 'urgente' | 'observacion'

export type EmocionPrincipal = 'alegre' | 'en_calma' | 'sensible' | 'preocupado' | 'cansado' | 'esperanzado'

export interface User {
  id: string
  email: string
  nombre: string
  role: Role
  avatar_url: string | null
  whatsapp: string | null
  onboarding_completado: boolean
  // ── Perfil clínico basal (migración 012) ──
  peso_inicial: number | null
  altura: number | null
  toma_medicacion: boolean | null
  detalle_medicacion: string | null
  antec_tabaquismo: boolean
  antec_alcohol: boolean
  antec_otras_sustancias: boolean
  antec_cirugia: boolean
  antec_cancer: boolean
  antec_tiroides: boolean
  antec_otros: string | null
  onboarding_clinico_completado: boolean
  created_at: string
  updated_at: string
}

// Perfil clínico parcial para formularios (solo los campos editables)
export interface PerfilClinicoInput {
  peso_inicial?: number | null
  altura?: number | null
  toma_medicacion?: boolean | null
  detalle_medicacion?: string | null
  antec_tabaquismo?: boolean
  antec_alcohol?: boolean
  antec_otras_sustancias?: boolean
  antec_cirugia?: boolean
  antec_cancer?: boolean
  antec_tiroides?: boolean
  antec_otros?: string | null
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

// ── Check-in semanal ICS (tabla checkins_semanales) ───────────
export interface CheckinSemanal {
  id: string
  user_id: string
  week_start: string
  ica_days: number[]        // 5 valores [0-7], uno por conducta
  ica_barriers: number      // [0-3]
  be_energy: number         // [1-5]
  be_regulation: number     // [1|3|5]
  ini_score: number         // [1|3|5] — mantenido para compatibilidad con motor ICS
  // ── Nuevos campos (migración 013) ──
  emocion_principal: EmocionPrincipal | null
  saboteador_score: number | null  // [1-7]
  observador_score: number | null  // [1-7]
  semaphore: SemaforoICS
  alerts: string[]          // be_critical, ini_saboteador, ica_zero, combined_risk
  scores: {
    ica: number
    be: number
    be_norm: number
    ini: number
    ini_norm: number
    ics: number
  }
  dominant_domain: 'ica' | 'be' | 'ini'
  submitted_at: string
  created_at: string
}

// ── Alertas ICS (tabla alerts — motor de alertas) ─────────────
export interface Alert {
  id: string
  patient_id: string
  type: AlertType
  color: AlertColor
  assign_to: string         // medica, coach, coach_urgent, coach_note, auto
  message: string
  priority: number          // 1=urgente, 1.5-1.8=alto, 2=normal, 3+=bajo
  scores: Record<string, number> | null
  is_read: boolean
  week_start: string | null
  created_at: string
}

// ── Racha verde (tabla rachas) ────────────────────────────────
export interface Racha {
  id: string
  paciente_id: string
  tipo: 'green_streak' | 'ini_saboteador'
  semanas_consecutivas: number
  ultimo_hito: number | null
  updated_at: string
}

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
  video_visto: boolean
}

// ── Registro diario (tabla registros_diarios) ─────────────────
export interface RegistroDiario {
  id: string
  paciente_id: string
  fecha: string          // YYYY-MM-DD
  energia_dia: number    // 1-5
  animo_dia: number      // 1-5
  conductas_hoy: boolean[]  // array de 5 booleans
  nota_libre: string | null
  created_at: string
}

export type InsertRegistroDiario = Omit<RegistroDiario, 'id' | 'created_at'>

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

// ── Gimnasio (tablas contenidos_gimnasio + progreso_gimnasio) ────
export type TipoContenido = 'audio' | 'video' | 'lectura'
export type CategoriaContenido = 'conductas_ancla' | 'saboteador_sabio' | 'gimnasia_mental' | 'habitos' | 'general'

export interface ContenidoGimnasio {
  id: string
  titulo: string
  descripcion: string | null
  tipo: TipoContenido
  url: string | null
  duracion_min: number
  categoria: CategoriaContenido
  orden: number
  activo: boolean
  created_at: string
}

export interface ProgresoGimnasio {
  id: string
  usuario_id: string
  contenido_id: string
  completado_at: string
  minutos_vistos: number
}

// ── Feedback ──────────────────────────────────────────────────
export type TipoFeedback = 'app' | 'mejora_individual' | 'general'

export interface FeedbackRespuesta {
  id: string
  usuario_id: string
  tipo: TipoFeedback
  rating: number | null
  que_funciona: string | null
  que_mejorar: string | null
  comentario: string | null
  progreso_percibido: number | null
  semana_inicio: string | null
  created_at: string
}

// ── Emociones principales (Brújula Emocional) ──────────────────
export const EMOCIONES_PRINCIPALES: { key: EmocionPrincipal; label: string; emoji: string }[] = [
  { key: 'alegre',       label: 'Alegre',        emoji: '😊' },
  { key: 'en_calma',     label: 'En calma',       emoji: '😌' },
  { key: 'sensible',     label: 'Sensible',       emoji: '🥹' },
  { key: 'preocupado',   label: 'Preocupado/a',   emoji: '😟' },
  { key: 'cansado',      label: 'Cansado/a',      emoji: '😴' },
  { key: 'esperanzado',  label: 'Esperanzado/a',  emoji: '🌱' },
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
