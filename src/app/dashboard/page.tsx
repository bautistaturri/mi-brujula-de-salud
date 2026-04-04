import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getWeekStart } from '@/lib/utils'
import GrupoOverview from '@/components/facilitator/GrupoOverview'
import type { EstadoPaciente } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: grupos } = await supabase
    .from('grupos')
    .select('*')
    .eq('facilitador_id', user.id)
    .eq('activo', true)

  const { data: pacientes } = await supabase
    .from('vista_estado_pacientes')
    .select('*')
    .in('grupo_id', (grupos ?? []).map(g => g.id))
    .order('score_riesgo', { ascending: false })

  const hoy = new Date().toISOString().split('T')[0]
  const totalPacientes = (pacientes ?? []).length
  const registradosHoy = (pacientes ?? []).filter(p => p.ultimo_checkin === hoy).length
  const enAmarillo = (pacientes ?? []).filter(p => p.semaforo === 'amarillo').length
  const enRojo = (pacientes ?? []).filter(p => p.semaforo === 'rojo').length

  // Pacientes con registro semanal crítico esta semana (requiere_atencion = true)
  const pacienteIds = (pacientes ?? []).map(p => p.id)
  const { data: registrosCriticos } = pacienteIds.length > 0
    ? await supabase
        .from('registros_semanales')
        .select('paciente_id, animo, sueno')
        .in('paciente_id', pacienteIds)
        .eq('requiere_atencion', true)
        .gte('semana_inicio', getWeekStart())
    : { data: [] }

  const pacientesConAlerta = (registrosCriticos ?? []).map(r => ({
    ...r,
    nombre: (pacientes ?? []).find(p => p.id === r.paciente_id)?.nombre ?? 'Paciente',
  }))

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl">

      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-1">
          {new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="font-heading text-h1 font-bold text-text-primary">Panel de seguimiento</h1>
      </div>

      {/* Banner de alertas críticas semanales */}
      {pacientesConAlerta.length > 0 && (
        <div
          className="rounded-2xl p-5 border-2"
          style={{ background: '#FEF2F2', borderColor: '#FECACA' }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
              style={{ background: '#FEE2E2' }}
            >
              🚨
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: '#991B1B' }}>
                {pacientesConAlerta.length === 1
                  ? '1 paciente requiere atención urgente esta semana'
                  : `${pacientesConAlerta.length} pacientes requieren atención urgente esta semana`}
              </p>
              <p className="text-xs mt-0.5 mb-3" style={{ color: '#B91C1C' }}>
                Registraron ánimo o sueño muy bajos en su registro semanal.
              </p>
              <div className="flex flex-wrap gap-2">
                {pacientesConAlerta.map(p => (
                  <Link
                    key={p.paciente_id}
                    href={`/dashboard/paciente/${p.paciente_id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' }}
                  >
                    <span>{p.nombre}</span>
                    <span style={{ opacity: 0.7 }}>
                      · ánimo {p.animo}/5, sueño {p.sueno}/5
                    </span>
                    <span>→</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total pacientes"
          value={totalPacientes}
          trend={null}
          accent="#2563EB"
          accentBg="#EFF6FF"
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="8" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M2 18c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="15" cy="7" r="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M17 14c0-1.66-1.34-3-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          }
        />
        <KpiCard
          label="Registros hoy"
          value={registradosHoy}
          sub={`de ${totalPacientes}`}
          trend={totalPacientes > 0 ? Math.round((registradosHoy / totalPacientes) * 100) : 0}
          trendSuffix="%"
          accent="#10B981"
          accentBg="#ECFDF5"
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        />
        <KpiCard
          label="En amarillo"
          value={enAmarillo}
          trend={null}
          accent="#F59E0B"
          accentBg="#FFFBEB"
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 3l7 13H3L10 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M10 9v4M10 14.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          }
        />
        <KpiCard
          label="Requieren atención"
          value={enRojo}
          trend={null}
          accent="#EF4444"
          accentBg="#FEF2F2"
          urgent={enRojo > 0}
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 6v5M10 12.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          }
        />
      </div>

      {/* Vista grupal */}
      <GrupoOverview
        grupos={grupos ?? []}
        pacientes={(pacientes ?? []) as EstadoPaciente[]}
      />
    </div>
  )
}

function KpiCard({
  label,
  value,
  sub,
  trend,
  trendSuffix = '',
  accent,
  accentBg,
  icon,
  urgent = false,
}: {
  label: string
  value: number
  sub?: string
  trend: number | null
  trendSuffix?: string
  accent: string
  accentBg: string
  icon: React.ReactNode
  urgent?: boolean
}) {
  return (
    <div
      className="rounded-2xl p-5 transition-shadow"
      style={{
        background: 'var(--surface-card)',
        border: urgent ? `1px solid ${accent}` : '1px solid var(--border-default)',
        boxShadow: urgent ? `0 0 0 3px ${accentBg}` : '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: accentBg, color: accent }}
        >
          {icon}
        </div>
        {trend !== null && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: accentBg, color: accent }}>
            {trend}{trendSuffix}
          </span>
        )}
      </div>
      <div className="font-metric text-3xl font-bold text-text-primary tabular-nums">
        {value}
        {sub && <span className="text-base font-normal text-text-muted ml-1">{sub}</span>}
      </div>
      <p className="text-xs font-medium text-text-secondary mt-0.5">{label}</p>
    </div>
  )
}
