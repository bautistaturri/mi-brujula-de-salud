import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🧭</div>
        <h1 className="text-4xl font-extrabold text-slate-800 mb-2">Página no encontrada</h1>
        <p className="text-slate-500 mb-8">
          La página que buscás no existe o fue movida.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Ir al inicio
          </Link>
          <Link
            href="/login"
            className="border-2 border-slate-200 hover:border-blue-300 text-slate-700 font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  )
}
