'use client'

interface SemanaAnterior {
  semaphore: 'green' | 'amber' | 'red'
}

interface Props {
  nombre: string
  semanaAnterior: SemanaAnterior | null
  esPrimerCheckin: boolean
  checkinHref?: string
}

export default function BienvenidaPersonalizada({
  nombre,
  semanaAnterior,
  esPrimerCheckin,
  checkinHref = '/dashboard/paciente/checkin',
}: Props) {
  const primerNombre = nombre.split(' ')[0]
  const diaSemana = new Date().getDay() // 0=dom, 1=lun ... 6=sab

  let titulo = ''
  let cuerpo = ''

  if (esPrimerCheckin) {
    titulo = `Hola ${primerNombre}, bienvenido/a 🌿`
    cuerpo = 'Empecemos juntos. Tu primer check-in tarda solo 2 minutos.'
  } else if (diaSemana === 1 || diaSemana === 2) {
    titulo = `Hola ${primerNombre} 👋`
    cuerpo = '¿Cómo arrancaste la semana? Es un buen momento para tu check-in semanal.'
  } else if (diaSemana === 3 || diaSemana === 4) {
    titulo = `Hola ${primerNombre}`
    cuerpo = 'Ya estamos a mitad de semana. Tomá 2 minutos para registrar cómo te está yendo.'
  } else {
    titulo = `Hola ${primerNombre}`
    cuerpo = 'La semana casi termina. ¿Querés cerrarla con tu check-in antes del lunes?'
  }

  let badge: { texto: string; bg: string; color: string } | null = null
  if (!esPrimerCheckin && semanaAnterior) {
    if (semanaAnterior.semaphore === 'green') {
      badge = { texto: 'La semana pasada estuviste en zona verde 🌟 ¡Seguí así!', bg: '#D6EFE1', color: '#1A6B3C' }
    } else if (semanaAnterior.semaphore === 'red') {
      badge = { texto: 'Esta semana es una nueva oportunidad 💙', bg: '#E8ECF5', color: '#1B3A5C' }
    }
  }

  return (
    <div className="mx-5 mt-5 bg-gradient-to-br from-[#1B3A5C] to-[#2A4F7A] rounded-3xl p-6 text-white">
      <p className="text-sm opacity-70 mb-1">Esta semana</p>
      <h2 className="font-serif text-2xl leading-snug mb-2">{titulo}</h2>
      <p className="text-sm opacity-80 leading-relaxed mb-4">{cuerpo}</p>

      {badge && (
        <div
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold mb-4"
          style={{ background: badge.bg, color: badge.color }}
        >
          {badge.texto}
        </div>
      )}

      <a
        href={checkinHref}
        className="inline-flex items-center gap-2 bg-white text-[#1B3A5C] font-bold px-5 py-3 rounded-2xl text-sm hover:bg-[#F9FAFB] transition"
      >
        Completar mi check-in semanal →
      </a>
    </div>
  )
}
