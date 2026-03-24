import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GrupoOverview from '@/components/facilitator/GrupoOverview'
import type { EstadoPaciente } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Grupos del facilitador
  const { data: grupos } = await supabase
    .from('grupos')
    .select('*')
    .eq('facilitador_id', user.id)
    .eq('activo', true)

  // Estado de todos los pacientes (vista)
  const { data: pacientes } = await supabase
    .from('vista_estado_pacientes')
    .select('*')
    .in('grupo_id', (grupos ?? []).map(g => g.id))
    .order('score_riesgo', { ascending: false })

  // Stats globales del día
  const hoy = new Date().toISOString().split('T')[0]
  const registradosHoy = (pacientes ?? []).filter(p => p.ultimo_checkin === hoy).length
  const enRojo = (pacientes ?? []).filter(p => p.semaforo === 'rojo').length
  const enAmarillo = (pacientes ?? []).filter(p => p.semaforo === 'amarillo').length

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Panel de seguimiento</h1>
        <p className="text-slate-500 mt-1">
          {new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total pacientes"
          value={(pacientes ?? []).length}
          icon="👥"
          color="bg-blue-50 border-blue-200"
        />
        <KpiCard
          label="Registros hoy"
          value={registradosHoy}
          icon="✅"
          color="bg-green-50 border-green-200"
          sub={`de ${(pacientes ?? []).length}`}
        />
        <KpiCard
          label="En amarillo"
          value={enAmarillo}
          icon="🟡"
          color="bg-yellow-50 border-yellow-200"
        />
        <KpiCard
          label="En rojo (urgente)"
          value={enRojo}
          icon="🔴"
          color="bg-red-50 border-red-200"
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
  icon,
  color,
  sub,
}: {
  label: string
  value: number
  icon: string
  color: string
  sub?: string
}) {
  return (
    <div className={`rounded-2xl border p-5 ${color}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold text-slate-800">
        {value}
        {sub && <span className="text-base font-normal text-slate-400"> {sub}</span>}
      </div>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}
