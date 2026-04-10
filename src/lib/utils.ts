import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Semaforo, SemaforoICS } from '@/types/database'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calcularSemaforo(iem: number, conductasCompletadas: number): Semaforo {
  if (iem >= 5 && conductasCompletadas >= 4) return 'verde'
  if (iem <= 2 || conductasCompletadas <= 1) return 'rojo'
  return 'amarillo'
}

export function formatFecha(fecha: string): string {
  const date = new Date(fecha + 'T00:00:00')
  if (isToday(date)) return 'Hoy'
  if (isYesterday(date)) return 'Ayer'
  return format(date, "d 'de' MMMM", { locale: es })
}

export function formatRelativo(fecha: string): string {
  return formatDistanceToNow(new Date(fecha), { locale: es, addSuffix: true })
}

export function formatFechaCorta(fecha: string): string {
  return format(new Date(fecha + 'T00:00:00'), 'dd/MM', { locale: es })
}

export function scoreRiesgoLabel(score: number): { label: string; color: string } {
  if (score >= 60) return { label: 'Alto', color: 'text-red-600' }
  if (score >= 30) return { label: 'Medio', color: 'text-yellow-600' }
  return { label: 'Bajo', color: 'text-green-600' }
}

export function iemLabel(iem: number): string {
  const labels: Record<number, string> = {
    1: 'Sin energía',
    2: 'Muy bajo',
    3: 'Bajo',
    4: 'Moderado',
    5: 'Bien',
    6: 'Muy bien',
    7: 'Excelente',
  }
  return labels[iem] ?? ''
}

/**
 * Convierte el semáforo ICS (inglés, motor) al semáforo de display (español, UI)
 */
export function icsToSemaforo(semaphore: SemaforoICS): Semaforo {
  const map: Record<SemaforoICS, Semaforo> = {
    green: 'verde',
    amber: 'amarillo',
    red:   'rojo',
  }
  return map[semaphore]
}

export function getDiasUltimaSemana(): string[] {
  const dias: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dias.push(d.toISOString().split('T')[0])
  }
  return dias
}

/**
 * Devuelve la fecha de hoy en formato YYYY-MM-DD en zona horaria Argentina (UTC-3).
 * Usar siempre en lugar de `new Date().toISOString().split('T')[0]` en el servidor,
 * que usa UTC y produce fecha incorrecta para usuarios argentinos después de las 21hs.
 */
export function getTodayAR(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date())
}

/**
 * Devuelve el lunes de la semana actual en formato YYYY-MM-DD (zona Argentina).
 * Usado para agrupar check-ins y registros semanales.
 */
export function getWeekStart(): string {
  const today = getTodayAR()               // YYYY-MM-DD en zona AR
  const d = new Date(today + 'T00:00:00')  // sin conversión UTC
  const day = d.getDay()                   // 0=dom, 1=lun...
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  // Formatear como YYYY-MM-DD sin toISOString (evita volver a UTC)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}
