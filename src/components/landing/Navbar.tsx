'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 transition-shadow duration-200 ${
        scrolled ? 'shadow-md' : 'shadow-none'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-gray-900 shrink-0">
          <span className="text-2xl">🧭</span>
          <span className="hidden sm:inline">Mi Brújula de Salud</span>
          <span className="sm:hidden">Mi Brújula</span>
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <li>
            <a href="#funcionalidades" className="hover:text-blue-600 transition-colors">
              Funcionalidades
            </a>
          </li>
          <li>
            <a href="#como-funciona" className="hover:text-blue-600 transition-colors">
              Cómo funciona
            </a>
          </li>
          <li>
            <a href="#precios" className="hover:text-blue-600 transition-colors">
              Precios
            </a>
          </li>
        </ul>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Comenzar gratis
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
          <a
            href="#funcionalidades"
            onClick={() => setMenuOpen(false)}
            className="block text-sm font-medium text-gray-700 hover:text-blue-600 py-2"
          >
            Funcionalidades
          </a>
          <a
            href="#como-funciona"
            onClick={() => setMenuOpen(false)}
            className="block text-sm font-medium text-gray-700 hover:text-blue-600 py-2"
          >
            Cómo funciona
          </a>
          <a
            href="#precios"
            onClick={() => setMenuOpen(false)}
            className="block text-sm font-medium text-gray-700 hover:text-blue-600 py-2"
          >
            Precios
          </a>
          <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="block text-sm font-medium text-gray-700 hover:text-blue-600 py-2"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              onClick={() => setMenuOpen(false)}
              className="block text-sm font-semibold bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-center"
            >
              Comenzar gratis
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
