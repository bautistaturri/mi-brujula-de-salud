'use client'

import Link from 'next/link'
import type { RegistroDiario } from '@/types/database'

interface Props {
  registrosSemana: RegistroDiario[]  // registros de la semana actual (lun-dom)
  fechaHoy: string                    // YYYY-MM-DD
  yaRegistroHoy: boolean
}

const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

// Devuelve el lunes de la semana a la que pertenece fecha (ISO 8601)
function getLunesDeSemana(fecha: string): Date {
  const d = new Date(fecha + 'T00:00:00')
  const dia = d.getDay()                      // 0=dom, 1=lun...
  const diff = dia === 0 ? -6 : 1 - dia      // offset hacia el lunes
  d.setDate(d.getDate() + diff)
  return d
}

// Genera los 7 días YYYY-MM-DD de la semana del lunes
// Sin toISOString() para evitar conversión UTC que puede cambiar la fecha
function diasDeSemana(lunes: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes)
    d.setDate(lunes.getDate() + i)
    const y  = d.getFullYear()
    const m  = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${dd}`
  })
}

// Detecta días consecutivos desde hoy hacia atrás
function diasConsecutivos(fechas: Set<string>, fechaHoy: string): number {
  let count = 0
  let current = new Date(fechaHoy + 'T00:00:00')
  while (true) {
    const y  = current.getFullYear()
    const m  = String(current.getMonth() + 1).padStart(2, '0')
    const dd = String(current.getDate()).padStart(2, '0')
    const key = `${y}-${m}-${dd}`
    if (!fechas.has(key)) break
    count++
    current.setDate(current.getDate() - 1)
  }
  return count
}

export default function SemanaWidget({ registrosSemana, fechaHoy, yaRegistroHoy }: Props) {
  const lunes = getLunesDeSemana(fechaHoy)
  const dias = diasDeSemana(lunes)

  // Mapa fecha → registro para lookup O(1)
  const porFecha = new Map(registrosSemana.map(r => [r.fecha, r]))

  // Todas las fechas con registro (para calcular racha total)
  const fechasConRegistro = new Set(registrosSemana.map(r => r.fecha))
  const racha = diasConsecutivos(fechasConRegistro, fechaHoy)

  function getColorDia(fecha: string): string {
    const hoy = new Date(fechaHoy + 'T00:00:00')
    const d   = new Date(fecha + 'T00:00:00')
    const esFuturo = d > hoy

    if (esFuturo) return 'bg-[#F3F4F6] border-[#E5E7EB] text-[#D1D5DB]'

    const r = porFecha.get(fecha)
    if (!r) return 'bg-[#F3F4F6] border-[#E5E7EB] text-[#9CA3AF]'       // no registró

    const energia = r.energia_dia
    if (energia >= 4) return 'bg-[#D6EFE1] border-[#A8D5B5] text-[#1A6B3C]'  // verde
    if (energia >= 2) return 'bg-[#FDE8CC] border-[#F4C07A] text-[#8B4800]'  // amarillo
    return 'bg-[#FADDDD] border-[#F5AEAE] text-[#8B1A1A]'                     // rojo
  }

  function getPuntoDia(fecha: string): string {
    const d = new Date(fecha + 'T00:00:00')
    const hoy = new Date(fechaHoy + 'T00:00:00')
    if (d > hoy) return ''

    const r = porFecha.get(fecha)
    if (!r) return '·'

    const energia = r.energia_dia
    if (energia >= 4) return '●'
    if (energia >= 2) return '●'
    return '●'
  }

  const registrosEnSemana = dias.filter(d => porFecha.has(d)).length

  return (
    <div className="mx-5 mt-4">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#1F2937]">Mi semana hasta hoy</h3>
          <span className="text-xs text-[#9CA3AF]">{registrosEnSemana}/7 días</span>
        </div>

        {/* Mini calendario */}
        <div className="grid grid-cols-7 gap-1.5 mb-3">
          {DIAS_SEMANA.map((label, i) => {
            const fecha = dias[i]
            const color = getColorDia(fecha)
            const esHoy = fecha === fechaHoy
            return (
              <div key={fecha} className="flex flex-col items-center gap-1">
                <span className="text-[9px] font-bold text-[#9CA3AF] uppercase">{label}</span>
                <div
                  className={`w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-bold transition-all ${color} ${
                    esHoy ? 'ring-2 ring-[#2A7B6F] ring-offset-1' : ''
                  }`}
                >
                  {getPuntoDia(fecha)}
                </div>
              </div>
            )
          })}
        </div>

        {/* Leyenda */}
        <div className="flex gap-3 text-[9px] text-[#9CA3AF] mb-3 flex-wrap">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#A8D5B5] inline-block" />Energía alta</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#F4C07A] inline-block" />Energía media</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#F5AEAE] inline-block" />Energía baja</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#E5E7EB] inline-block" />Sin registro</span>
        </div>

        {/* Racha motivacional */}
        {racha >= 3 && (
          <div className="bg-[#FDF3D0] rounded-xl px-3 py-2 flex items-center gap-2 mb-3">
            <span className="text-base">🔥</span>
            <p className="text-xs font-semibold text-[#8B4800]">
              ¡Llevas {racha} días consecutivos registrando! Seguí así.
            </p>
          </div>
        )}

        {/* CTA */}
        {!yaRegistroHoy ? (
          <Link
            href="/registro-diario"
            className="w-full block text-center py-2.5 rounded-xl bg-[#2A7B6F] text-white text-sm font-semibold hover:opacity-90 transition"
          >
            + Registrar hoy
          </Link>
        ) : (
          <p className="text-center text-xs text-[#4A9E6B] font-medium py-1">
            ✓ Hoy registrado
          </p>
        )}
      </div>
    </div>
  )
}
