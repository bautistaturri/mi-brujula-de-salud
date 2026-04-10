'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import type { User } from '@/types/database'

interface Props {
  user: User
}

function ThemeRow() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const isDark = resolvedTheme === 'dark'
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="w-full flex items-center justify-between py-3 px-4 bg-surface-card rounded-2xl border shadow-sm hover:bg-surface-subtle transition"
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{isDark ? '☀️' : '🌙'}</span>
        <span className="text-sm font-medium text-text-primary">
          {isDark ? 'Modo claro' : 'Modo oscuro'}
        </span>
      </div>
      <span className="text-xs text-text-muted">Cambiar</span>
    </button>
  )
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="text-sm font-medium text-text-primary">{value}</span>
    </div>
  )
}

export default function PerfilPacienteClient({ user }: Props) {
  return (
    <div className="pb-8">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-4 mb-4">
          {user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar_url}
              alt={user.nombre}
              className="w-16 h-16 rounded-full object-cover border-2"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
              style={{ background: 'var(--semaforo-verde-bg)', color: 'var(--semaforo-verde-text)' }}
            >
              {user.nombre.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="font-serif text-[22px] text-text-primary leading-tight">{user.nombre}</h1>
            <p className="text-sm text-text-muted">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Apariencia */}
      <div className="px-5 mb-6">
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-text-muted mb-3">Apariencia</h2>
        <ThemeRow />
      </div>

      {/* Datos personales */}
      {(user.peso_inicial || user.altura) && (
        <div className="px-5 mb-6">
          <h2 className="text-[13px] font-bold uppercase tracking-wider text-text-muted mb-3">Datos de salud</h2>
          <div className="bg-surface-card rounded-2xl border p-4 shadow-sm">
            <InfoRow
              label="Peso inicial"
              value={user.peso_inicial ? `${user.peso_inicial} kg` : null}
            />
            <InfoRow
              label="Altura"
              value={user.altura ? `${user.altura} cm` : null}
            />
            <InfoRow
              label="Medicación"
              value={
                user.toma_medicacion === true
                  ? (user.detalle_medicacion ?? 'Sí')
                  : user.toma_medicacion === false
                  ? 'No'
                  : null
              }
            />
          </div>
        </div>
      )}

      {/* Antecedentes */}
      {(user.antec_tabaquismo || user.antec_alcohol || user.antec_otras_sustancias ||
        user.antec_cirugia || user.antec_cancer || user.antec_tiroides || user.antec_otros) && (
        <div className="px-5 mb-6">
          <h2 className="text-[13px] font-bold uppercase tracking-wider text-text-muted mb-3">Antecedentes</h2>
          <div className="bg-surface-card rounded-2xl border p-4 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {user.antec_tabaquismo && <Chip label="Tabaquismo" />}
              {user.antec_alcohol && <Chip label="Alcohol" />}
              {user.antec_otras_sustancias && <Chip label="Otras sustancias" />}
              {user.antec_cirugia && <Chip label="Cirugías" />}
              {user.antec_cancer && <Chip label="Cáncer" />}
              {user.antec_tiroides && <Chip label="Tiroides" />}
            </div>
            {user.antec_otros && (
              <p className="text-sm text-text-secondary mt-3">{user.antec_otros}</p>
            )}
          </div>
        </div>
      )}

      {/* Contacto */}
      {user.whatsapp && (
        <div className="px-5 mb-6">
          <h2 className="text-[13px] font-bold uppercase tracking-wider text-text-muted mb-3">Contacto</h2>
          <div className="bg-surface-card rounded-2xl border p-4 shadow-sm">
            <InfoRow label="WhatsApp" value={user.whatsapp} />
          </div>
        </div>
      )}
    </div>
  )
}

function Chip({ label }: { label: string }) {
  return (
    <span className="px-3 py-1 text-xs font-medium bg-surface-subtle text-text-secondary rounded-full">
      {label}
    </span>
  )
}
