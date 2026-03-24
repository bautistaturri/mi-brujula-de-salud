'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Grupo, User } from '@/types/database'

interface Props {
  grupos: Grupo[]
  miembros: { grupo_id: string; user_id: string }[]
  pacientes: Pick<User, 'id' | 'nombre' | 'email'>[]
  facilitadorId: string
}

export default function GruposManager({ grupos: gruposIniciales, miembros, pacientes, facilitadorId }: Props) {
  const router = useRouter()
  const [grupos, setGrupos] = useState(gruposIniciales)
  const [creando, setCreando] = useState(false)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [emailPaciente, setEmailPaciente] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function crearGrupo(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error: err } = await supabase
      .from('grupos')
      .insert({ nombre, descripcion: descripcion || null, facilitador_id: facilitadorId })
      .select()
      .single()

    if (err) {
      setError(err.message)
    } else {
      setGrupos(prev => [data as Grupo, ...prev])
      setNombre('')
      setDescripcion('')
      setCreando(false)
      router.refresh()
    }
    setLoading(false)
  }

  async function agregarPaciente(grupoId: string) {
    setError('')
    const supabase = createClient()

    // Buscar paciente por email
    const { data: paciente } = await supabase
      .from('users')
      .select('id, nombre')
      .eq('email', emailPaciente.trim())
      .eq('role', 'paciente')
      .single()

    if (!paciente) {
      setError('No se encontró un paciente con ese email')
      return
    }

    const { error: err } = await supabase
      .from('grupo_miembros')
      .insert({ grupo_id: grupoId, user_id: paciente.id })

    if (err) {
      setError('Este paciente ya está en el grupo')
    } else {
      setEmailPaciente('')
      router.refresh()
    }
  }

  const getMiembrosGrupo = (grupoId: string) =>
    miembros.filter(m => m.grupo_id === grupoId)
      .map(m => pacientes.find(p => p.id === m.user_id))
      .filter(Boolean) as Pick<User, 'id' | 'nombre' | 'email'>[]

  return (
    <div className="space-y-4">
      {/* Botón crear grupo */}
      {!creando ? (
        <button
          onClick={() => setCreando(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          <span>+</span> Crear nuevo grupo
        </button>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-blue-200 p-6">
          <h3 className="font-semibold text-slate-700 mb-4">Nuevo grupo</h3>
          <form onSubmit={crearGrupo} className="space-y-3">
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Nombre del grupo"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
            />
            <input
              type="text"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Descripción (opcional)"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCreando(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {loading ? 'Creando...' : 'Crear grupo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de grupos */}
      {grupos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="text-4xl mb-3">👥</div>
          <p className="text-slate-500">Crea tu primer grupo para empezar</p>
        </div>
      ) : (
        grupos.map(grupo => {
          const miembrosGrupo = getMiembrosGrupo(grupo.id)
          return (
            <div key={grupo.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">{grupo.nombre}</h3>
                  {grupo.descripcion && <p className="text-sm text-slate-400">{grupo.descripcion}</p>}
                </div>
                <span className="text-sm text-slate-400">{miembrosGrupo.length} miembros</span>
              </div>

              <div className="p-6 space-y-4">
                {/* Miembros */}
                <div className="space-y-2">
                  {miembrosGrupo.map(p => (
                    <div key={p.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                          {p.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700">{p.nombre}</p>
                          <p className="text-xs text-slate-400">{p.email}</p>
                        </div>
                      </div>
                      <Link
                        href={`/dashboard/paciente/${p.id}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Ver ficha →
                      </Link>
                    </div>
                  ))}
                </div>

                {/* Agregar paciente */}
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <input
                    type="email"
                    value={emailPaciente}
                    onChange={e => setEmailPaciente(e.target.value)}
                    placeholder="Email del paciente"
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                  />
                  <button
                    onClick={() => agregarPaciente(grupo.id)}
                    className="text-sm bg-slate-800 hover:bg-slate-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    + Agregar
                  </button>
                </div>
                {error && <p className="text-xs text-red-500">{error}</p>}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
