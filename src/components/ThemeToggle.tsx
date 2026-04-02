'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

interface Props {
  /** 'icon' = solo icono (nav mobile), 'full' = icono + label (sidebar desktop) */
  variant?: 'icon' | 'full'
  className?: string
}

export default function ThemeToggle({ variant = 'icon', className = '' }: Props) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Evita hydration mismatch: no renderizar hasta que el cliente conozca el tema
  useEffect(() => setMounted(true), [])
  if (!mounted) return <span className="w-5 h-5 inline-block" />

  const isDark = resolvedTheme === 'dark'

  function toggle() {
    setTheme(isDark ? 'light' : 'dark')
  }

  if (variant === 'full') {
    return (
      <button
        onClick={toggle}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${className}`}
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-subtle)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
        {isDark ? 'Modo claro' : 'Modo oscuro'}
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      className={`flex flex-col items-center pt-2 pb-3 gap-0.5 transition-colors ${className}`}
      style={{ color: 'var(--text-muted)' }}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      <span className="opacity-60">
        {isDark ? <SunIcon size={20} /> : <MoonIcon size={20} />}
      </span>
      <span className="text-[9px] font-semibold tracking-wide">Tema</span>
    </button>
  )
}

function SunIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function MoonIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M17.5 12.5A7.5 7.5 0 017.5 2.5a7.5 7.5 0 100 15 7.5 7.5 0 0010-5z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  )
}
