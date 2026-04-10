'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

function CompassLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="19" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1.5"/>
      <circle cx="20" cy="20" r="12" fill="none" stroke="#1E3A5F" strokeWidth="1.5" strokeOpacity="0.25"/>
      <circle cx="20" cy="20" r="2.5" fill="#1E3A5F"/>
      <path d="M20 10L22 18L20 20L18 18Z" fill="#1E3A5F"/>
      <path d="M20 30L18 22L20 20L22 22Z" fill="#94A3B8"/>
      <path d="M10 20L18 18L20 20L18 22Z" fill="#94A3B8"/>
      <path d="M30 20L22 22L20 20L22 18Z" fill="#1E3A5F" fillOpacity="0.45"/>
    </svg>
  )
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled]   = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-white transition-shadow duration-200 ${
        scrolled ? 'shadow-sm border-b border-[#E5E7EB]' : 'border-b border-transparent'
      }`}
    >
      <nav className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <CompassLogo />
          <span className="font-bold text-[15px] text-[#0F1C2E] tracking-tight hidden sm:inline">
            Mi Brújula de Salud
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-7 text-sm font-medium text-[#4B5563]">
          <li>
            <a href="#producto" className="hover:text-[#1E3A5F] transition-colors">Producto</a>
          </li>
          <li>
            <a href="#para-equipos" className="hover:text-[#1E3A5F] transition-colors">Para equipos</a>
          </li>
        </ul>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-[#4B5563] hover:text-[#1E3A5F] transition-colors"
          >
            Ingresar
          </Link>
          <a
            href="#acceso"
            className="text-sm font-semibold bg-[#1E3A5F] text-white px-4 py-2 rounded-lg hover:bg-[#162d4a] transition-colors"
          >
            Solicitar información
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(v => !v)}
          className="md:hidden p-2 rounded-lg text-[#4B5563] hover:bg-[#F3F4F6] transition-colors"
          aria-label="Abrir menú"
        >
          {menuOpen ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-[#F3F4F6] px-5 py-4 space-y-1">
          <a href="#producto"     onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-[#374151] py-2.5 border-b border-[#F9FAFB]">Producto</a>
          <a href="#para-equipos" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-[#374151] py-2.5 border-b border-[#F9FAFB]">Para equipos</a>
          <div className="pt-3 flex flex-col gap-2">
            <Link href="/login" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-[#4B5563] py-2">
              Ingresar
            </Link>
            <a
              href="#acceso"
              onClick={() => setMenuOpen(false)}
              className="block text-sm font-semibold bg-[#1E3A5F] text-white px-4 py-2.5 rounded-lg text-center"
            >
              Solicitar información
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
